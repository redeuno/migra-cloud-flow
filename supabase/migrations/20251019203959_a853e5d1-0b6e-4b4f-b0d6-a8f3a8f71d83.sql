-- Fix RLS so professors only see evaluations about themselves on avaliacoes

-- 1) Remove overly permissive tenant-wide ALL policy if it exists
DROP POLICY IF EXISTS "Tenant isolation" ON public.avaliacoes;

-- 2) Ensure arena staff (admins) still manage everything (kept existing policy). Recreate defensively in case it was missing
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'avaliacoes' AND policyname = 'Arena staff can manage all avaliacoes'
  ) THEN
    CREATE POLICY "Arena staff can manage all avaliacoes"
    ON public.avaliacoes
    FOR ALL
    USING (
      arena_id IN (
        SELECT ur.arena_id
        FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role IN ('super_admin','arena_admin')::public.app_role[]
      )
    );
  END IF;
END $$;

-- 3) Allow professors to SELECT only evaluations where they are the evaluated person (avaliado_id = professor.id)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'avaliacoes' AND policyname = 'Professores veem avaliacoes proprias'
  ) THEN
    CREATE POLICY "Professores veem avaliacoes proprias"
    ON public.avaliacoes
    FOR SELECT
    USING (
      avaliado_id IN (
        SELECT p.id
        FROM public.professores p
        JOIN public.usuarios u ON u.id = p.usuario_id
        WHERE u.auth_id = auth.uid()
      )
    );
  END IF;
END $$;

-- 4) Keep authors control: allow users to update/delete their own evaluations (recreate defensively)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'avaliacoes' AND policyname = 'Users can update own avaliacoes'
  ) THEN
    CREATE POLICY "Users can update own avaliacoes"
    ON public.avaliacoes
    FOR UPDATE
    USING (
      usuario_id = (SELECT id FROM public.usuarios WHERE auth_id = auth.uid())
    );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'avaliacoes' AND policyname = 'Users can delete own avaliacoes'
  ) THEN
    CREATE POLICY "Users can delete own avaliacoes"
    ON public.avaliacoes
    FOR DELETE
    USING (
      usuario_id = (SELECT id FROM public.usuarios WHERE auth_id = auth.uid())
    );
  END IF;
END $$;