-- Primeiro, atualizar os slugs dos módulos inclusos nos planos para corresponder aos slugs reais
UPDATE planos_sistema 
SET modulos_inclusos = '["quadras", "agendamentos", "clientes", "financeiro", "aulas", "torneios", "whatsapp", "relatorios"]'::jsonb
WHERE nome = 'Premium';

-- Inserir todos os módulos do plano Premium na arena (se não existirem)
INSERT INTO arena_modulos (arena_id, modulo_id, ativo, data_ativacao)
SELECT 
  a.id as arena_id,
  ms.id as modulo_id,
  true as ativo,
  CURRENT_DATE as data_ativacao
FROM arenas a
CROSS JOIN modulos_sistema ms
WHERE a.plano_sistema_id IN (SELECT id FROM planos_sistema WHERE nome = 'Premium')
  AND ms.slug IN ('quadras', 'agendamentos', 'clientes', 'financeiro', 'aulas', 'torneios', 'whatsapp', 'relatorios')
  AND ms.status = 'ativo'
  AND NOT EXISTS (
    SELECT 1 FROM arena_modulos am 
    WHERE am.arena_id = a.id AND am.modulo_id = ms.id
  );