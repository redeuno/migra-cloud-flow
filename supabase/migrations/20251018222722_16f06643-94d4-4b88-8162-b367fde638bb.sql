-- Trigger 1: Auto-criar registro em professores quando cria usuário tipo professor
CREATE OR REPLACE FUNCTION auto_create_professor()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.tipo_usuario = 'professor' THEN
    INSERT INTO professores (
      usuario_id,
      arena_id,
      valor_hora_aula,
      percentual_comissao_padrao,
      disponibilidade,
      especialidades,
      status
    ) VALUES (
      NEW.id,
      NEW.arena_id,
      100.00, -- Valor padrão, arena admin ajusta depois
      30.00, -- Comissão padrão 30%
      '{}',
      '[]',
      NEW.status
    )
    ON CONFLICT (usuario_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_create_professor
AFTER INSERT ON usuarios
FOR EACH ROW
EXECUTE FUNCTION auto_create_professor();

-- Trigger 2: Auto-criar role em user_roles quando cria usuário
CREATE OR REPLACE FUNCTION auto_create_user_role()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role app_role;
BEGIN
  -- Mapear tipo_usuario para app_role
  CASE NEW.tipo_usuario
    WHEN 'professor' THEN _role := 'professor'::app_role;
    WHEN 'aluno' THEN _role := 'aluno'::app_role;
    WHEN 'funcionario' THEN _role := 'funcionario'::app_role;
    WHEN 'arena_admin' THEN _role := 'arena_admin'::app_role;
    ELSE RETURN NEW;
  END CASE;

  -- Se usuário tem auth_id, criar role
  IF NEW.auth_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, arena_id, role)
    VALUES (NEW.auth_id, NEW.arena_id, _role)
    ON CONFLICT (user_id, role, arena_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_create_user_role
AFTER INSERT OR UPDATE OF auth_id ON usuarios
FOR EACH ROW
EXECUTE FUNCTION auto_create_user_role();