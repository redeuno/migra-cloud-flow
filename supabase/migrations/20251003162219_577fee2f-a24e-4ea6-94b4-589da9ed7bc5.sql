-- Habilitar extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Configurar cron job para gerar mensalidades automaticamente (todo dia às 6h)
SELECT cron.schedule(
  'gerar-mensalidades-diarias',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url:='https://nxissybzirfxjewvamgy.supabase.co/functions/v1/gerar-mensalidades-automaticas',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54aXNzeWJ6aXJmeGpld3ZhbWd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwOTk0NzIsImV4cCI6MjA3NDY3NTQ3Mn0.X4Hn_e5Cm46-8LyKuiNEQx_h3Y3MKHVmY8_LfpPBo54"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);

-- Configurar cron job para gerar faturas do sistema (dia 1 de cada mês às 8h)
SELECT cron.schedule(
  'gerar-faturas-sistema-mensal',
  '0 8 1 * *',
  $$
  SELECT net.http_post(
    url:='https://nxissybzirfxjewvamgy.supabase.co/functions/v1/gerar-fatura-sistema',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54aXNzeWJ6aXJmeGpld3ZhbWd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwOTk0NzIsImV4cCI6MjA3NDY3NTQ3Mn0.X4Hn_e5Cm46-8LyKuiNEQx_h3Y3MKHVmY8_LfpPBo54"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);

-- Comentário: Cron jobs configurados com sucesso!
-- 1. gerar-mensalidades-diarias: Executa todo dia às 6h da manhã
-- 2. gerar-faturas-sistema-mensal: Executa no dia 1 de cada mês às 8h

-- Para visualizar os cron jobs ativos:
-- SELECT * FROM cron.job;

-- Para remover um cron job (se necessário):
-- SELECT cron.unschedule('nome-do-job');