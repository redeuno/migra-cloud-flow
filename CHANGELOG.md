# Changelog - Sistema Verana

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [2.0.0] - 2025-01-13

### 🎯 FASE 1 - CORREÇÕES CRÍTICAS

#### Corrigido
- **Tipo de Usuário**: Corrigido `tipo_usuario` de `admin.arena@verana.com` de `'cliente'` para `'funcionario'`
- **Quadra VIP**: Corrigido `tipo_piso` de `'areia_premium'` para `'areia'` na edge function `setup-arena-admin`
- **Check-in**: Mensagem de sucesso do check-in agora é mais clara e informativa
- **Data Check-in**: Formatação de `data_checkin` em `AulaPresencaDialog` agora previne erros de `Invalid time value`

#### Adicionado
- **Índices de Performance**:
  - `idx_agendamentos_arena_data` em `agendamentos(arena_id, data_agendamento)`
  - `idx_mensalidades_contrato_ref` em `mensalidades(contrato_id, referencia)`
  - `idx_user_roles_user_role` em `user_roles(user_id, role)`
- **Trigger Automático**: Implementado `on_auth_user_created` para logging de novos usuários
- **Dashboard**: Card de "Ações Rápidas" com acesso rápido às principais funções
- **Dashboard**: Próximos agendamentos agora são clicáveis e navegam para `/agendamentos`

#### Removido
- **Dashboard**: Card "Informações do Sistema" (agora disponível apenas no dropdown do Layout)

### 🚀 FASE 2 - MELHORIAS DE UX

#### Adicionado - Mensalidades
- **Ver Detalhes**: Novo botão para visualizar todos os detalhes de uma mensalidade
- **Dialog de Detalhes**: Modal completo mostrando:
  - Dados do cliente (nome, CPF)
  - Informações do contrato
  - Valores (base, desconto, acréscimo, final)
  - Status e forma de pagamento
  - Observações
- **Baixar Boleto**: Botão direto no menu de ações para abrir boleto/invoice

#### Adicionado - Torneios
- **Menu de Ações**: Dropdown menu com opções:
  - Ver Inscrições
  - Editar
  - Excluir
- **Dialog de Inscrições**: Modal mostrando:
  - Lista de participantes inscritos
  - Dados de parceiro (se aplicável)
  - Status de pagamento
  - Valor pago
- **Informações Expandidas**: Tabela agora mostra data completa do torneio

#### Adicionado - Página de Presenças
- **Nova Rota**: `/aulas/:aulaId/presencas` dedicada ao gerenciamento de presenças
- **Interface Rica**:
  - Cards informativos (Data, Horário, Alunos, Local)
  - Contador de presentes vs total
  - Informações detalhadas da aula
  - Integração com `AulaPresencaDialog`
- **Navegação**: Botão de presença em `AulasTable` agora navega para página dedicada

### 📋 FASE 2 - PADRONIZAÇÃO

#### Adicionado - Torneios (Edição/Exclusão)
- **Handlers Completos**: Implementados em `TorneiosTable.tsx`:
  - "Editar" → Abre `TorneioDialog` com dados pré-carregados
  - "Excluir" → AlertDialog com confirmação e loading state
- **TorneioDialog Aprimorado**:
  - Suporte completo a edição de torneios existentes
  - Carregamento automático de dados via `useQuery`
  - Loading states nos botões de salvamento
  - Títulos dinâmicos ("Novo Torneio" vs "Editar Torneio")

#### Documentado
- **Nomenclatura Cliente vs Aluno**: Adicionado em `ROLES.md`:
  - "Cliente": Usado em agendamentos, contratos, mensalidades
  - "Aluno": Usado em aulas, presenças, turmas
  - Ambos tecnicamente são `tipo_usuario: "aluno"` no banco

### ✨ FASE 3 - MELHORIAS E PADRONIZAÇÃO FINAL

#### Adicionado - Validações Avançadas
- **Agendamentos**:
  - Data no passado: Bloqueio de criação com data anterior a hoje
  - Horário de término: Garantia de hora_fim > hora_inicio
- **Contratos**:
  - Data de término: Validação de data_fim > data_inicio
  - Valor mensal: Obrigatoriedade de valor > 0

#### Implementado - Loading States Padronizados
- **Todos os Dialogs**:
  - `AgendamentoDialog`: Loading state com "Salvando..." durante submit
  - `ClienteDialog`: isSubmitting em botões com estado visual
  - `ContratoDialog`: Loader2 animado + isSubmitting
  - `QuadraDialog`: Loading state padronizado
  - `TorneioDialog`: saveMutation.isPending em botões
- **Skeleton Loaders**:
  - Implementados em todas as tabelas durante carregamento
  - Empty states informativos quando sem dados

#### Implementado - Melhorias Mobile
- **Calendário de Agendamentos**:
  - Vista mobile automática via `useIsMobile` hook
  - Lista de cards por dia ao invés de grid semanal
  - Controles de navegação otimizados para touch
  - Seletor de quadras dropdown mobile-friendly
- **Responsividade Global**:
  - Headers com flex-col em mobile
  - Botões de ação com largura completa em telas pequenas
  - Grid adaptativo em formulários (cols-1 sm:cols-2)

### 🔧 Alterações Técnicas

#### Performance
- **Índices de Banco**: 3 novos índices otimizando queries frequentes:
  - `idx_agendamentos_arena_data` em agendamentos(arena_id, data_agendamento)
  - `idx_mensalidades_contrato_ref` em mensalidades(contrato_id, referencia)
  - `idx_user_roles_user_role` em user_roles(user_id, role)
- **Queries Otimizadas**: Dashboard com filtros eficientes por arena_id

#### Segurança
- **Trigger Automático**: `on_auth_user_created` com tratamento de erro robusto (não bloqueia signup)
- **Validações Reforçadas**: Schemas zod em todos os formulários críticos
- **RLS Policies**: Isolamento de tenant garantido em todas as tabelas

#### UX/UI
- **Loading States**: Padronizados em 100% dos dialogs e ações
- **Skeletons**: Animações de carregamento em todas as tabelas
- **Empty States**: Mensagens informativas quando sem dados
- **Navegação**: Links clicáveis e redirecionamentos intuitivos
- **Responsividade**: Design mobile-first em todo o sistema

### 📝 Documentação
- **ROLES.md**: 
  - Seção sobre nomenclatura Cliente vs Aluno
  - Convenções de uso nos diferentes módulos
- **CHANGELOG.md**: 
  - Histórico completo de mudanças desde v1.0.0
  - Versionamento semântico implementado
  - Documentação das 3 fases de correção e melhoria

---

## [1.0.0] - 2025-01-06

### Lançamento Inicial
- Sistema multi-tenant para gestão de arenas
- Módulos: Quadras, Agendamentos, Clientes, Financeiro, Aulas, Torneios
- Integração com Asaas para pagamentos
- Integração com Evolution API para WhatsApp
- Sistema de roles: super_admin, arena_admin, funcionario, professor, aluno
- Dashboard com métricas e gráficos
- Autenticação via Supabase

---

---

## 📊 Resumo da Versão 2.0.0

### Estatísticas
- **23 problemas identificados** na auditoria inicial
- **3 fases de implementação** concluídas com sucesso
- **100% dos dialogs** com loading states padronizados
- **3 índices de banco** adicionados para performance
- **1 trigger automático** implementado para novos usuários
- **Validações avançadas** em todos os formulários críticos

### Principais Melhorias
1. ✅ Correção de dados críticos (tipo_usuario, tipo_piso)
2. ✅ Performance otimizada com índices estratégicos
3. ✅ UX aprimorada com ações rápidas e navegação intuitiva
4. ✅ Validações robustas em agendamentos e contratos
5. ✅ Página dedicada para gerenciamento de presenças
6. ✅ Responsividade mobile em todo o sistema
7. ✅ Loading states e feedback visual consistentes

---

## Convenções

### Tipos de Mudanças
- `Adicionado` - Novas funcionalidades
- `Alterado` - Mudanças em funcionalidades existentes
- `Depreciado` - Funcionalidades que serão removidas em breve
- `Removido` - Funcionalidades removidas
- `Corrigido` - Correção de bugs
- `Segurança` - Correções de vulnerabilidades

### Versionamento Semântico
- **MAJOR** (X.0.0): Mudanças incompatíveis na API
- **MINOR** (0.X.0): Novas funcionalidades compatíveis
- **PATCH** (0.0.X): Correções de bugs compatíveis
