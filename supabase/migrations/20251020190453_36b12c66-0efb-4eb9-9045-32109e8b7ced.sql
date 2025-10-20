-- Apenas adicionar novos valores ao enum tipo_notificacao
ALTER TYPE tipo_notificacao ADD VALUE IF NOT EXISTS 'novo_aluno';
ALTER TYPE tipo_notificacao ADD VALUE IF NOT EXISTS 'professor_vinculado';
ALTER TYPE tipo_notificacao ADD VALUE IF NOT EXISTS 'inscricao_aula';