-- ==============================================================================
-- ATIVAR SINCRONIZAÇÃO EM TEMPO REAL (REALTIME) NO SUPABASE - STOQUE+
-- ==============================================================================
-- Este script é 100% IDEMPOTENTE e SEGURO contra os erros:
-- - ERROR 42710: relation "..." is already member of publication "supabase_realtime"
-- - ERROR 42P01: relation "..." does not exist
--
-- Pode ser executado no SQL Editor do Supabase a qualquer momento.
-- ==============================================================================

DO $$
DECLARE
  target_tables TEXT[] := ARRAY[
    'inventory',
    'warehouse_slots',
    'shipments',
    'history',
    'inventory_edit_requests',
    'rotative_stock',
    'profiles'
  ];
  t TEXT;
BEGIN
  -- 1. Garante que a publicação 'supabase_realtime' existe
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
    RAISE NOTICE 'Publicação supabase_realtime criada.';
  END IF;

  -- 2. Para cada tabela, verifica se existe e adiciona apenas se ainda não for membro
  FOREACH t IN ARRAY target_tables
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t
    ) THEN
      -- Se a tabela ainda não está na publicação, adiciona
      IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
          AND schemaname = 'public' 
          AND tablename = t
      ) THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', t);
        RAISE NOTICE 'Tabela public.% adicionada à publicação supabase_realtime.', t;
      ELSE
        RAISE NOTICE 'Tabela public.% já era membro de supabase_realtime (ignorado).', t;
      END IF;

      -- Configura REPLICA IDENTITY FULL para que UPDATE e DELETE enviem dados completos
      EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL;', t);
      RAISE NOTICE 'REPLICA IDENTITY FULL configurado em public.%.', t;
    ELSE
      RAISE NOTICE 'Tabela public.% não encontrada neste banco (ignorado).', t;
    END IF;
  END LOOP;
END $$;

-- 3. Visualizar todas as tabelas atualmente ativas no Realtime
SELECT 
  schemaname, 
  tablename 
FROM 
  pg_publication_tables 
WHERE 
  pubname = 'supabase_realtime'
ORDER BY 
  tablename;
