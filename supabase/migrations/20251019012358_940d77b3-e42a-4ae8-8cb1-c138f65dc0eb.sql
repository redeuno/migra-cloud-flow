-- Corrigir RLS para professores verem apenas avaliações de suas aulas

-- Remover política UPDATE muito permissiva
DROP POLICY IF EXISTS "Users update own aula inscriptions" ON aulas_alunos;

-- Criar políticas específicas para professores
CREATE POLICY "Professores podem ver avaliações de suas aulas"
ON aulas_alunos
FOR SELECT
USING (
  aula_id IN (
    SELECT a.id
    FROM aulas a
    INNER JOIN professores p ON p.id = a.professor_id
    INNER JOIN usuarios u ON u.id = p.usuario_id
    WHERE u.auth_id = auth.uid()
  )
);

-- Alunos atualizam suas próprias inscrições
CREATE POLICY "Alunos atualizam suas inscrições"
ON aulas_alunos
FOR UPDATE
USING (
  usuario_id = (
    SELECT id FROM usuarios WHERE auth_id = auth.uid()
  )
)
WITH CHECK (
  usuario_id = (
    SELECT id FROM usuarios WHERE auth_id = auth.uid()
  )
);

-- Arena staff atualiza qualquer inscrição (presença, pagamento)
CREATE POLICY "Arena staff atualiza inscrições"
ON aulas_alunos
FOR UPDATE
USING (
  aula_id IN (
    SELECT id FROM aulas 
    WHERE arena_id IN (
      SELECT arena_id FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('arena_admin', 'super_admin', 'funcionario')
    )
  )
);