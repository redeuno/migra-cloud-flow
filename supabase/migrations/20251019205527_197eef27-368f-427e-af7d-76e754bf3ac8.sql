-- =====================================================
-- PLANO COMPLETO: Sistema de Vínculos Professor-Aluno
-- =====================================================

-- 1. CRIAR TABELA professor_alunos
CREATE TABLE IF NOT EXISTS professor_alunos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id uuid NOT NULL REFERENCES professores(id) ON DELETE CASCADE,
  aluno_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  arena_id uuid NOT NULL REFERENCES arenas(id) ON DELETE CASCADE,
  data_vinculo date DEFAULT CURRENT_DATE,
  ativo boolean DEFAULT true,
  observacoes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(professor_id, aluno_id)
);

-- Index para performance
CREATE INDEX IF NOT EXISTS idx_professor_alunos_professor ON professor_alunos(professor_id);
CREATE INDEX IF NOT EXISTS idx_professor_alunos_aluno ON professor_alunos(aluno_id);
CREATE INDEX IF NOT EXISTS idx_professor_alunos_arena ON professor_alunos(arena_id);

-- Trigger updated_at
CREATE TRIGGER update_professor_alunos_updated_at
  BEFORE UPDATE ON professor_alunos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 2. RLS POLICIES para professor_alunos
ALTER TABLE professor_alunos ENABLE ROW LEVEL SECURITY;

-- Arena staff pode gerenciar vínculos
CREATE POLICY "Arena staff manage vinculos"
ON professor_alunos FOR ALL
USING (arena_id IN (
  SELECT arena_id FROM user_roles
  WHERE user_id = auth.uid() 
  AND role IN ('arena_admin', 'super_admin')
));

-- Professor vê seus alunos
CREATE POLICY "Professor view own alunos"
ON professor_alunos FOR SELECT
USING (professor_id IN (
  SELECT p.id FROM professores p
  JOIN usuarios u ON u.id = p.usuario_id
  WHERE u.auth_id = auth.uid()
));

-- Aluno vê seus professores
CREATE POLICY "Aluno view own professores"
ON professor_alunos FOR SELECT
USING (aluno_id IN (
  SELECT id FROM usuarios WHERE auth_id = auth.uid()
));

-- 3. ATUALIZAR RLS de agendamentos - permitir aluno criar próprios
DROP POLICY IF EXISTS "Alunos podem criar agendamentos próprios" ON agendamentos;

CREATE POLICY "Alunos podem criar agendamentos próprios"
ON agendamentos FOR INSERT
WITH CHECK (
  cliente_id = (SELECT id FROM usuarios WHERE auth_id = auth.uid())
  AND arena_id IN (SELECT arena_id FROM user_roles WHERE user_id = auth.uid())
);

-- 4. TRIGGER: Notificar quando aluno é vinculado
CREATE OR REPLACE FUNCTION notificar_vinculo_aluno()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_professor_nome text;
  v_aluno_nome text;
BEGIN
  -- Buscar nomes
  SELECT u.nome_completo INTO v_professor_nome
  FROM professores p
  JOIN usuarios u ON u.id = p.usuario_id
  WHERE p.id = NEW.professor_id;
  
  SELECT nome_completo INTO v_aluno_nome
  FROM usuarios
  WHERE id = NEW.aluno_id;
  
  -- Notificar professor
  INSERT INTO notificacoes (usuario_id, arena_id, tipo, titulo, mensagem, link, metadata)
  SELECT 
    p.usuario_id,
    NEW.arena_id,
    'novo_aluno',
    'Novo Aluno Vinculado',
    'O aluno ' || v_aluno_nome || ' foi vinculado a você.',
    '/meus-alunos',
    jsonb_build_object('vinculo_id', NEW.id)
  FROM professores p
  WHERE p.id = NEW.professor_id;
  
  -- Notificar aluno
  INSERT INTO notificacoes (usuario_id, arena_id, tipo, titulo, mensagem, link, metadata)
  VALUES (
    NEW.aluno_id,
    NEW.arena_id,
    'professor_vinculado',
    'Professor Atribuído',
    'Você foi vinculado ao professor ' || v_professor_nome,
    '/minhas-aulas',
    jsonb_build_object('vinculo_id', NEW.id)
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notificar_vinculo_aluno
AFTER INSERT ON professor_alunos
FOR EACH ROW
EXECUTE FUNCTION notificar_vinculo_aluno();

-- 5. TRIGGER: Sincronizar status professor ↔ usuário
CREATE OR REPLACE FUNCTION sync_professor_usuario_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    UPDATE usuarios
    SET status = NEW.status,
        updated_at = now()
    WHERE id = NEW.usuario_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_professor_status ON professores;

CREATE TRIGGER trigger_sync_professor_status
AFTER UPDATE OF status ON professores
FOR EACH ROW
EXECUTE FUNCTION sync_professor_usuario_status();

-- 6. ATUALIZAR RLS de aulas para professor selecionar alunos vinculados
-- Garantir que professor só pode adicionar alunos vinculados a ele
DROP POLICY IF EXISTS "Professor cria aulas com seus alunos" ON aulas_alunos;

CREATE POLICY "Professor cria aulas com seus alunos"
ON aulas_alunos FOR INSERT
WITH CHECK (
  aula_id IN (
    SELECT a.id FROM aulas a
    JOIN professores p ON p.id = a.professor_id
    JOIN usuarios u ON u.id = p.usuario_id
    WHERE u.auth_id = auth.uid()
  )
  AND (
    -- Arena staff pode adicionar qualquer aluno
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('arena_admin', 'super_admin', 'funcionario')
    )
    OR
    -- Professor só pode adicionar alunos vinculados a ele
    usuario_id IN (
      SELECT pa.aluno_id
      FROM professor_alunos pa
      JOIN professores p ON p.id = pa.professor_id
      JOIN usuarios u ON u.id = p.usuario_id
      WHERE u.auth_id = auth.uid()
      AND pa.ativo = true
    )
  )
);