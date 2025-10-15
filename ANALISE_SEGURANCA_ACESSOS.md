# Análise Profunda de Segurança e Acessos por Perfil

**Data:** 2025-10-15
**Status:** 🔴 **CRÍTICO - PROBLEMAS ENCONTRADOS**

---

## 🚨 PROBLEMAS CRÍTICOS ENCONTRADOS

### 1. ❌ **VAZAMENTO DE DADOS - Relatórios sem Tenant Isolation**

**Arquivo:** `src/components/relatorios/RelatorioAgendamentos.tsx` (linha 41-48)
**Problema:** Query SEM filtro por `arena_id`
```typescript
const { data, error } = await supabase
  .from("agendamentos")
  .select("*, quadras(nome, numero)")
  .gte("data_agendamento", format(inicio, "yyyy-MM-dd"))
  .lte("data_agendamento", format(fim, "yyyy-MM-dd"));
// ❌ FALTA: .eq("arena_id", arenaId)
```
**Impacto:** 🔴 **CRÍTICO** - Arena pode ver agendamentos de OUTRAS arenas
**Status:** 🔧 CORRIGIR URGENTE

---

### 2. ❌ **VAZAMENTO DE DADOS - Relatório de Clientes sem Filtro**

**Arquivo:** `src/components/relatorios/RelatorioClientes.tsx` (linha 39-45)
**Problema:** Query busca TODOS os usuários do sistema
```typescript
const { data, error } = await supabase
  .from("usuarios")
  .select("*")
  .order("created_at", { ascending: false });
// ❌ FALTA: .eq("arena_id", arenaId)
```
**Impacto:** 🔴 **CRÍTICO** - Arena vê TODOS os clientes do sistema
**Status:** 🔧 CORRIGIR URGENTE

---

### 3. ❌ **VAZAMENTO DE DADOS - Agendamentos de Clientes sem Filtro**

**Arquivo:** `src/components/relatorios/RelatorioClientes.tsx` (linha 51-58)
**Problema:** Query de agendamentos sem filtro de arena
```typescript
const { data, error } = await supabase
  .from("agendamentos")
  .select("*, usuarios!agendamentos_cliente_id_fkey(nome_completo)")
  .gte("data_agendamento", format(inicio, "yyyy-MM-dd"))
  .lte("data_agendamento", format(fim, "yyyy-MM-dd"));
// ❌ FALTA: .eq("arena_id", arenaId)
```
**Impacto:** 🔴 **CRÍTICO** - Dados cross-arena
**Status:** 🔧 CORRIGIR URGENTE

---

### 4. ⚠️ **MÉDIO - Página Comissões sem Verificação de Perfil**

**Arquivo:** `src/pages/Comissoes.tsx`
**Problema:** Não tem `ProtectedRoute` com role específica no App.tsx
**Impacto:** Alunos podem acessar `/comissoes` se digitarem a URL
**Status:** 🔧 ADICIONAR PROTEÇÃO

---

### 5. ⚠️ **MÉDIO - Relatórios acessíveis por Alunos**

**Arquivo:** `src/pages/Relatorios.tsx`
**Problema:** Rota `/relatorios` não tem `requiredRole`
**Impacto:** Alunos podem ver relatórios da arena
**Status:** 🔧 RESTRINGIR ACESSO

---

## ✅ PONTOS POSITIVOS ENCONTRADOS

### 1. ✅ Proteção de Rotas Admin
- `/arenas` - Apenas super_admin ✅
- `/configuracoes-sistema` - Apenas super_admin ✅
- `/arena-setup` - Apenas super_admin ✅

### 2. ✅ Proteção de Rotas de Aluno
- `/meu-financeiro` - Apenas aluno ✅
- `/minhas-aulas` - Apenas aluno ✅

### 3. ✅ Dashboards Diferenciados
- Super Admin → `DashboardSuperAdmin` ✅
- Aluno → `DashboardAluno` ✅
- Arena Admin/Funcionário → `Dashboard` ✅

### 4. ✅ Tenant Isolation na Maioria das Queries
- Agendamentos (tabela) ✅
- Quadras ✅
- Clientes (página) ✅
- Aulas ✅
- Contratos ✅
- Movimentações ✅

### 5. ✅ RLS Policies Implementadas
- Todas as tabelas têm RLS ativado ✅
- Policies usando `has_role()` ✅
- Tenant isolation via `arena_id` ✅

---

## 📊 MAPEAMENTO DE ACESSOS POR PERFIL

### 🔵 SUPER ADMIN
**Páginas Acessíveis:**
- ✅ Dashboard Global (`/`)
- ✅ Arenas (`/arenas`)
- ✅ Configurações Sistema (`/configuracoes-sistema`)
- ✅ Setup Arena (`/arena-setup`)
- ✅ Financeiro (visualiza todas arenas)
- ✅ Todas as outras páginas

**Verificações:**
- ✅ Bypass do ArenaAccessGuard
- ✅ Bypass de verificação de módulos
- ✅ Acesso total via RLS policies

**Problemas:**
- ✅ Nenhum problema encontrado

---

### 🟢 ARENA ADMIN
**Páginas Acessíveis:**
- ✅ Dashboard da Arena (`/`)
- ✅ Quadras (`/quadras`)
- ✅ Agendamentos (`/agendamentos`)
- ✅ Clientes (`/clientes`)
- ✅ Financeiro (`/financeiro`)
- ✅ Aulas (`/aulas`)
- ✅ Torneios (`/torneios`)
- ✅ Relatórios (`/relatorios`) - ❌ SEM FILTRO
- ✅ Configurações (`/configuracoes`)

**Verificações:**
- ✅ ArenaAccessGuard verifica status
- ✅ Módulos verificados no sidebar
- ✅ Tenant isolation na maioria das queries

**Problemas Encontrados:**
- ❌ Relatórios de agendamentos SEM filtro de arena
- ❌ Relatórios de clientes SEM filtro de arena
- ⚠️ Pode acessar `/comissoes` sem proteção

---

### 🟡 FUNCIONÁRIO
**Páginas Acessíveis:**
- ✅ Dashboard da Arena (`/`)
- ✅ Quadras (`/quadras`)
- ✅ Agendamentos (`/agendamentos`)
- ✅ Clientes (`/clientes`)
- ✅ Financeiro (visualização) (`/financeiro`)
- ✅ Aulas (`/aulas`)

**Verificações:**
- ✅ ArenaAccessGuard verifica status
- ✅ Módulos verificados no sidebar
- ✅ RLS limita operações

**Problemas Encontrados:**
- ❌ Mesmos problemas de relatórios
- ⚠️ Pode acessar `/relatorios` se souber URL

---

### 🟣 PROFESSOR
**Páginas Acessíveis:**
- ✅ Dashboard da Arena (`/`)
- ✅ Aulas (suas aulas) (`/aulas`)
- ✅ Comissões (visualização) (`/comissoes`)

**Verificações:**
- ✅ RLS filtra apenas suas comissões
- ✅ RLS filtra apenas suas aulas

**Problemas Encontrados:**
- ⚠️ Pode acessar `/relatorios` se souber URL
- ⚠️ Pode acessar outras páginas via URL direta

---

### 🔴 ALUNO
**Páginas Acessíveis:**
- ✅ Dashboard Aluno (`/`)
- ✅ Minhas Aulas (`/minhas-aulas`)
- ✅ Meu Financeiro (`/meu-financeiro`)

**Verificações:**
- ✅ RLS filtra apenas seus dados
- ✅ Dashboard específico

**Problemas Encontrados:**
- ❌ CRÍTICO: Pode acessar `/relatorios` e ver dados de TODA arena
- ❌ CRÍTICO: Pode acessar `/agendamentos` via URL
- ❌ CRÍTICO: Pode acessar `/clientes` via URL
- ⚠️ Sem proteção granular de rotas

---

## 🔒 ANÁLISE DE SEGURANÇA RLS

### ✅ Tabelas com RLS Correto
1. **agendamentos** - Tenant isolation ✅
2. **quadras** - Tenant isolation ✅
3. **aulas** - Tenant isolation ✅
4. **contratos** - Tenant isolation ✅
5. **mensalidades** - Tenant + user isolation ✅
6. **comissoes_professores** - Professor vê apenas suas ✅
7. **user_roles** - Correto com has_role() ✅

### ⚠️ Avisos do Linter Supabase

1. **Function Search Path Mutable**
   - Funções sem `SET search_path`
   - Risco: SQL injection em funções
   - Ação: Adicionar `SET search_path = public`

2. **Extension in Public Schema**
   - Extensões no schema public
   - Risco: Baixo, mas não é best practice
   - Ação: Mover extensões para schema próprio

3. **Leaked Password Protection Disabled**
   - Proteção de senhas vazadas desativada
   - Risco: Usuários podem usar senhas conhecidas
   - Ação: Ativar no Supabase Dashboard

---

## 🎯 PLANO DE AÇÃO PRIORITÁRIO

### URGENTE (Fazer AGORA)
1. ❌ Adicionar filtro `arena_id` em RelatorioAgendamentos
2. ❌ Adicionar filtro `arena_id` em RelatorioClientes
3. ❌ Proteger rota `/relatorios` (apenas admin/funcionário)
4. ❌ Proteger rota `/comissoes` (apenas admin/funcionário/professor)

### ALTA PRIORIDADE
5. ⚠️ Adicionar proteção de rotas por perfil (professor, aluno)
6. ⚠️ Corrigir funções sem search_path
7. ⚠️ Ativar proteção de senhas vazadas

### MÉDIA PRIORIDADE
8. ℹ️ Adicionar logs de acesso a dados sensíveis
9. ℹ️ Implementar auditoria de queries
10. ℹ️ Documentar matriz de permissões

---

## 📋 CHECKLIST DE VERIFICAÇÃO

### Por Perfil
- [ ] Super Admin - Acesso total ✅
- [ ] Arena Admin - Apenas sua arena ❌ (relatórios sem filtro)
- [ ] Funcionário - Apenas sua arena ❌ (relatórios sem filtro)
- [ ] Professor - Apenas seus dados ⚠️ (pode acessar URLs)
- [ ] Aluno - Apenas seus dados ❌ (pode acessar relatórios)

### Por Funcionalidade
- [ ] Agendamentos - Filtrado ✅
- [ ] Quadras - Filtrado ✅
- [ ] Clientes - Filtrado ✅ (página) / ❌ (relatórios)
- [ ] Financeiro - Filtrado ✅
- [ ] Relatórios - Filtrado ❌ CRÍTICO
- [ ] Aulas - Filtrado ✅
- [ ] Comissões - Filtrado ✅ (RLS) / ⚠️ (rota)

### Segurança
- [ ] RLS ativo em todas tabelas ✅
- [ ] Policies corretas ✅
- [ ] Funções com SECURITY DEFINER ✅
- [ ] Funções com search_path ❌
- [ ] Tenant isolation completo ❌
- [ ] Rotas protegidas ⚠️ PARCIAL

---

## 💡 RECOMENDAÇÕES ADICIONAIS

1. **Criar middleware de autorização**
   - Verificar perfil antes de queries
   - Bloquear acesso a URLs não permitidas

2. **Implementar logs de auditoria**
   - Registrar acessos a dados sensíveis
   - Alertar em acessos suspeitos

3. **Adicionar testes de segurança**
   - Testar vazamento entre arenas
   - Testar escalação de privilégios
   - Testar acesso direto via URL

4. **Documentar matriz de permissões**
   - Criar tabela clara de quem acessa o quê
   - Manter atualizada com mudanças

5. **Rate limiting**
   - Implementar em edge functions
   - Prevenir abuso de APIs

---

## 📝 RESUMO EXECUTIVO

**Status Geral:** 🔴 **CRÍTICO - REQUER AÇÃO IMEDIATA**

**Principais Riscos:**
1. ❌ Vazamento de dados entre arenas nos relatórios
2. ❌ Alunos podem acessar dados da arena
3. ⚠️ Rotas sem proteção adequada

**Pontos Fortes:**
1. ✅ RLS implementado corretamente
2. ✅ Maioria das queries com tenant isolation
3. ✅ Dashboards diferenciados por perfil

**Ação Imediata Necessária:**
- Corrigir filtros de relatórios
- Proteger rotas por perfil
- Implementar verificações adicionais
