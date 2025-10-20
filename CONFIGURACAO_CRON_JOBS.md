# 📅 Configuração de Cron Jobs - Sistema Verana

## ⚠️ IMPORTANTE
Os cron jobs precisam ser configurados manualmente no Supabase via SQL Editor, pois são gerenciados pelo PostgreSQL (extensão `pg_cron`).

## 🔧 Pré-requisitos

Antes de configurar os cron jobs, ative as extensões necessárias:

```sql
-- Ativar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
```

## 📋 Cron Jobs Necessários

### 1️⃣ Gerar Faturas Mensais (Dia 1 de cada mês)

**Função:** `gerar-fatura-sistema`  
**Frequência:** Dia 1 de cada mês às 08:00  
**Descrição:** Gera faturas mensais para todas assinaturas ativas

```sql
-- Agendar geração de faturas mensais
SELECT cron.schedule(
  'gerar-faturas-mensais-sistema',
  '0 8 1 * *', -- Dia 1 de cada mês às 08:00
  $$
  SELECT net.http_post(
      url:='https://nxissybzirfxjewvamgy.supabase.co/functions/v1/gerar-fatura-sistema',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54aXNzeWJ6aXJmeGpld3ZhbWd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwOTk0NzIsImV4cCI6MjA3NDY3NTQ3Mn0.X4Hn_e5Cm46-8LyKuiNEQx_h3Y3MKHVmY8_LfpPBo54"}'::jsonb,
      body:=concat('{"time": "', now(), '"}')::jsonb
  ) as request_id;
  $$
);
```

### 2️⃣ Verificar Vencimentos e Suspender Arenas (Diário)

**Função:** `verificar-vencimentos-faturas`  
**Frequência:** Diariamente às 09:00  
**Descrição:** Verifica faturas vencidas, marca como "vencido" e suspende arenas inadimplentes

```sql
-- Agendar verificação diária de vencimentos
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
```

### 3️⃣ Enviar Lembretes de Vencimento (Diário)

**Função:** `enviar-lembrete-fatura`  
**Frequência:** Diariamente às 10:00  
**Descrição:** Envia lembretes para faturas que vencerão em 3 dias

```sql
-- Agendar lembretes diários
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
```

## 🔍 Comandos de Gerenciamento

### Listar Cron Jobs Ativos
```sql
SELECT * FROM cron.job;
```

### Desativar um Cron Job
```sql
SELECT cron.unschedule('nome-do-job');

-- Exemplos:
SELECT cron.unschedule('gerar-faturas-mensais-sistema');
SELECT cron.unschedule('verificar-vencimentos-faturas-diario');
SELECT cron.unschedule('enviar-lembretes-vencimento-diario');
```

### Ver Logs de Execução
```sql
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 20;
```

### Verificar se Cron está Ativo
```sql
SELECT jobid, schedule, command, nodename, nodeport, database, username, active
FROM cron.job
WHERE jobname IN (
  'gerar-faturas-mensais-sistema',
  'verificar-vencimentos-faturas-diario',
  'enviar-lembretes-vencimento-diario'
);
```

## 🧪 Testar Edge Functions Manualmente

Antes de configurar os crons, teste as edge functions manualmente:

```bash
# 1. Gerar Faturas
curl -X POST https://nxissybzirfxjewvamgy.supabase.co/functions/v1/gerar-fatura-sistema \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54aXNzeWJ6aXJmeGpld3ZhbWd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwOTk0NzIsImV4cCI6MjA3NDY3NTQ3Mn0.X4Hn_e5Cm46-8LyKuiNEQx_h3Y3MKHVmY8_LfpPBo54" \
  -H "Content-Type: application/json"

# 2. Verificar Vencimentos
curl -X POST https://nxissybzirfxjewvamgy.supabase.co/functions/v1/verificar-vencimentos-faturas \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54aXNzeWJ6aXJmeGpld3ZhbWd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwOTk0NzIsImV4cCI6MjA3NDY3NTQ3Mn0.X4Hn_e5Cm46-8LyKuiNEQx_h3Y3MKHVmY8_LfpPBo54" \
  -H "Content-Type: application/json"

# 3. Enviar Lembretes
curl -X POST https://nxissybzirfxjewvamgy.supabase.co/functions/v1/enviar-lembrete-fatura \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54aXNzeWJ6aXJmeGpld3ZhbWd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwOTk0NzIsImV4cCI6MjA3NDY3NTQ3Mn0.X4Hn_e5Cm46-8LyKuiNEQx_h3Y3MKHVmY8_LfpPBo54" \
  -H "Content-Type: application/json"
```

## 📊 Formato de Resposta Esperado

Todas as edge functions retornam JSON com:

```json
{
  "success": true,
  "message": "Descrição do resultado",
  // ... dados específicos
}
```

## ⚠️ Troubleshooting

### Erro: "pg_cron extension not found"
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

### Erro: "pg_net extension not found"
```sql
CREATE EXTENSION IF NOT EXISTS pg_net;
```

### Cron não está executando
1. Verifique se o job está ativo: `SELECT * FROM cron.job WHERE active = true;`
2. Verifique os logs de erro: `SELECT * FROM cron.job_run_details WHERE status = 'failed';`
3. Teste a edge function manualmente primeiro

### Edge Function retorna erro
1. Verifique os logs da função no dashboard Supabase
2. Confirme que as variáveis de ambiente estão configuradas
3. Teste com dados reais no banco

## 🔗 Links Úteis

- [Supabase Cron Jobs Documentation](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [pg_cron Syntax](https://github.com/citusdata/pg_cron)
- [Crontab Guru - Validador de Sintaxe](https://crontab.guru/)

## 📝 Notas Importantes

1. **Timezone:** Os cron jobs usam UTC por padrão. Ajuste os horários conforme necessário.
2. **Monitoramento:** Monitore regularmente a tabela `cron.job_run_details` para verificar execuções.
3. **Logs:** As edge functions registram em `historico_atividades` para rastreamento.
4. **Notificações:** Arena Admins são notificados via tabela `notificacoes`.
5. **Testing:** Sempre teste manualmente antes de configurar o cron job.
