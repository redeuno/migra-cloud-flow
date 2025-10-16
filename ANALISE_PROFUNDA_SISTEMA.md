# 🔍 ANÁLISE PROFUNDA DO SISTEMA - PERMISSÕES, MÓDULOS E ACESSOS

**Data da Análise**: 2025-10-16  
**Escopo**: Análise completa de permissões, módulos, automações e possíveis falhas

---

## 📊 1. RESUMO EXECUTIVO

### Status Geral
- ✅ Sistema de roles implementado corretamente
- ✅ RLS (Row Level Security) ativo nas tabelas críticas
- ⚠️ Algumas inconsistências em relatórios e filtros
- ✅ Módulos dinâmicos funcionando
- ⚠️ Faltam algumas automações de negócio

---

## 👥 2. ANÁLISE DE PERMISSÕES POR PERFIL

### 2.1 SUPER ADMIN
**Papel**: Administrador global do sistema

#### ✅ Módulos Acessíveis:
1. **Dashboard Super Admin** (`/dashboard-super-admin`)
   - Visão global de todas arenas
   - Métricas: Arenas ativas, receita recorrente, usuários, agendamentos
   - Gráficos: Evolução de arenas, receita mensal, distribuição por plano
   - Top 5 arenas por receita
   
2. **Gestão de Arenas** (`/arenas`)
   - CRUD completo de arenas
   - Visualizar status (ativo/suspenso/inativo)
   - Gerenciar vencimentos
   - Acesso sem filtro de arena_id
   
3. **Configurações do Sistema** (`/configuracoes-sistema`)
   - Gerenciar planos do sistema
   - Gerenciar módulos do sistema
   - Gerenciar categorias financeiras
   - Gerenciar templates de notificações
   
4. **Financeiro Global** (`/financeiro`)
   - Assinaturas de arenas
   - Faturas do sistema
   - Movimentações (com acesso global)
   
5. **Acesso Total**
   - Pode acessar qualquer arena
   - Bypass de RLS em queries específicas
   - Visualizar dados de todas as arenas

#### 🔐 Políticas RLS Aplicadas:
- `has_role(auth.uid(), 'super_admin')` em múltiplas tabelas
- Bypass automático em queries de tenant isolation
- Acesso total via `SECURITY DEFINER` functions

#### ⚠️ Problemas Identificados:
- ✅ Nenhum problema crítico identificado
- ⚠️ Falta dashboard de auditoria/logs

---

### 2.2 ARENA ADMIN
**Papel**: Administrador de uma arena específica

#### ✅ Módulos Acessíveis:
1. **Dashboard Arena** (`/dashboard`)
   - Métricas: Agendamentos, receita, clientes, quadras
   - Agenda do dia
   - Vencimentos próximos
   - Gráficos: Agendamentos semanais, receitas/despesas, uso de quadras
   
2. **Agendamentos** (`/agendamentos`)
   - CRUD completo de agendamentos
   - Check-in manual e QR Code
   - Calendário visual
   - Agendamentos recorrentes
   
3. **Clientes** (`/clientes`)
   - CRUD de clientes/alunos
   - Gestão de contratos
   - Histórico financeiro
   
4. **Quadras** (`/quadras`)
   - CRUD de quadras
   - Bloqueios temporários
   - Horários de pico
   
5. **Aulas** (`/aulas`)
   - CRUD de aulas
   - Gestão de presenças
   - Controle de inscrições
   
6. **Torneios** (`/torneios`)
   - CRUD de torneios
   - Chaveamento automático
   - Inscrições
   
7. **Financeiro** (`/financeiro`)
   - Contratos
   - Mensalidades
   - Movimentações financeiras
   - Relatórios financeiros
   
8. **Relatórios** (`/relatorios`)
   - Relatórios financeiros
   - Relatórios de agendamentos
   - Relatórios de clientes
   
9. **Configurações** (`/configuracoes`)
   - Configurações gerais da arena
   - Horários de funcionamento
   - Configurações de pagamento
   - Integração Evolution API
   - Gerenciar módulos ativos

#### 🔐 Políticas RLS Aplicadas:
- Tenant isolation via `arena_id`
- Acesso apenas aos dados da própria arena
- Queries filtradas automaticamente por `arena_id`

#### ⚠️ Problemas Identificados:
1. **✅ CORRIGIDO**: Relatórios sem filtro de `arena_id` (já corrigido anteriormente)
2. **✅ CORRIGIDO**: Comboboxes sem filtro de arena (já corrigido)
3. ⚠️ **FALTA**: Dashboard de comissões de professores não está no menu
4. ⚠️ **FALTA**: Relatório de ocupação de quadras por horário

---

### 2.3 FUNCIONÁRIO
**Papel**: Equipe operacional da arena

#### ✅ Módulos Acessíveis:
1. **Dashboard** (`/dashboard`) - Mesmo do Arena Admin
2. **Agendamentos** (`/agendamentos`) - Acesso completo
3. **Clientes** (`/clientes`) - Acesso completo
4. **Quadras** (`/quadras`) - Apenas leitura (não pode deletar)
5. **Aulas** (`/aulas`) - Acesso completo
6. **Check-in** - Pode realizar check-ins
7. **Relatórios** (`/relatorios`) - Acesso aos relatórios
8. **Financeiro** - Acesso limitado (sem deletar movimentações)

#### 🔐 Políticas RLS Aplicadas:
- Tenant isolation via `arena_id`
- Restrições em DELETE em algumas tabelas
- Pode INSERT e UPDATE na maioria das operações

#### ⚠️ Problemas Identificados:
- ✅ Funcionário tem acesso adequado
- ⚠️ **FALTA**: Distinguir melhor permissões entre Arena Admin e Funcionário

---

### 2.4 PROFESSOR
**Papel**: Instrutor de aulas

#### ✅ Módulos Acessíveis:
1. **Dashboard** (`/dashboard`) - Dashboard padrão ou específico?
2. **Minhas Aulas** (`/minhas-aulas`) - Apenas suas aulas
3. **Presenças** (`/aula-presencas`) - Gerenciar presenças de suas aulas
4. **Comissões** (`/comissoes`) - Visualizar suas comissões
5. **Agenda** - Ver agendamentos relacionados

#### 🔐 Políticas RLS Aplicadas:
- Acesso apenas a aulas onde é o professor (`professor_id`)
- Visualização de comissões próprias
- Tenant isolation via `arena_id`

#### ⚠️ Problemas Identificados:
1. ⚠️ **CRÍTICO**: Professor não tem dashboard dedicado
2. ⚠️ **FALTA**: Tela de "Minha Agenda" para professores
3. ⚠️ **FALTA**: Perfil do professor com avaliações
4. ✅ Comissões: Acesso correto

---

### 2.5 ALUNO
**Papel**: Cliente/estudante da arena

#### ✅ Módulos Acessíveis:
1. **Dashboard Aluno** (`/dashboard-aluno`)
   - Contratos ativos
   - Próximos agendamentos
   - Mensalidades pendentes
   - Frequência (últimos 30 dias)
   - Gráfico de atividade semanal
   - Notificações recentes
   
2. **Meus Agendamentos** (`/agendamentos`)
   - Visualizar apenas seus agendamentos
   - Fazer check-in
   
3. **Meu Financeiro** (`/meu-financeiro`)
   - Ver contratos
   - Mensalidades pendentes
   - Histórico de pagamentos
   - Link para pagamento (Asaas)
   
4. **Minhas Aulas** (`/minhas-aulas`)
   - Ver aulas inscritas
   - Ver horários

#### 🔐 Políticas RLS Aplicadas:
- Acesso apenas aos próprios dados (`usuario_id = auth.uid()`)
- Visualização de dados públicos (quadras, professores)
- Tenant isolation via `arena_id`

#### ⚠️ Problemas Identificados:
1. ⚠️ **CRÍTICO**: Aluno não deve ter acesso a `/agendamentos` de forma geral
2. ⚠️ **CRÍTICO**: Aluno tem menu com links para páginas administrativas
3. ⚠️ **FALTA**: Tela dedicada "Meus Agendamentos" separada do admin
4. ⚠️ **FALTA**: Perfil do aluno com progresso e estatísticas
5. ⚠️ **FALTA**: Sistema de avaliação de aulas

---

## 🎯 3. SISTEMA DE MÓDULOS

### 3.1 Módulos do Sistema (Globais)

#### Tabela: `modulos_sistema`
- **agendamentos**: Gestão de agendamentos
- **financeiro**: Gestão financeira
- **aulas**: Sistema de aulas
- **torneios**: Sistema de torneios
- **relatorios**: Relatórios e análises
- **comissoes**: Comissões de professores (provavelmente)

#### Funcionamento:
1. Super Admin cria módulos em `/configuracoes-sistema`
2. Módulos são associados a planos (`planos_sistema.modulos_inclusos`)
3. Arena escolhe um plano (`arenas.plano_sistema_id`)
4. Trigger `sync_arena_modulos_on_plan_change()` sincroniza automaticamente
5. Arena Admin pode ativar/desativar módulos do plano em `/configuracoes`

### 3.2 Verificação de Acesso

#### Hook: `useModuloAccess`
```typescript
const { hasAccess, isLoading } = useModuloAccess({
  moduloSlug: "torneios",
  requiredRoles: ["arena_admin", "funcionario"]
});
```

#### Componente: `AppSidebar`
- Filtra menu baseado em:
  1. Role do usuário
  2. Módulos ativos na arena
  3. Super Admin vê tudo

#### ⚠️ Problemas Identificados:
1. ✅ Sistema funciona corretamente
2. ⚠️ **FALTA**: Módulo "comissoes" não está na lista de módulos do sistema
3. ⚠️ **FALTA**: Módulo "dashboard_avancado" para analytics

---

## 🤖 4. AUTOMAÇÕES DO SISTEMA

### 4.1 Automações Implementadas

#### ✅ Triggers Ativos:
1. **`populate_arena_modulos()`**
   - Trigger: `AFTER INSERT` em `arenas`
   - Função: Popula módulos baseado no plano

2. **`sync_arena_modulos_on_plan_change()`**
   - Trigger: `AFTER INSERT OR UPDATE` em `arenas`
   - Função: Sincroniza módulos quando plano muda

3. **`update_updated_at_column()`**
   - Trigger: Múltiplas tabelas
   - Função: Atualiza `updated_at` automaticamente

4. **`gerar_numero_contrato()`**
   - Trigger: `BEFORE INSERT` em `contratos`
   - Função: Gera número único

5. **`gerar_numero_fatura()`**
   - Trigger: `BEFORE INSERT` em `faturas_sistema`
   - Função: Gera número único

6. **`gerar_numero_assinatura()`**
   - Trigger: `BEFORE INSERT` em `assinaturas_arena`
   - Função: Gera número único

7. **`notificar_novo_agendamento()`**
   - Trigger: `AFTER INSERT` em `agendamentos`
   - Função: Cria notificação para admins

8. **`notificar_checkin()`**
   - Trigger: `AFTER UPDATE` em `agendamentos`
   - Função: Notifica quando check-in é feito

### 4.2 Edge Functions Implementadas

#### ✅ Functions Ativas:
1. **`asaas-cobranca`** - Criar cobranças no Asaas
2. **`asaas-webhook`** - Receber webhooks do Asaas
3. **`enviar-link-pagamento`** - Enviar link de pagamento
4. **`enviar-whatsapp-evolution`** - Enviar mensagens WhatsApp
5. **`gerar-fatura-sistema`** - Gerar faturas mensais
6. **`gerar-mensalidades-automaticas`** - Gerar mensalidades
7. **`notificar-agendamentos-proximos`** - Lembrete de agendamentos

### 4.3 Automações Faltantes

#### ⚠️ CRÍTICO - Faltam:
1. **Geração automática de mensalidades** (cron job)
   - Rodar todo dia 1 do mês
   - Gerar mensalidades dos contratos ativos
   
2. **Verificação de vencimento de arena** (cron job)
   - Rodar diariamente
   - Suspender arenas com assinatura vencida
   - Enviar notificações de vencimento próximo
   
3. **Lembretes de agendamentos** (cron job)
   - Rodar a cada hora
   - Enviar lembrete 24h antes
   - Enviar lembrete 2h antes
   
4. **Limpeza de dados antigos** (cron job)
   - Arquivar agendamentos antigos
   - Limpar logs antigos
   
5. **Recálculo de estatísticas** (cron job)
   - Atualizar ranking de quadras
   - Atualizar avaliações médias
   
6. **Relatório mensal automático** (cron job)
   - Gerar relatório consolidado
   - Enviar para arena admins

---

## 📊 5. RELATÓRIOS E ANÁLISES

### 5.1 Relatórios Implementados

#### ✅ Financeiro:
- Receitas x Despesas
- Movimentações por categoria
- Faturamento mensal
- Status de pagamentos

#### ✅ Agendamentos:
- Agendamentos por período
- Taxa de ocupação
- Horários mais populares
- Cancelamentos

#### ✅ Clientes:
- Clientes ativos vs inativos
- Novos clientes por período
- Clientes inadimplentes

### 5.2 Relatórios Faltantes

#### ⚠️ FALTA:
1. **Relatório de Professores**
   - Aulas ministradas
   - Avaliação média
   - Comissões geradas
   
2. **Relatório de Quadras**
   - Taxa de ocupação por quadra
   - Horários de pico real
   - Receita por quadra
   - Tempo de inatividade
   
3. **Relatório de Aulas**
   - Taxa de presença
   - Aulas mais populares
   - Cancelamentos
   
4. **Relatório de Torneios**
   - Participantes
   - Receita gerada
   - Engajamento
   
5. **Dashboard Financeiro Avançado**
   - Projeção de receita
   - Análise de tendências
   - Comparativo ano anterior
   
6. **Relatório de Retenção**
   - Churn rate
   - Lifetime value
   - Análise de cancelamentos

---

## 📈 6. GRÁFICOS E VISUALIZAÇÕES

### 6.1 Dashboards Existentes

#### ✅ Dashboard Arena Admin:
- Métricas: Agendamentos, receita, clientes, quadras
- Gráfico: Agendamentos semanais (barra)
- Gráfico: Receitas e despesas (linha)
- Gráfico: Uso de quadras (pizza)

#### ✅ Dashboard Super Admin:
- Evolução de arenas (linha)
- Receita mensal (barra)
- Distribuição por plano (pizza)
- Top 5 arenas (barra)

#### ✅ Dashboard Aluno:
- Atividade semanal (barra)
- Progresso de frequência (%)

### 6.2 Visualizações Faltantes

#### ⚠️ FALTA:
1. **Heatmap de ocupação**
   - Visualizar horários mais ocupados
   - Por dia da semana
   
2. **Gráfico de conversão**
   - Visitantes → Clientes → Contratos
   
3. **Timeline de eventos**
   - Agendamentos do dia em timeline visual
   
4. **Mapa de quadras**
   - Layout visual das quadras
   - Status em tempo real

---

## 🔒 7. SEGURANÇA E RLS

### 7.1 Políticas RLS Implementadas

#### ✅ Corretas:
- `agendamentos`: Tenant isolation + Super Admin
- `arenas`: Super Admin + Own arena
- `quadras`: Tenant isolation
- `usuarios`: Tenant isolation
- `contratos`: Tenant isolation
- `mensalidades`: Tenant isolation + Usuário pode ver próprias
- `aulas`: Tenant isolation
- `professores`: Tenant isolation
- `comissoes_professores`: Staff manage + Professor view own
- `notificacoes`: Usuário vê próprias + Sistema insere

### 7.2 Problemas de Segurança

#### ✅ Nenhum problema crítico identificado
- RLS está ativo em todas as tabelas sensíveis
- Políticas estão corretas
- Tenant isolation funciona

#### ⚠️ Melhorias Sugeridas:
1. **Audit log** para ações críticas
2. **Rate limiting** em APIs públicas
3. **Validação de input** mais rigorosa
4. **2FA** para super admins

---

## 🐛 8. BUGS E PROBLEMAS ENCONTRADOS

### 8.1 Bugs Críticos

#### 🔴 CRÍTICO:
1. **Aluno vê menu administrativo**
   - Aluno tem acesso visual a links de admin no sidebar
   - Precisa filtrar melhor o `AppSidebar` por role
   
2. **Professor sem dashboard dedicado**
   - Professor vê dashboard genérico
   - Precisa de dashboard específico

### 8.2 Bugs Médios

#### 🟡 MÉDIO:
1. **SelectItem com value vazio** (JÁ CORRIGIDO)
   - Erro no `AulaDialog` com quadra_id
   
2. **Categorias financeiras não filtradas** (DESIGN)
   - Categorias são globais por design
   - Não é bug, mas pode ser melhorado
   
3. **Falta validação de horários conflitantes**
   - Permitir agendamento em horário já ocupado
   
4. **Falta validação de data/hora passada**
   - Permitir criar agendamento no passado

### 8.3 Bugs Menores

#### 🟢 MENOR:
1. **Comboboxes sem mensagem "vazio"** (JÁ CORRIGIDO)
2. **Algumas tabelas sem paginação**
3. **Falta feedback visual em ações assíncronas**

---

## 🎯 9. PLANO DE AÇÃO PRIORITÁRIO

### Prioridade 1 - CRÍTICO (Fazer Agora)

1. **Separar dashboards por perfil**
   ```typescript
   // Criar DashboardProfessor.tsx
   // Redirecionar baseado em role
   ```

2. **Filtrar sidebar por role**
   ```typescript
   // AppSidebar.tsx - melhorar filtro de itens
   ```

3. **Criar página "Meus Agendamentos" para aluno**
   ```typescript
   // Separar de /agendamentos admin
   ```

4. **Implementar cron jobs**
   - Gerar mensalidades
   - Verificar vencimentos
   - Enviar lembretes

### Prioridade 2 - ALTA (Esta Semana)

1. **Validações de negócio**
   - Horários conflitantes
   - Data/hora passada
   - Capacidade de quadra

2. **Relatórios faltantes**
   - Professores
   - Quadras detalhado
   - Retenção

3. **Dashboard professor**
   - Minhas aulas
   - Minhas comissões
   - Minha agenda

### Prioridade 3 - MÉDIA (Este Mês)

1. **Melhorias UX**
   - Paginação em tabelas grandes
   - Loading states
   - Error boundaries

2. **Visualizações avançadas**
   - Heatmap
   - Timeline
   - Mapa de quadras

3. **Perfis de usuário**
   - Perfil do professor
   - Perfil do aluno
   - Avatares

---

## 📋 10. CHECKLIST DE VERIFICAÇÃO

### Super Admin
- ✅ Acesso global a todas arenas
- ✅ Dashboard com métricas globais
- ✅ Gestão de arenas
- ✅ Configurações do sistema
- ✅ Financeiro global
- ⚠️ Falta: Auditoria/logs

### Arena Admin
- ✅ Dashboard da arena
- ✅ CRUD de agendamentos
- ✅ CRUD de clientes
- ✅ CRUD de quadras
- ✅ CRUD de aulas
- ✅ Financeiro
- ✅ Relatórios
- ✅ Configurações
- ⚠️ Falta: Relatório de ocupação

### Funcionário
- ✅ Dashboard
- ✅ Agendamentos
- ✅ Clientes
- ✅ Check-in
- ✅ Aulas
- ✅ Relatórios (leitura)
- ⚠️ Permissões poderiam ser mais granulares

### Professor
- ✅ Ver minhas aulas
- ✅ Gerenciar presenças
- ✅ Ver comissões
- 🔴 Falta: Dashboard dedicado
- 🔴 Falta: Minha agenda
- 🔴 Falta: Perfil público

### Aluno
- ✅ Dashboard aluno
- ✅ Ver meus agendamentos (limitado)
- ✅ Meu financeiro
- ✅ Minhas aulas
- 🔴 Falta: Página dedicada agendamentos
- 🔴 Falta: Filtrar sidebar
- 🔴 Falta: Perfil e progresso

---

## 🎓 11. CONCLUSÕES E RECOMENDAÇÕES

### Pontos Fortes ✅
1. Sistema de roles bem estruturado
2. RLS implementado corretamente
3. Tenant isolation funcionando
4. Módulos dinâmicos funcionais
5. Edge functions implementadas
6. Dashboards informativos

### Pontos Fracos ⚠️
1. Faltam dashboards específicos por perfil
2. Sidebar não filtra adequadamente por role
3. Faltam automações de cron job
4. Faltam relatórios avançados
5. Validações de negócio incompletas

### Recomendações Imediatas 🚀
1. **SEPARAR INTERFACES POR PERFIL**
   - Cada perfil deve ter sua própria experiência
   
2. **IMPLEMENTAR CRON JOBS**
   - Automações críticas para o negócio
   
3. **MELHORAR VALIDAÇÕES**
   - Evitar dados inconsistentes
   
4. **CRIAR RELATÓRIOS AVANÇADOS**
   - Dar insights para decisões

5. **IMPLEMENTAR AUDITORIA**
   - Rastreabilidade de ações críticas

---

## 📞 PRÓXIMOS PASSOS

1. Revisar este documento com a equipe
2. Priorizar itens críticos
3. Criar issues/tasks para cada item
4. Implementar em sprints
5. Testar e validar
6. Deploy incremental

---

**Documento gerado automaticamente pela análise do sistema**  
**Última atualização**: 2025-10-16
