-- Atualizar políticas para professores editarem/excluírem aulas futuras
-- (confirmadas, não apenas pendentes)

-- Drop políticas antigas de professores
DROP POLICY IF EXISTS "Professores podem editar agendamentos de aulas" ON agendamentos;
DROP POLICY IF EXISTS "Professores podem deletar agendamentos de aulas futuras" ON agendamentos;

-- Permitir professores editarem agendamentos de suas aulas futuras
CREATE POLICY "Professores podem editar agendamentos de suas aulas"
ON agendamentos
FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT a.id FROM agendamentos a
    JOIN aulas au ON au.agendamento_id = a.id
    JOIN professores p ON p.id = au.professor_id
    JOIN usuarios u ON u.id = p.usuario_id
    WHERE u.auth_id = auth.uid()
  )
  AND data_agendamento >= CURRENT_DATE
  AND status IN ('pendente', 'confirmado')
)
WITH CHECK (
  id IN (
    SELECT a.id FROM agendamentos a
    JOIN aulas au ON au.agendamento_id = a.id
    JOIN professores p ON p.id = au.professor_id
    JOIN usuarios u ON u.id = p.usuario_id
    WHERE u.auth_id = auth.uid()
  )
  AND data_agendamento >= CURRENT_DATE
  AND status IN ('pendente', 'confirmado')
);

-- Permitir professores excluírem agendamentos de suas aulas futuras
CREATE POLICY "Professores podem excluir agendamentos de suas aulas"
ON agendamentos
FOR DELETE
TO authenticated
USING (
  id IN (
    SELECT a.id FROM agendamentos a
    JOIN aulas au ON au.agendamento_id = a.id
    JOIN professores p ON p.id = au.professor_id
    JOIN usuarios u ON u.id = p.usuario_id
    WHERE u.auth_id = auth.uid()
  )
  AND data_agendamento >= CURRENT_DATE
  AND status IN ('pendente', 'confirmado')
);

-- Garantir que alunos possam ver aulas de todas as quadras
-- (já existe tenant isolation, mas garantir leitura para alunos inscritos)
DROP POLICY IF EXISTS "Alunos podem ver aulas que estão inscritos" ON aulas_alunos;

CREATE POLICY "Alunos podem ver suas inscrições em aulas"
ON aulas_alunos
FOR SELECT
TO authenticated
USING (
  usuario_id IN (
    SELECT id FROM usuarios WHERE auth_id = auth.uid()
  )
);