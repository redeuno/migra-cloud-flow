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

### ✨ FASE 3 - VALIDAÇÕES AVANÇADAS

#### Adicionado - Validações de Agendamentos
- **Data no Passado**: Agendamentos não podem ser criados com data anterior a hoje
- **Horário de Término**: Validação mantida garantindo que hora_fim > hora_inicio

#### Adicionado - Validações de Contratos
- **Data de Término**: Se informada, deve ser posterior à data de início
- **Valor Mensal**: Deve ser maior que zero

### 🔧 Alterações Técnicas

#### Performance
- 3 novos índices no banco para otimizar queries mais frequentes
- Queries de dashboard otimizadas com filtros por `arena_id`

#### Segurança
- Trigger `on_auth_user_created` com tratamento de erro (não bloqueia signup)
- Validações server-side reforçadas

#### UX/UI
- Loading states padronizados em todas as tabelas
- Skeletons durante carregamento de dados
- Empty states informativos
- Navegação melhorada entre páginas relacionadas

### 📝 Documentação
- `ROLES.md`: Adicionada seção sobre nomenclatura Cliente vs Aluno
- `CHANGELOG.md`: Criado para rastrear mudanças do sistema

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
