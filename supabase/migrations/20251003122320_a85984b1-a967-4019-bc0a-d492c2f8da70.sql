-- Drop política problemática que causa recursão infinita
DROP POLICY IF EXISTS "Super admins full access" ON public.user_roles;

-- Recriar usando a função has_role() com SECURITY DEFINER
CREATE POLICY "Super admins full access"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'));