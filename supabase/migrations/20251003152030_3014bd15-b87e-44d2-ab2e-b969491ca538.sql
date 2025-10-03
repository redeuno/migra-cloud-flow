-- Policy para INSERT (criar usuários)
CREATE POLICY "Arena staff can insert usuarios"
ON public.usuarios
FOR INSERT
TO authenticated
WITH CHECK (
  arena_id IN (
    SELECT arena_id 
    FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'arena_admin')
  )
);

-- Policy para UPDATE (editar usuários)
CREATE POLICY "Arena staff can update usuarios"
ON public.usuarios
FOR UPDATE
TO authenticated
USING (
  arena_id IN (
    SELECT arena_id 
    FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'arena_admin')
  )
  OR auth_id = auth.uid()
)
WITH CHECK (
  arena_id IN (
    SELECT arena_id 
    FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'arena_admin')
  )
  OR auth_id = auth.uid()
);

-- Policy para DELETE (excluir usuários)
CREATE POLICY "Arena staff can delete usuarios"
ON public.usuarios
FOR DELETE
TO authenticated
USING (
  arena_id IN (
    SELECT arena_id 
    FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'arena_admin')
  )
  AND auth_id != auth.uid()
);