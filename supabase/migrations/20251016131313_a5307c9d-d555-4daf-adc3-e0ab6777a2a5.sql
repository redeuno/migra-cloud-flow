-- =====================================================
-- ATUALIZAÇÃO DAS POLICIES DE CHECKINS
-- Permitir que alunos e professores gerenciem seus próprios check-ins
-- =====================================================

-- Remover policies antigas
DROP POLICY IF EXISTS "checkins_tenant_isolation" ON public.checkins;

-- =====================================================
-- POLICIES PARA TABELA CHECKINS
-- =====================================================

-- Arena staff pode ver todos os checkins da arena
CREATE POLICY "Arena staff can view all checkins"
ON public.checkins
FOR SELECT
USING (
  agendamento_id IN (
    SELECT id FROM agendamentos 
    WHERE arena_id IN (
      SELECT arena_id FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('arena_admin', 'super_admin', 'funcionario')
    )
  )
);

-- Alunos podem ver seus próprios checkins
CREATE POLICY "Alunos can view own checkins"
ON public.checkins
FOR SELECT
USING (
  usuario_id IN (
    SELECT id FROM usuarios WHERE auth_id = auth.uid()
  )
);

-- Professores podem ver checkins de suas aulas
CREATE POLICY "Professores can view class checkins"
ON public.checkins
FOR SELECT
USING (
  agendamento_id IN (
    SELECT a.id FROM agendamentos a
    INNER JOIN aulas au ON au.agendamento_id = a.id
    INNER JOIN professores p ON p.id = au.professor_id
    INNER JOIN usuarios u ON u.id = p.usuario_id
    WHERE u.auth_id = auth.uid()
  )
);

-- Arena staff pode criar checkins
CREATE POLICY "Arena staff can create checkins"
ON public.checkins
FOR INSERT
WITH CHECK (
  agendamento_id IN (
    SELECT id FROM agendamentos 
    WHERE arena_id IN (
      SELECT arena_id FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('arena_admin', 'super_admin', 'funcionario')
    )
  )
);

-- Alunos podem criar checkin para seus próprios agendamentos
CREATE POLICY "Alunos can create own checkins"
ON public.checkins
FOR INSERT
WITH CHECK (
  usuario_id IN (
    SELECT id FROM usuarios WHERE auth_id = auth.uid()
  )
  AND
  agendamento_id IN (
    SELECT id FROM agendamentos 
    WHERE cliente_id = usuario_id
  )
);

-- Professores podem criar checkins para suas aulas
CREATE POLICY "Professores can create class checkins"
ON public.checkins
FOR INSERT
WITH CHECK (
  agendamento_id IN (
    SELECT a.id FROM agendamentos a
    INNER JOIN aulas au ON au.agendamento_id = a.id
    INNER JOIN professores p ON p.id = au.professor_id
    INNER JOIN usuarios u ON u.id = p.usuario_id
    WHERE u.auth_id = auth.uid()
  )
);

-- Arena staff pode atualizar checkins
CREATE POLICY "Arena staff can update checkins"
ON public.checkins
FOR UPDATE
USING (
  agendamento_id IN (
    SELECT id FROM agendamentos 
    WHERE arena_id IN (
      SELECT arena_id FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('arena_admin', 'super_admin', 'funcionario')
    )
  )
);

-- Alunos podem atualizar seus próprios checkins (dentro de 30 min)
CREATE POLICY "Alunos can update own recent checkins"
ON public.checkins
FOR UPDATE
USING (
  usuario_id IN (
    SELECT id FROM usuarios WHERE auth_id = auth.uid()
  )
  AND
  created_at > NOW() - INTERVAL '30 minutes'
);

-- Professores podem atualizar checkins de suas aulas (dentro de 1 hora)
CREATE POLICY "Professores can update class checkins"
ON public.checkins
FOR UPDATE
USING (
  agendamento_id IN (
    SELECT a.id FROM agendamentos a
    INNER JOIN aulas au ON au.agendamento_id = a.id
    INNER JOIN professores p ON p.id = au.professor_id
    INNER JOIN usuarios u ON u.id = p.usuario_id
    WHERE u.auth_id = auth.uid()
  )
  AND
  created_at > NOW() - INTERVAL '1 hour'
);

-- Arena staff pode deletar checkins
CREATE POLICY "Arena staff can delete checkins"
ON public.checkins
FOR DELETE
USING (
  agendamento_id IN (
    SELECT id FROM agendamentos 
    WHERE arena_id IN (
      SELECT arena_id FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('arena_admin', 'super_admin')
    )
  )
);

-- Alunos podem deletar seus próprios checkins (dentro de 30 min)
CREATE POLICY "Alunos can delete own recent checkins"
ON public.checkins
FOR DELETE
USING (
  usuario_id IN (
    SELECT id FROM usuarios WHERE auth_id = auth.uid()
  )
  AND
  created_at > NOW() - INTERVAL '30 minutes'
);

-- =====================================================
-- ATUALIZAR POLICIES DE AGENDAMENTOS PARA CHECKIN
-- =====================================================

-- Alunos podem atualizar checkin de seus próprios agendamentos
CREATE POLICY "Alunos can update own agendamento checkin"
ON public.agendamentos
FOR UPDATE
USING (
  cliente_id IN (
    SELECT id FROM usuarios WHERE auth_id = auth.uid()
  )
)
WITH CHECK (
  cliente_id IN (
    SELECT id FROM usuarios WHERE auth_id = auth.uid()
  )
);

-- Professores podem atualizar checkin de agendamentos de suas aulas
CREATE POLICY "Professores can update class agendamento checkin"
ON public.agendamentos
FOR UPDATE
USING (
  id IN (
    SELECT a.id FROM agendamentos a
    INNER JOIN aulas au ON au.agendamento_id = a.id
    INNER JOIN professores p ON p.id = au.professor_id
    INNER JOIN usuarios u ON u.id = p.usuario_id
    WHERE u.auth_id = auth.uid()
  )
)
WITH CHECK (
  id IN (
    SELECT a.id FROM agendamentos a
    INNER JOIN aulas au ON au.agendamento_id = a.id
    INNER JOIN professores p ON p.id = au.professor_id
    INNER JOIN usuarios u ON u.id = p.usuario_id
    WHERE u.auth_id = auth.uid()
  )
);