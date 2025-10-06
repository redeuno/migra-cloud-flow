-- First, add UNIQUE constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_roles_user_id_role_key'
  ) THEN
    ALTER TABLE user_roles 
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
  END IF;
END $$;

-- Now add role 'aluno' for test client João da Silva
INSERT INTO user_roles (user_id, role, arena_id)
SELECT 
  auth_id,
  'aluno'::app_role,
  arena_id
FROM usuarios
WHERE email = 'joao.teste@example.com'
  AND auth_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = (SELECT auth_id FROM usuarios WHERE email = 'joao.teste@example.com')
      AND role = 'aluno'
  );

-- Verify the role was created
DO $$
DECLARE
  role_count integer;
BEGIN
  SELECT COUNT(*) INTO role_count
  FROM user_roles ur
  JOIN usuarios u ON u.auth_id = ur.user_id
  WHERE u.email = 'joao.teste@example.com'
    AND ur.role = 'aluno';
  
  IF role_count = 0 THEN
    RAISE EXCEPTION 'Failed to create aluno role for test client';
  ELSE
    RAISE NOTICE 'Role aluno created successfully for João da Silva';
  END IF;
END $$;