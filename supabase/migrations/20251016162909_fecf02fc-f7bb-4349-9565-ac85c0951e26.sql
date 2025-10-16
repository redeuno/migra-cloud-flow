-- Ensure unique combination for user roles per arena
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_roles_unique ON public.user_roles (user_id, arena_id, role);

-- Function to sync professor role in user_roles based on professores table
CREATE OR REPLACE FUNCTION public.sync_user_role_professor()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT auth_id INTO v_auth_id FROM public.usuarios WHERE id = NEW.usuario_id;
    IF v_auth_id IS NOT NULL THEN
      INSERT INTO public.user_roles (user_id, arena_id, role)
      VALUES (v_auth_id, NEW.arena_id, 'professor'::app_role)
      ON CONFLICT ON CONSTRAINT idx_user_roles_unique DO NOTHING;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Remove old mapping if arena or usuario changed
    SELECT auth_id INTO v_auth_id FROM public.usuarios WHERE id = OLD.usuario_id;
    IF v_auth_id IS NOT NULL THEN
      DELETE FROM public.user_roles 
      WHERE user_id = v_auth_id AND arena_id = OLD.arena_id AND role = 'professor'::app_role;
    END IF;

    -- Add new mapping if still valid
    SELECT auth_id INTO v_auth_id FROM public.usuarios WHERE id = NEW.usuario_id;
    IF v_auth_id IS NOT NULL AND (NEW.status IS NULL OR NEW.status <> 'inativo') THEN
      INSERT INTO public.user_roles (user_id, arena_id, role)
      VALUES (v_auth_id, NEW.arena_id, 'professor'::app_role)
      ON CONFLICT ON CONSTRAINT idx_user_roles_unique DO NOTHING;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT auth_id INTO v_auth_id FROM public.usuarios WHERE id = OLD.usuario_id;
    IF v_auth_id IS NOT NULL THEN
      DELETE FROM public.user_roles 
      WHERE user_id = v_auth_id AND arena_id = OLD.arena_id AND role = 'professor'::app_role;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for insert/update/delete on professores
DROP TRIGGER IF EXISTS trg_sync_user_role_professor ON public.professores;
CREATE TRIGGER trg_sync_user_role_professor
AFTER INSERT OR UPDATE OR DELETE ON public.professores
FOR EACH ROW EXECUTE FUNCTION public.sync_user_role_professor();

-- Backfill existing professor roles
INSERT INTO public.user_roles (user_id, arena_id, role)
SELECT u.auth_id, p.arena_id, 'professor'::app_role
FROM public.professores p
JOIN public.usuarios u ON u.id = p.usuario_id
LEFT JOIN public.user_roles ur 
  ON ur.user_id = u.auth_id AND ur.arena_id = p.arena_id AND ur.role = 'professor'::app_role
WHERE ur.user_id IS NULL;