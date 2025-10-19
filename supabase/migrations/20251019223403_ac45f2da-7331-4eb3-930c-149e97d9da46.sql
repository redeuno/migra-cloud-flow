-- ============================================
-- FASE 3: RLS POLICIES - SUPER ADMIN ACCESS
-- ============================================

-- 1. Atualizar policy de configuracoes_arena
DROP POLICY IF EXISTS "Arena admins manage own config" ON configuracoes_arena;

CREATE POLICY "Super admin and arena admins manage config"
ON configuracoes_arena FOR ALL
USING (
  -- Super admin vê tudo
  has_role(auth.uid(), 'super_admin')
  OR
  -- Arena admin vê apenas da própria arena
  (arena_id IN (
    SELECT arena_id FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'arena_admin'
  ))
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin')
  OR
  (arena_id IN (
    SELECT arena_id FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'arena_admin'
  ))
);

-- 2. Atualizar policy de arenas para UPDATE
DROP POLICY IF EXISTS "arenas_can_read_own" ON arenas;

CREATE POLICY "Users can read own arena"
ON arenas FOR SELECT
USING (
  has_role(auth.uid(), 'super_admin')
  OR
  (id IN (
    SELECT arena_id FROM usuarios WHERE auth_id = auth.uid()
  ))
);

CREATE POLICY "Arena admins can update own arena"
ON arenas FOR UPDATE
USING (
  has_role(auth.uid(), 'super_admin')
  OR
  (id IN (
    SELECT ur.arena_id FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'arena_admin'
  ))
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin')
  OR
  (id IN (
    SELECT ur.arena_id FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'arena_admin'
  ))
);

-- 3. Atualizar policies de assinaturas_arena
DROP POLICY IF EXISTS "Arena admins view own assinatura" ON assinaturas_arena;
DROP POLICY IF EXISTS "Super admin manage assinaturas" ON assinaturas_arena;

CREATE POLICY "Super admin full access assinaturas"
ON assinaturas_arena FOR ALL
USING (has_role(auth.uid(), 'super_admin'))
WITH CHECK (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Arena admins view own assinatura"
ON assinaturas_arena FOR SELECT
USING (
  arena_id IN (
    SELECT arena_id FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'arena_admin'
  )
);

-- 4. Atualizar policies de faturas_sistema
DROP POLICY IF EXISTS "Arena admins view own faturas" ON faturas_sistema;
DROP POLICY IF EXISTS "Super admin manage faturas_sistema" ON faturas_sistema;

CREATE POLICY "Super admin full access faturas"
ON faturas_sistema FOR ALL
USING (has_role(auth.uid(), 'super_admin'))
WITH CHECK (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Arena admins view own faturas"
ON faturas_sistema FOR SELECT
USING (
  arena_id IN (
    SELECT arena_id FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'arena_admin'
  )
);

COMMENT ON POLICY "Super admin and arena admins manage config" ON configuracoes_arena 
IS 'Super admin pode acessar configurações de qualquer arena; Arena admin apenas da própria';

COMMENT ON POLICY "Super admin full access assinaturas" ON assinaturas_arena 
IS 'Super admin tem acesso total a assinaturas de todas as arenas';

COMMENT ON POLICY "Super admin full access faturas" ON faturas_sistema 
IS 'Super admin tem acesso total a faturas de todas as arenas';