-- Criar dados de teste
DO $$
DECLARE
  v_arena_id uuid := '53b6b586-7482-466f-8bf6-290f814d43d9';
  v_aluno_id uuid := 'b96e1de3-d4f5-4d1a-9796-c38b5384f8c4';
  v_professor_usuario_id uuid := '42bd5fbd-d693-4cf3-8a51-1736e3191a93';
  v_professor_id uuid;
  v_aula_id uuid;
BEGIN
  -- Buscar professor_id
  SELECT id INTO v_professor_id 
  FROM professores 
  WHERE usuario_id = v_professor_usuario_id
  LIMIT 1;
  
  -- Criar vínculo professor-aluno
  IF v_professor_id IS NOT NULL THEN
    INSERT INTO professor_alunos (professor_id, aluno_id, arena_id, data_vinculo, ativo)
    VALUES (v_professor_id, v_aluno_id, v_arena_id, CURRENT_DATE, true)
    ON CONFLICT (professor_id, aluno_id) DO UPDATE SET ativo = true;
  END IF;
  
  -- Buscar primeira aula do professor
  SELECT id INTO v_aula_id
  FROM aulas
  WHERE professor_id = v_professor_id
    AND data_aula >= CURRENT_DATE
  ORDER BY data_aula, hora_inicio
  LIMIT 1;
  
  -- Inscrever aluno na aula
  IF v_aula_id IS NOT NULL THEN
    INSERT INTO aulas_alunos (
      aula_id,
      usuario_id,
      valor_pago,
      status_pagamento,
      presenca
    )
    SELECT 
      v_aula_id,
      v_aluno_id,
      a.valor_por_aluno,
      'pendente'::status_pagamento,
      false
    FROM aulas a
    WHERE a.id = v_aula_id
    ON CONFLICT (aula_id, usuario_id) DO NOTHING;
  END IF;
  
  -- Atualizar coordenadas da arena
  UPDATE arenas 
  SET 
    coordenadas_latitude = -23.561684,
    coordenadas_longitude = -46.655981,
    raio_checkin_metros = 100,
    janela_checkin_minutos_antes = 30,
    janela_checkin_minutos_depois = 15,
    updated_at = NOW()
  WHERE id = v_arena_id;
  
END $$;