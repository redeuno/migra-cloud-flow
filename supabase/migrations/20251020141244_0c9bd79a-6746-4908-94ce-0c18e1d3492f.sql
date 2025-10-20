-- ============================================================
-- CONFIGURAÇÃO DE CRON JOBS - AUTOMAÇÕES FINANCEIRAS
-- ============================================================

-- Ativar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================
-- CRON JOB 1: Gerar Faturas Mensais
-- Execução: Dia 1 de cada mês às 08:00 UTC
-- ============================================================
SELECT cron.schedule(
  'gerar-faturas-mensais-sistema',
  '0 8 1 * *', -- Cron: minuto hora dia_mes mes dia_semana
  $$
  SELECT net.http_post(
      url:='https://nxissybzirfxjewvamgy.supabase.co/functions/v1/gerar-fatura-sistema',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54aXNzeWJ6aXJmeGpld3ZhbWd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwOTk0NzIsImV4cCI6MjA3NDY3NTQ3Mn0.X4Hn_e5Cm46-8LyKuiNEQx_h3Y3MKHVmY8_LfpPBo54"}'::jsonb,
      body:=concat('{"time": "', now(), '"}')::jsonb
  ) as request_id;
  $$
);

-- ============================================================
-- CRON JOB 2: Verificar Vencimentos e Suspender Arenas
-- Execução: Diariamente às 09:00 UTC
-- ============================================================
SELECT cron.schedule(
  'verificar-vencimentos-faturas-diario',
  '0 9 * * *', -- Todos os dias às 09:00
  $$
  SELECT net.http_post(
      url:='https://nxissybzirfxjewvamgy.supabase.co/functions/v1/verificar-vencimentos-faturas',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54aXNzeWJ6aXJmeGpld3ZhbWd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwOTk0NzIsImV4cCI6MjA3NDY3NTQ3Mn0.X4Hn_e5Cm46-8LyKuiNEQx_h3Y3MKHVmY8_LfpPBo54"}'::jsonb,
      body:=concat('{"time": "', now(), '"}')::jsonb
  ) as request_id;
  $$
);

-- ============================================================
-- CRON JOB 3: Enviar Lembretes de Vencimento (3 dias antes)
-- Execução: Diariamente às 10:00 UTC
-- ============================================================
SELECT cron.schedule(
  'enviar-lembretes-vencimento-diario',
  '0 10 * * *', -- Todos os dias às 10:00
  $$
  SELECT net.http_post(
      url:='https://nxissybzirfxjewvamgy.supabase.co/functions/v1/enviar-lembrete-fatura',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54aXNzeWJ6aXJmeGpld3ZhbWd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwOTk0NzIsImV4cCI6MjA3NDY3NTQ3Mn0.X4Hn_e5Cm46-8LyKuiNEQx_h3Y3MKHVmY8_LfpPBo54"}'::jsonb,
      body:=concat('{"time": "', now(), '"}')::jsonb
  ) as request_id;
  $$
);

-- ============================================================
-- Comentários e Documentação
-- ============================================================
COMMENT ON EXTENSION pg_cron IS 'Extensão para agendamento de jobs periódicos no PostgreSQL';
COMMENT ON EXTENSION pg_net IS 'Extensão para fazer requisições HTTP do PostgreSQL';

-- Log de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Cron jobs configurados com sucesso:';
  RAISE NOTICE '   1. gerar-faturas-mensais-sistema (dia 1 às 08:00 UTC)';
  RAISE NOTICE '   2. verificar-vencimentos-faturas-diario (diário às 09:00 UTC)';
  RAISE NOTICE '   3. enviar-lembretes-vencimento-diario (diário às 10:00 UTC)';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Verificar status: SELECT * FROM cron.job;';
  RAISE NOTICE '📋 Ver logs: SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;';
END $$;