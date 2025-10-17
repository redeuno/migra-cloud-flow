
-- Recriar a função do trigger usando o constraint correto que existe
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
      ON CONFLICT (user_id, role, arena_id) DO NOTHING;
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
      ON CONFLICT (user_id, role, arena_id) DO NOTHING;
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

-- Remover o constraint conflitante
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;

-- Criar registro para professor@teste.com.br na tabela usuarios
INSERT INTO usuarios (
  auth_id,
  arena_id,
  nome_completo,
  email,
  cpf,
  data_nascimento,
  telefone,
  tipo_usuario
)
SELECT
  '969ac1c2-0d6b-410f-97a2-b3d401521549',
  '53b6b586-7482-466f-8bf6-290f814d43d9',
  'Professor Teste',
  'professor@teste.com.br',
  '98765432100',
  '1990-01-01',
  '11999999999',
  'professor'
WHERE NOT EXISTS (
  SELECT 1 FROM usuarios WHERE auth_id = '969ac1c2-0d6b-410f-97a2-b3d401521549'
);

-- Criar registro na tabela professores
INSERT INTO professores (
  usuario_id,
  arena_id,
  registro_profissional,
  especialidades,
  valor_hora_aula,
  disponibilidade,
  percentual_comissao_padrao,
  status
)
SELECT
  u.id,
  '53b6b586-7482-466f-8bf6-290f814d43d9',
  'PROF-001',
  '["Beach Tennis", "Vôlei de Praia"]'::jsonb,
  100.00,
  '{
    "segunda": [{"inicio": "08:00", "fim": "18:00"}],
    "terca": [{"inicio": "08:00", "fim": "18:00"}],
    "quarta": [{"inicio": "08:00", "fim": "18:00"}],
    "quinta": [{"inicio": "08:00", "fim": "18:00"}],
    "sexta": [{"inicio": "08:00", "fim": "18:00"}],
    "sabado": [{"inicio": "08:00", "fim": "12:00"}]
  }'::jsonb,
  30.00,
  'ativo'
FROM usuarios u
WHERE u.auth_id = '969ac1c2-0d6b-410f-97a2-b3d401521549'
  AND NOT EXISTS (
    SELECT 1 FROM professores p WHERE p.usuario_id = u.id
  );

-- Transferir aulas
UPDATE aulas 
SET professor_id = (
  SELECT p.id FROM professores p
  JOIN usuarios u ON u.id = p.usuario_id
  WHERE u.auth_id = '969ac1c2-0d6b-410f-97a2-b3d401521549'
)
WHERE professor_id = '08630066-509f-44af-bc94-f4b78ddec068';

-- Transferir comissões
UPDATE comissoes_professores
SET professor_id = (
  SELECT p.id FROM professores p
  JOIN usuarios u ON u.id = p.usuario_id
  WHERE u.auth_id = '969ac1c2-0d6b-410f-97a2-b3d401521549'
)
WHERE professor_id = '08630066-509f-44af-bc94-f4b78ddec068';

-- Remover João dos professores
DELETE FROM professores WHERE id = '08630066-509f-44af-bc94-f4b78ddec068';

-- Remover role professor do João
DELETE FROM user_roles 
WHERE user_id = '62afde80-2617-4e71-9183-2dee5006782c' AND role = 'professor';
