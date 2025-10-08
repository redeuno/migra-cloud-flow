-- Adicionar role arena_admin ao usuário atual
-- Isso permite alternar entre super_admin e arena_admin sem criar nova conta

-- Criar role arena_admin para o usuário logado
INSERT INTO public.user_roles (
  user_id,
  role,
  arena_id
)
VALUES (
  'f9840ebc-8402-42f1-a3cc-735fe22a565b'::uuid,
  'arena_admin',
  '53b6b586-7482-466f-8bf6-290f814d43d9'::uuid
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Criar alguns agendamentos de exemplo para testes
DO $$
DECLARE
  v_quadra_id uuid;
  v_cliente_id uuid;
BEGIN
  -- Buscar primeira quadra da arena
  SELECT id INTO v_quadra_id
  FROM public.quadras
  WHERE arena_id = '53b6b586-7482-466f-8bf6-290f814d43d9'::uuid
  LIMIT 1;

  -- Buscar primeiro cliente da arena  
  SELECT id INTO v_cliente_id
  FROM public.usuarios
  WHERE arena_id = '53b6b586-7482-466f-8bf6-290f814d43d9'::uuid
  LIMIT 1;

  -- Criar agendamentos se houver dados
  IF v_quadra_id IS NOT NULL AND v_cliente_id IS NOT NULL THEN
    INSERT INTO public.agendamentos (
      arena_id, quadra_id, cliente_id, data_agendamento,
      hora_inicio, hora_fim, modalidade, tipo_agendamento,
      status, status_pagamento, valor_total, max_participantes
    )
    VALUES 
    (
      '53b6b586-7482-466f-8bf6-290f814d43d9'::uuid, v_quadra_id, v_cliente_id,
      CURRENT_DATE, '18:00', '19:00', 'beach_tennis',
      'avulso', 'confirmado', 'pago', 100.00, 4
    ),
    (
      '53b6b586-7482-466f-8bf6-290f814d43d9'::uuid, v_quadra_id, v_cliente_id,
      CURRENT_DATE + 1, '20:00', '21:00', 'beach_tennis',
      'avulso', 'pendente', 'pendente', 100.00, 4
    ),
    (
      '53b6b586-7482-466f-8bf6-290f814d43d9'::uuid, v_quadra_id, v_cliente_id,
      CURRENT_DATE + 2, '10:00', '11:00', 'beach_tennis',
      'mensalista', 'confirmado', 'pago', 80.00, 4
    )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;