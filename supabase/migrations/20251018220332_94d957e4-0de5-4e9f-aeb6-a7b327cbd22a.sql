-- Criar trigger para atualizar média de avaliação do professor automaticamente
CREATE OR REPLACE FUNCTION atualizar_media_professor()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_professor_id uuid;
  v_media numeric;
  v_total integer;
BEGIN
  -- Buscar professor_id da aula
  SELECT professor_id INTO v_professor_id
  FROM aulas
  WHERE id = NEW.aula_id;
  
  -- Se não encontrou professor, retornar
  IF v_professor_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Calcular nova média e total
  SELECT 
    COALESCE(AVG(aa.avaliacao), 0),
    COUNT(*)
  INTO v_media, v_total
  FROM aulas_alunos aa
  INNER JOIN aulas a ON a.id = aa.aula_id
  WHERE a.professor_id = v_professor_id
    AND aa.avaliacao IS NOT NULL;
  
  -- Atualizar tabela professores
  UPDATE professores
  SET 
    avaliacao_media = v_media,
    total_avaliacoes = v_total,
    updated_at = NOW()
  WHERE id = v_professor_id;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para INSERT e UPDATE
DROP TRIGGER IF EXISTS trigger_atualizar_media_professor ON aulas_alunos;

CREATE TRIGGER trigger_atualizar_media_professor
AFTER INSERT OR UPDATE OF avaliacao ON aulas_alunos
FOR EACH ROW
WHEN (NEW.avaliacao IS NOT NULL)
EXECUTE FUNCTION atualizar_media_professor();

-- Criar trigger para quando avaliação é removida (null)
CREATE OR REPLACE FUNCTION atualizar_media_professor_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_professor_id uuid;
  v_media numeric;
  v_total integer;
BEGIN
  -- Buscar professor_id da aula
  SELECT professor_id INTO v_professor_id
  FROM aulas
  WHERE id = OLD.aula_id;
  
  -- Se não encontrou professor, retornar
  IF v_professor_id IS NULL THEN
    RETURN OLD;
  END IF;
  
  -- Calcular nova média e total
  SELECT 
    COALESCE(AVG(aa.avaliacao), 0),
    COUNT(*)
  INTO v_media, v_total
  FROM aulas_alunos aa
  INNER JOIN aulas a ON a.id = aa.aula_id
  WHERE a.professor_id = v_professor_id
    AND aa.avaliacao IS NOT NULL;
  
  -- Atualizar tabela professores
  UPDATE professores
  SET 
    avaliacao_media = v_media,
    total_avaliacoes = v_total,
    updated_at = NOW()
  WHERE id = v_professor_id;
  
  RETURN OLD;
END;
$$;

-- Trigger para quando avaliação é removida
DROP TRIGGER IF EXISTS trigger_atualizar_media_professor_remove ON aulas_alunos;

CREATE TRIGGER trigger_atualizar_media_professor_remove
AFTER UPDATE OF avaliacao ON aulas_alunos
FOR EACH ROW
WHEN (OLD.avaliacao IS NOT NULL AND NEW.avaliacao IS NULL)
EXECUTE FUNCTION atualizar_media_professor_delete();