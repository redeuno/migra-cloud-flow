-- Permitir Super Admin visualizar agendamentos de todas as arenas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'agendamentos' 
    AND policyname = 'Super admin view all agendamentos'
  ) THEN
    CREATE POLICY "Super admin view all agendamentos"
    ON public.agendamentos
    FOR SELECT
    USING (has_role(auth.uid(), 'super_admin'));
  END IF;
END $$;

-- Permitir Super Admin visualizar quadras de todas as arenas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'quadras' 
    AND policyname = 'Super admin view all quadras'
  ) THEN
    CREATE POLICY "Super admin view all quadras"
    ON public.quadras
    FOR SELECT
    USING (has_role(auth.uid(), 'super_admin'));
  END IF;
END $$;

-- Permitir Super Admin visualizar usuários de todas as arenas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'usuarios' 
    AND policyname = 'Super admin view all usuarios'
  ) THEN
    CREATE POLICY "Super admin view all usuarios"
    ON public.usuarios
    FOR SELECT
    USING (has_role(auth.uid(), 'super_admin'));
  END IF;
END $$;