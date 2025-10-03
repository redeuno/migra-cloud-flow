-- FIX 1: Drop políticas problemáticas de user_roles
DROP POLICY IF EXISTS "Arena admins can view arena roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage all roles" ON public.user_roles;

-- FIX 2: Drop política problemática de usuarios
DROP POLICY IF EXISTS "usuarios_can_read_own_arena" ON public.usuarios;

-- FIX 3: Criar políticas simples e seguras para user_roles
-- Super admins podem ver e gerenciar tudo
CREATE POLICY "Super admins full access"
ON public.user_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'super_admin'
  )
);

-- Usuários podem ver suas próprias roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

-- FIX 4: Criar política simples para usuarios
-- Usuários podem ver outros usuários da mesma arena
CREATE POLICY "Users can view same arena usuarios"
ON public.usuarios
FOR SELECT
USING (
  arena_id IN (
    SELECT ur.arena_id 
    FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid()
  )
  OR auth_id = auth.uid()
);