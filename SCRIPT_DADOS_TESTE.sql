-- =====================================================
-- SCRIPT DE DADOS DE TESTE COMPLETOS
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. CRIAR VÍNCULOS PROFESSOR-ALUNO
DO $$
DECLARE
  v_arena_id uuid;
  v_professor_id uuid;
  v_aluno_id uuid;
  v_aula_id uuid;
BEGIN
  -- Obter arena_id (primeira arena ativa)
  SELECT id INTO v_arena_id FROM arenas WHERE status = 'ativo' LIMIT 1;
  
  -- Obter professor_id (primeiro professor)
  SELECT id INTO v_professor_id FROM professores LIMIT 1;
  
  -- Obter aluno (primeiro usuário tipo aluno)
  SELECT id INTO v_aluno_id FROM usuarios WHERE tipo_usuario = 'aluno' LIMIT 1;
  
  -- Criar vínculo professor-aluno se não existir
  IF v_professor_id IS NOT NULL AND v_aluno_id IS NOT NULL THEN
    INSERT INTO professor_alunos (professor_id, aluno_id, arena_id, data_vinculo, ativo)
    VALUES (v_professor_id, v_aluno_id, v_arena_id, CURRENT_DATE, true)
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Vínculo professor-aluno criado: professor_id=%, aluno_id=%', v_professor_id, v_aluno_id;
  END IF;
  
  -- 2. CRIAR INSCRIÇÕES EM AULAS
  -- Obter primeira aula futura ou hoje
  SELECT id INTO v_aula_id 
  FROM aulas 
  WHERE data_aula >= CURRENT_DATE 
    AND professor_id = v_professor_id
  ORDER BY data_aula, hora_inicio 
  LIMIT 1;
  
  -- Inscrever aluno na aula se não estiver inscrito
  IF v_aula_id IS NOT NULL AND v_aluno_id IS NOT NULL THEN
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
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Inscrição em aula criada: aula_id=%, aluno_id=%', v_aula_id, v_aluno_id;
  END IF;
  
  -- 3. CRIAR NOTIFICAÇÃO DE TESTE
  INSERT INTO notificacoes (
    usuario_id,
    arena_id,
    tipo,
    titulo,
    mensagem,
    lida
  )
  VALUES (
    v_aluno_id,
    v_arena_id,
    'inscricao_aula',
    'Inscrição confirmada',
    'Sua inscrição na aula foi confirmada com sucesso!',
    false
  )
  ON CONFLICT DO NOTHING;
  
  -- 4. ATUALIZAR COORDENADAS DA ARENA (exemplo São Paulo)
  -- Arena Tennis Club Jardins - São Paulo
  UPDATE arenas 
  SET 
    coordenadas_latitude = -23.561684,
    coordenadas_longitude = -46.655981,
    raio_checkin_metros = 100,
    janela_checkin_minutos_antes = 30,
    janela_checkin_minutos_depois = 15
  WHERE id = v_arena_id;
  
  RAISE NOTICE 'Coordenadas da arena atualizadas para São Paulo';
  
END $$;

-- 5. CRIAR MAIS AULAS PARA TESTE (próximos 7 dias)
DO $$
DECLARE
  v_arena_id uuid;
  v_professor_id uuid;
  v_quadra_id uuid;
  v_agendamento_id uuid;
  v_dia int;
BEGIN
  -- Obter IDs
  SELECT id INTO v_arena_id FROM arenas WHERE status = 'ativo' LIMIT 1;
  SELECT id INTO v_professor_id FROM professores LIMIT 1;
  SELECT id INTO v_quadra_id FROM quadras WHERE arena_id = v_arena_id LIMIT 1;
  
  -- Criar aulas para os próximos 7 dias (segunda a sexta, 18h-19h)
  FOR v_dia IN 1..7 LOOP
    -- Apenas dias úteis
    IF EXTRACT(DOW FROM CURRENT_DATE + v_dia) BETWEEN 1 AND 5 THEN
      
      -- Criar agendamento para a aula
      INSERT INTO agendamentos (
        arena_id,
        quadra_id,
        data_agendamento,
        hora_inicio,
        hora_fim,
        tipo_agendamento,
        modalidade,
        status,
        status_pagamento,
        valor_total,
        max_participantes,
        observacoes_internas
      )
      VALUES (
        v_arena_id,
        v_quadra_id,
        CURRENT_DATE + v_dia,
        '18:00:00',
        '19:00:00',
        'aula',
        'tenis',
        'confirmado',
        'pendente',
        150.00,
        6,
        'Aula de teste criada automaticamente'
      )
      RETURNING id INTO v_agendamento_id;
      
      -- Criar aula vinculada ao agendamento
      INSERT INTO aulas (
        arena_id,
        professor_id,
        quadra_id,
        agendamento_id,
        tipo_aula,
        titulo,
        descricao,
        nivel,
        data_aula,
        hora_inicio,
        hora_fim,
        duracao_minutos,
        max_alunos,
        min_alunos,
        valor_por_aluno,
        status,
        checkin_habilitado,
        objetivos
      )
      VALUES (
        v_arena_id,
        v_professor_id,
        v_quadra_id,
        v_agendamento_id,
        'grupo',
        'Aula de Tênis - Intermediário',
        'Aula em grupo para nível intermediário com foco em técnicas de saque e voleio',
        'intermediario',
        CURRENT_DATE + v_dia,
        '18:00:00',
        '19:00:00',
        60,
        6,
        2,
        25.00,
        'agendada',
        true,
        'Melhorar técnica de saque, praticar voleio, jogos em dupla'
      );
      
      RAISE NOTICE 'Aula criada para dia %', CURRENT_DATE + v_dia;
    END IF;
  END LOOP;
  
END $$;

-- 6. CRIAR TEMPLATES DE NOTIFICAÇÃO SE NÃO EXISTIREM
INSERT INTO templates_notificacao (
  nome,
  tipo,
  categoria,
  mensagem,
  assunto,
  ativo
)
VALUES 
  (
    'Confirmação de Inscrição em Aula',
    'email',
    'inscricao_aula',
    'Olá {{nome_aluno}}, sua inscrição na aula "{{titulo_aula}}" foi confirmada! Data: {{data_aula}} às {{hora_aula}}. Professor: {{nome_professor}}. Vagas restantes: {{vagas_disponiveis}}.',
    'Inscrição Confirmada - {{titulo_aula}}',
    true
  ),
  (
    'Lembrete de Aula',
    'whatsapp',
    'lembrete_aula',
    'Olá {{nome_aluno}}! 👋 Lembrete: você tem aula amanhã às {{hora_aula}} com o professor {{nome_professor}}. Local: {{nome_arena}}. Até lá! 🎾',
    NULL,
    true
  ),
  (
    'Check-in Realizado',
    'sistema',
    'checkin',
    'Check-in confirmado para {{nome_cliente}} em {{data}} às {{hora}}. Quadra {{numero_quadra}}.',
    'Check-in Confirmado',
    true
  )
ON CONFLICT (categoria, tipo) DO UPDATE SET
  mensagem = EXCLUDED.mensagem,
  updated_at = NOW();

-- 7. VERIFICAR DADOS CRIADOS
SELECT 
  'RESUMO DOS DADOS DE TESTE' as titulo,
  (SELECT COUNT(*) FROM professor_alunos) as vinculos_professor_aluno,
  (SELECT COUNT(*) FROM aulas) as total_aulas,
  (SELECT COUNT(*) FROM aulas_alunos) as inscricoes_em_aulas,
  (SELECT COUNT(*) FROM notificacoes WHERE lida = false) as notificacoes_nao_lidas,
  (SELECT COUNT(*) FROM templates_notificacao WHERE ativo = true) as templates_ativos;

-- 8. CONSULTAS ÚTEIS PARA VALIDAÇÃO
-- SELECT * FROM professor_alunos;
-- SELECT * FROM aulas_alunos;
-- SELECT * FROM aulas WHERE data_aula >= CURRENT_DATE ORDER BY data_aula, hora_inicio;
-- SELECT * FROM notificacoes WHERE lida = false;
-- SELECT * FROM arenas WHERE status = 'ativo';
