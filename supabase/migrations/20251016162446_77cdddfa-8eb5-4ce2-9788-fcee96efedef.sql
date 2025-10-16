-- Permitir que alunos criem seus próprios agendamentos
CREATE POLICY "Alunos podem criar agendamentos"
ON agendamentos
FOR INSERT
TO authenticated
WITH CHECK (
  arena_id IN (
    SELECT arena_id 
    FROM user_roles 
    WHERE user_id = auth.uid()
  )
  AND (
    cliente_id = (SELECT id FROM usuarios WHERE auth_id = auth.uid())
    OR has_role(auth.uid(), 'aluno'::app_role)
  )
);

-- Permitir que professores criem agendamentos para suas aulas
CREATE POLICY "Professores podem criar agendamentos para aulas"
ON agendamentos
FOR INSERT
TO authenticated
WITH CHECK (
  arena_id IN (
    SELECT arena_id 
    FROM user_roles 
    WHERE user_id = auth.uid()
  )
  AND has_role(auth.uid(), 'professor'::app_role)
);

-- Permitir que alunos editem seus próprios agendamentos
CREATE POLICY "Alunos podem editar seus agendamentos"
ON agendamentos
FOR UPDATE
TO authenticated
USING (
  cliente_id = (SELECT id FROM usuarios WHERE auth_id = auth.uid())
)
WITH CHECK (
  cliente_id = (SELECT id FROM usuarios WHERE auth_id = auth.uid())
);

-- Permitir que professores editem agendamentos de suas aulas
CREATE POLICY "Professores podem editar agendamentos de aulas"
ON agendamentos
FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT a.id
    FROM agendamentos a
    JOIN aulas au ON au.agendamento_id = a.id
    JOIN professores p ON p.id = au.professor_id
    JOIN usuarios u ON u.id = p.usuario_id
    WHERE u.auth_id = auth.uid()
  )
)
WITH CHECK (
  id IN (
    SELECT a.id
    FROM agendamentos a
    JOIN aulas au ON au.agendamento_id = a.id
    JOIN professores p ON p.id = au.professor_id
    JOIN usuarios u ON u.id = p.usuario_id
    WHERE u.auth_id = auth.uid()
  )
);

-- Permitir que alunos deletem seus próprios agendamentos (com restrições)
CREATE POLICY "Alunos podem deletar seus agendamentos futuros"
ON agendamentos
FOR DELETE
TO authenticated
USING (
  cliente_id = (SELECT id FROM usuarios WHERE auth_id = auth.uid())
  AND data_agendamento >= CURRENT_DATE
  AND status = 'pendente'::status_agendamento
);

-- Permitir que professores deletem agendamentos de aulas futuras
CREATE POLICY "Professores podem deletar agendamentos de aulas futuras"
ON agendamentos
FOR DELETE
TO authenticated
USING (
  id IN (
    SELECT a.id
    FROM agendamentos a
    JOIN aulas au ON au.agendamento_id = a.id
    JOIN professores p ON p.id = au.professor_id
    JOIN usuarios u ON u.id = p.usuario_id
    WHERE u.auth_id = auth.uid()
  )
  AND data_agendamento >= CURRENT_DATE
  AND status = 'pendente'::status_agendamento
);