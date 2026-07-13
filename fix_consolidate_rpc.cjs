const fs = require('fs');
let code = fs.readFileSync('services/supabaseService.ts', 'utf8');

const consolidateTarget = /const \{ data, error \} = await supabase\.rpc\('consolidate_pallets'[\s\S]*?mapInventoryRow\(data\.data\)\n    \};/;

const consolidateReplacement = `const { data: children, error: fetchError } = await supabase.from('inventory').select('*').in('id', childIds);
    if (fetchError || !children || children.length < 2) throw new Error('Falha ao buscar pallets para consolidação.');

    const firstChild = children[0];
    const loadingId = 'PC' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    
    let totalPallets = 0;
    let totalBottles = 0;
    
    children.forEach((child: any) => {
      totalPallets += child.pallets || 0;
      totalBottles += (child.inspections?.[0]?.bottles) || 0;
    });

    const newParent = {
      id: parentId,
      loading_id: loadingId,
      origin_op: firstChild.origin_op,
      description: firstChild.description,
      lot: firstChild.lot,
      pallets: totalPallets,
      status: 'INSPECTED',
      is_group: true,
      parent_group_id: null,
      inspections: [
        {
          ...firstChild.inspections[0],
          bottles: totalBottles
        }
      ]
    };

    const { data: insertedParent, error: insertError } = await supabase.from('inventory').insert(newParent).select('*').single();
    if (insertError) throw insertError;

    const { error: updateError } = await supabase.from('inventory').update({ parent_group_id: parentId }).in('id', childIds);
    if (updateError) throw updateError;
    
    const { error: historyError } = await supabase.from('history').insert({
      id: historyId,
      type: 'transfer',
      loading_id: loadingId,
      origin_op: firstChild.origin_op,
      description: firstChild.description,
      lot: firstChild.lot,
      pallets: totalPallets,
      details: \`Pallets consolidados em \${loadingId}\`,
      user_id: userId,
      user_name: userName
    });

    return {
      success: true,
      group_id: parentId,
      loading_id: loadingId,
      data: mapInventoryRow(insertedParent)
    };`;

code = code.replace(consolidateTarget, consolidateReplacement);

const unconsolidateTarget = /const \{ data, error \} = await supabase\.rpc\('unconsolidate_pallets'[\s\S]*?return data;/;

const unconsolidateReplacement = `const { data: parent, error: parentError } = await supabase.from('inventory').select('*').eq('id', groupId).single();
    if (parentError || !parent) throw new Error('Grupo não encontrado.');

    const { error: updateError } = await supabase.from('inventory').update({ parent_group_id: null }).eq('parent_group_id', groupId);
    if (updateError) throw updateError;

    const { error: deleteError } = await supabase.from('inventory').delete().eq('id', groupId);
    if (deleteError) throw deleteError;

    const { error: historyError } = await supabase.from('history').insert({
      id: historyId,
      type: 'transfer',
      loading_id: parent.loading_id,
      origin_op: parent.origin_op,
      description: parent.description,
      lot: parent.lot,
      pallets: parent.pallets,
      details: \`Desconsolidação do pallet \${parent.loading_id}\`,
      user_id: userId,
      user_name: userName
    });

    return { success: true };`;

code = code.replace(unconsolidateTarget, unconsolidateReplacement);
fs.writeFileSync('services/supabaseService.ts', code);
