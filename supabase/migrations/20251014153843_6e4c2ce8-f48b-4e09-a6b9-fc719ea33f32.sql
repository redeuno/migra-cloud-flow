-- Fix RLS so Super Admin can see global financial and dashboard data
-- IMPORTANT: add explicit SELECT policies for super_admin on key tables

-- movimentacoes_financeiras: allow super_admin to SELECT all rows
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'movimentacoes_financeiras'
  ) THEN
    BEGIN
      DROP POLICY IF EXISTS "Super admin view all movimentacoes" ON public.movimentacoes_financeiras;
    EXCEPTION WHEN undefined_object THEN NULL; END;

    CREATE POLICY "Super admin view all movimentacoes"
    ON public.movimentacoes_financeiras
    FOR SELECT
    TO authenticated
    USING (has_role(auth.uid(), 'super_admin'::app_role));
  END IF;
END$$;

-- contratos: allow super_admin to SELECT all rows
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contratos'
  ) THEN
    BEGIN
      DROP POLICY IF EXISTS "Super admin view all contratos" ON public.contratos;
    EXCEPTION WHEN undefined_object THEN NULL; END;

    CREATE POLICY "Super admin view all contratos"
    ON public.contratos
    FOR SELECT
    TO authenticated
    USING (has_role(auth.uid(), 'super_admin'::app_role));
  END IF;
END$$;

-- mensalidades: allow super_admin to SELECT all rows (needed for pendencias globais)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'mensalidades'
  ) THEN
    BEGIN
      DROP POLICY IF EXISTS "Super admin view all mensalidades" ON public.mensalidades;
    EXCEPTION WHEN undefined_object THEN NULL; END;

    CREATE POLICY "Super admin view all mensalidades"
    ON public.mensalidades
    FOR SELECT
    TO authenticated
    USING (has_role(auth.uid(), 'super_admin'::app_role));
  END IF;
END$$;

-- usuarios: ensure RLS is enabled and allow super_admin to SELECT all for dashboard totals
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'usuarios'
  ) THEN
    -- enable RLS (safe if already enabled)
    BEGIN
      EXECUTE 'ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY';
    EXCEPTION WHEN duplicate_object THEN NULL; END;

    BEGIN
      DROP POLICY IF EXISTS "Super admin view all usuarios" ON public.usuarios;
    EXCEPTION WHEN undefined_object THEN NULL; END;

    CREATE POLICY "Super admin view all usuarios"
    ON public.usuarios
    FOR SELECT
    TO authenticated
    USING (has_role(auth.uid(), 'super_admin'::app_role));
  END IF;
END$$;
