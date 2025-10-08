-- Adicionar role 'aluno' para o João Teste usando auth_id correto
INSERT INTO user_roles (user_id, role, arena_id)
VALUES (
  '62afde80-2617-4e71-9183-2dee5006782c',
  'aluno'::app_role,
  (SELECT arena_id FROM usuarios WHERE auth_id = '62afde80-2617-4e71-9183-2dee5006782c')
)
ON CONFLICT (user_id, role) DO NOTHING;