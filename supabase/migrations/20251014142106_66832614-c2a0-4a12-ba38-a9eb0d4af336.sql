-- Fix RLS to allow Super Admin to associate planos and configure módulos

-- Ensure RLS enabled (idempotent)
ALTER TABLE public.arena_modulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arenas ENABLE ROW LEVEL SECURITY;

-- 1) Allow INSERT on arena_modulos for super_admin (any arena) or arena_admin (own arena)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'arena_modulos' AND policyname = 'Arena admins insert modulos'
  ) THEN
    CREATE POLICY "Arena admins insert modulos"
    ON public.arena_modulos
    FOR INSERT
    WITH CHECK (
      has_role(auth.uid(), 'super_admin')
      OR arena_id IN (
        SELECT ur.arena_id
        FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role = 'arena_admin'
      )
    );
  END IF;
END $$;

-- 2) Allow UPDATE on arenas for super_admin (needed to set plano_sistema_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'arenas' AND policyname = 'Super admin update arenas'
  ) THEN
    CREATE POLICY "Super admin update arenas"
    ON public.arenas
    FOR UPDATE
    USING (has_role(auth.uid(), 'super_admin'))
    WITH CHECK (has_role(auth.uid(), 'super_admin'));
  END IF;
END $$;

-- 3) Optional: allow super_admin to insert/delete arena_modulos across all arenas (for admin ops)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'arena_modulos' AND policyname = 'Super admin manage modulos inserts'
  ) THEN
    CREATE POLICY "Super admin manage modulos inserts"
    ON public.arena_modulos
    FOR INSERT
    WITH CHECK (has_role(auth.uid(), 'super_admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'arena_modulos' AND policyname = 'Super admin manage modulos deletes'
  ) THEN
    CREATE POLICY "Super admin manage modulos deletes"
    ON public.arena_modulos
    FOR DELETE
    USING (has_role(auth.uid(), 'super_admin'));
  END IF;
END $$;
