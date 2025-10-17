-- Atualizar políticas RLS para alunos editarem/excluírem agendamentos futuros
-- (não apenas pendentes, mas também confirmados)

-- Drop das políticas antigas
DROP POLICY IF EXISTS "Alunos podem editar seus agendamentos" ON agendamentos;
DROP POLICY IF EXISTS "Alunos podem deletar seus agendamentos futuros" ON agendamentos;

-- Permitir alunos editarem seus próprios agendamentos futuros (pendentes ou confirmados)
CREATE POLICY "Alunos podem editar agendamentos futuros"
ON agendamentos
FOR UPDATE
TO authenticated
USING (
  cliente_id IN (
    SELECT id FROM usuarios WHERE auth_id = auth.uid()
  )
  AND data_agendamento >= CURRENT_DATE
  AND status IN ('pendente', 'confirmado')
)
WITH CHECK (
  cliente_id IN (
    SELECT id FROM usuarios WHERE auth_id = auth.uid()
  )
  AND data_agendamento >= CURRENT_DATE
  AND status IN ('pendente', 'confirmado')
);

-- Permitir alunos excluírem seus próprios agendamentos futuros (pendentes ou confirmados)
CREATE POLICY "Alunos podem excluir agendamentos futuros"
ON agendamentos
FOR DELETE
TO authenticated
USING (
  cliente_id IN (
    SELECT id FROM usuarios WHERE auth_id = auth.uid()
  )
  AND data_agendamento >= CURRENT_DATE
  AND status IN ('pendente', 'confirmado')
);