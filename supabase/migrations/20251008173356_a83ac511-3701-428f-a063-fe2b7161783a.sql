-- FASE 3: Limpar planos duplicados antigos
-- Manter apenas os planos com ID específicos (os mais recentes)
DELETE FROM planos_sistema 
WHERE nome = 'Básico' 
  AND valor_mensal = 99.90 
  AND id != '5a76fa71-3f17-4b06-8773-19fbcdbfc5bd';

DELETE FROM planos_sistema 
WHERE nome = 'Pro' 
  AND valor_mensal = 199.90 
  AND id != '962b6cf9-0a6d-4b18-8343-b265b3ea1b88';

-- FASE 4: Criar módulos do sistema base
INSERT INTO modulos_sistema (nome, slug, descricao, icone, ordem, status) VALUES
  ('Gestão de Quadras', 'quadras', 'Gerenciamento completo de quadras, bloqueios e manutenções', 'SquareActivity', 1, 'ativo'),
  ('Agendamentos', 'agendamentos', 'Sistema de reservas e agendamentos de horários', 'Calendar', 2, 'ativo'),
  ('Gestão de Clientes', 'clientes', 'Cadastro e gerenciamento de clientes e usuários', 'Users', 3, 'ativo'),
  ('Financeiro', 'financeiro', 'Controle financeiro, mensalidades, contratos e movimentações', 'DollarSign', 4, 'ativo'),
  ('Aulas', 'aulas', 'Gestão de aulas, professores e alunos', 'GraduationCap', 5, 'ativo'),
  ('Torneios', 'torneios', 'Organização e gestão de torneios e competições', 'Trophy', 6, 'ativo'),
  ('Notificações WhatsApp', 'whatsapp', 'Integração com Evolution API para notificações automáticas', 'MessageSquare', 7, 'ativo'),
  ('Relatórios e Dashboards', 'relatorios', 'Relatórios gerenciais e dashboards analíticos', 'BarChart3', 8, 'ativo')
ON CONFLICT (slug) DO NOTHING;