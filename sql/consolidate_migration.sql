ALTER TABLE history ADD COLUMN IF NOT EXISTS details JSONB;
-- Create a sequence for the friendly PC identifier
CREATE SEQUENCE IF NOT EXISTS pallet_group_seq START 1;

CREATE OR REPLACE FUNCTION generate_pallet_group_id() RETURNS TEXT AS $$
BEGIN
  RETURN 'PC' || LPAD(nextval('pallet_group_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Now create the RPC for consolidation
CREATE OR REPLACE FUNCTION consolidate_pallets(
  child_ids TEXT[],
  parent_id TEXT,
  p_user_id UUID,
  p_user_name TEXT,
  p_history_id TEXT
) RETURNS JSONB AS $$
DECLARE
  v_first_child RECORD;
  v_loading_id TEXT;
  v_total_pallets INTEGER := 0;
  v_total_bottles INTEGER := 0;
  v_total_caps INTEGER := 0;
  v_total_boxes INTEGER := 0;
  v_total_cradles INTEGER := 0;
  v_child_id TEXT;
  v_child_row RECORD;
  v_inspections JSONB;
  v_new_inspection JSONB;
  v_parent_row RECORD;
  v_child_history_desc TEXT;
  v_history_details JSONB;
  v_child_loading_ids TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Validate child count
  IF array_length(child_ids, 1) < 2 THEN
    RAISE EXCEPTION 'A consolidação requer pelo menos 2 pallets.';
  END IF;

  -- Read and lock first child for base data
  SELECT * INTO v_first_child FROM inventory WHERE id = child_ids[1] FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pallet base não encontrado.';
  END IF;

  -- Validate base child
  IF v_first_child.is_group = true THEN
    RAISE EXCEPTION 'Não é possível consolidar um pallet que já é um grupo consolidado.';
  END IF;
  IF v_first_child.parent_group_id IS NOT NULL THEN
    RAISE EXCEPTION 'O pallet % já pertence a outro grupo.', v_first_child.loading_id;
  END IF;

  -- Generate friendly ID
  v_loading_id := generate_pallet_group_id();
  
  -- Create empty inspections array for parent
  v_inspections := '[]'::JSONB;

  -- Aggregate quantities and validate compatibility
  v_child_history_desc := 'Pallets agrupados: ';

  FOR i IN 1..array_length(child_ids, 1) LOOP
    v_child_id := child_ids[i];
    SELECT * INTO v_child_row FROM inventory WHERE id = v_child_id FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Pallet % não encontrado.', v_child_id;
    END IF;

    -- Validate group rules
    IF v_child_row.parent_group_id IS NOT NULL THEN
      RAISE EXCEPTION 'O pallet % já pertence a outro grupo.', v_child_row.loading_id;
    END IF;
    IF v_child_row.is_group = true THEN
      RAISE EXCEPTION 'Não é possível consolidar grupos (Pallet %).', v_child_row.loading_id;
    END IF;

    -- Validate compatibility (Produto, tipo de insumo)
    IF v_child_row.description IS DISTINCT FROM v_first_child.description THEN
      RAISE EXCEPTION 'O produto do pallet % difere do pallet base.', v_child_row.loading_id;
    END IF;
    IF (v_child_row.inspections->0->>'contentType') IS DISTINCT FROM (v_first_child.inspections->0->>'contentType') THEN
      RAISE EXCEPTION 'O tipo de conteúdo do pallet % difere.', v_child_row.loading_id;
    END IF;
    IF (v_child_row.inspections->0->>'supplyDescription') IS DISTINCT FROM (v_first_child.inspections->0->>'supplyDescription') THEN
      RAISE EXCEPTION 'A descrição do insumo do pallet % difere.', v_child_row.loading_id;
    END IF;

    -- Append to history description
    IF i > 1 THEN
      v_child_history_desc := v_child_history_desc || ', ';
    END IF;
    v_child_history_desc := v_child_history_desc || v_child_row.loading_id;
    v_child_loading_ids := array_append(v_child_loading_ids, v_child_row.loading_id);

    -- Sum totals (inside inspections[0])
    v_total_pallets := v_total_pallets + COALESCE(v_child_row.pallets, 0);
    v_total_bottles := v_total_bottles + COALESCE((v_child_row.inspections->0->>'bottles')::INTEGER, 0);
    v_total_caps := v_total_caps + COALESCE((v_child_row.inspections->0->>'caps')::INTEGER, 0);
    v_total_boxes := v_total_boxes + COALESCE((v_child_row.inspections->0->>'boxes')::INTEGER, 0);
    v_total_cradles := v_total_cradles + COALESCE((v_child_row.inspections->0->>'cradles')::INTEGER, 0);

    -- Update child to link to parent
    UPDATE inventory SET parent_group_id = parent_id WHERE id = v_child_id;
  END LOOP;

  -- Create parent inspection based on first child's inspection
  v_new_inspection := jsonb_set(
    v_first_child.inspections->0,
    '{bottles}',
    to_jsonb(v_total_bottles)
  );
  v_new_inspection := jsonb_set(v_new_inspection, '{caps}', to_jsonb(v_total_caps));
  v_new_inspection := jsonb_set(v_new_inspection, '{boxes}', to_jsonb(v_total_boxes));
  v_new_inspection := jsonb_set(v_new_inspection, '{cradles}', to_jsonb(v_total_cradles));

  -- Keep the assignedSlot in the parent inspection
  v_inspections := jsonb_insert('[]'::JSONB, '{0}', v_new_inspection);

  -- Create the parent group pallet
  INSERT INTO inventory (
    id, loading_id, origin_op, description, lot, pallets, status,
    date, inspections, operator_name, is_group
  ) VALUES (
    parent_id,
    v_loading_id,
    v_first_child.origin_op,
    v_first_child.description,
    v_first_child.lot,
    v_total_pallets,
    v_first_child.status,
    v_first_child.date,
    v_inspections,
    p_user_name,
    true
  ) RETURNING * INTO v_parent_row;

  -- Occupy warehouse slot with the parent loading ID if first child had a slot
  -- This makes the group represent the physical occupation
  IF v_new_inspection->>'assignedSlot' IS NOT NULL AND v_new_inspection->>'assignedSlot' != 'AGUARDANDO' THEN
     UPDATE warehouse_slots 
     SET occupied_by = v_loading_id, status = v_new_inspection->>'contentType' 
     WHERE id = v_new_inspection->>'assignedSlot';
  END IF;

  -- Build history details JSON
  v_history_details := jsonb_build_object(
    'action', 'CONSOLIDATE',
    'groupId', parent_id,
    'groupLoadingId', v_loading_id,
    'childIds', child_ids,
    'childLoadingIds', v_child_loading_ids
  );

  -- Create history entry for the group creation
  INSERT INTO history (
    id, type, timestamp, loading_id, description, op, user_name, details
  ) VALUES (
    p_history_id,
    'CONSOLIDATE_GROUP',
    timezone('utc', now())::text,
    v_loading_id,
    'Consolidação de grupo. ' || v_child_history_desc,
    COALESCE(v_first_child.origin_op, 'N/A'),
    p_user_name,
    v_history_details::text
  );

  RETURN jsonb_build_object(
    'success', true,
    'group_id', parent_id,
    'loading_id', v_loading_id,
    'data', row_to_json(v_parent_row)
  );
END;
$$ LANGUAGE plpgsql;

-- RPC for Unconsolidate
CREATE OR REPLACE FUNCTION unconsolidate_pallets(
  p_group_id TEXT,
  p_user_id UUID,
  p_user_name TEXT,
  p_history_id TEXT
) RETURNS JSONB AS $$
DECLARE
  v_group_row RECORD;
  v_child_row RECORD;
  v_first_child RECORD;
  v_child_history_desc TEXT := 'Pallets desagrupados: ';
  v_first BOOLEAN := TRUE;
  v_history_details JSONB;
  v_child_ids TEXT[] := ARRAY[]::TEXT[];
  v_child_loading_ids TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Lock group
  SELECT * INTO v_group_row FROM inventory WHERE id = p_group_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Grupo consolidado não encontrado.';
  END IF;

  IF v_group_row.is_group != true THEN
    RAISE EXCEPTION 'Este pallet não é um grupo consolidado.';
  END IF;

  -- Get first child to restore slot occupation
  SELECT * INTO v_first_child FROM inventory WHERE parent_group_id = p_group_id LIMIT 1;

  -- Loop through children
  FOR v_child_row IN SELECT * FROM inventory WHERE parent_group_id = p_group_id FOR UPDATE LOOP
    IF NOT v_first THEN
      v_child_history_desc := v_child_history_desc || ', ';
    END IF;
    v_child_history_desc := v_child_history_desc || v_child_row.loading_id;
    v_child_ids := array_append(v_child_ids, v_child_row.id);
    v_child_loading_ids := array_append(v_child_loading_ids, v_child_row.loading_id);
    v_first := FALSE;

    UPDATE inventory SET parent_group_id = NULL WHERE id = v_child_row.id;
  END LOOP;

  -- Delete the parent group
  DELETE FROM inventory WHERE id = p_group_id;

  -- Restore slot occupation
  IF v_first_child.id IS NOT NULL AND v_first_child.inspections->0->>'assignedSlot' IS NOT NULL THEN
    UPDATE warehouse_slots 
    SET occupied_by = v_first_child.loading_id, 
        status = v_first_child.inspections->0->>'contentType' 
    WHERE occupied_by = v_group_row.loading_id;
  ELSE
    UPDATE warehouse_slots SET status = 'EMPTY', occupied_by = NULL WHERE occupied_by = v_group_row.loading_id;
  END IF;

  -- Build history details JSON
  v_history_details := jsonb_build_object(
    'action', 'UNCONSOLIDATE',
    'groupId', p_group_id,
    'groupLoadingId', v_group_row.loading_id,
    'childIds', v_child_ids,
    'childLoadingIds', v_child_loading_ids
  );

  -- Add history
  INSERT INTO history (
    id, type, timestamp, loading_id, description, op, user_name, details
  ) VALUES (
    p_history_id,
    'UNCONSOLIDATE_GROUP',
    timezone('utc', now())::text,
    v_group_row.loading_id,
    'Desfazimento de grupo. ' || v_child_history_desc,
    COALESCE(v_group_row.origin_op, 'N/A'),
    p_user_name,
    v_history_details::text
  );

  RETURN jsonb_build_object(
    'success', true,
    'group_id', p_group_id,
    'loading_id', v_group_row.loading_id
  );
END;
$$ LANGUAGE plpgsql;

