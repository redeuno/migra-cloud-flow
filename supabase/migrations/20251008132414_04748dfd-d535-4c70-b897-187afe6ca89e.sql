-- Remover arena_id de usuários super_admin
-- Super admins não devem estar vinculados a uma arena específica
UPDATE user_roles 
SET arena_id = NULL 
WHERE role = 'super_admin';

-- Comentário: Super admins precisam ter arena_id NULL para visualizar
-- dados de todas as arenas no sistema sem restrição de tenant