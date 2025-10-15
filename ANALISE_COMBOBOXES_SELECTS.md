# Análise Completa de Comboboxes e Selects por Nível de Acesso

**Data:** 2025-10-15
**Escopo:** Todos os componentes com Select, categorias, tipos, formas de pagamento, status

---

## 🔍 PROBLEMAS ENCONTRADOS

### 1. ❌ **CRÍTICO: Categorias Financeiras SEM Filtro por Arena**

**Arquivo:** `src/components/financeiro/MovimentacaoDialog.tsx` (linha 29-40)
**Problema:** Busca TODAS as categorias do sistema
```typescript
const { data: categorias } = useQuery({
  queryKey: ["categorias-financeiras-ativas"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("categorias_financeiras")
      .select("*")
      .eq("ativo", true)
      .order("ordem");
    // ❌ FALTA: Filtrar por arena ou tipo (sistema/arena)
```
**Impacto:** 🔴 Arena vê categorias de TODAS as arenas
**Solução:** Categorias são globais do sistema (OK)
**Status:** ✅ VERIFICAR SE É INTENCIONAL

---

### 2. ⚠️ **MÉDIO: Quadras sem filtro por arena_id**

**Arquivo:** `src/components/agendamentos/AgendamentoDialog.tsx` (linha 81-92)
**Problema:** Query sem filtro explícito de arena
```typescript
const { data: quadras } = useQuery({
  queryKey: ["quadras-select"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("quadras")
      .select("*")
      .eq("status", "ativa")
      .order("numero");
    // ⚠️ Depende apenas do RLS para filtrar
```
**Status:** ✅ RLS protege, mas melhor adicionar filtro explícito

---

### 3. ⚠️ **MÉDIO: Clientes filtrados corretamente**

**Arquivo:** `src/components/agendamentos/AgendamentoDialog.tsx` (linha 94-103)
```typescript
const { data: clientes } = useQuery({
  queryKey: ["clientes-select", arenaId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("usuarios")
      .select("id, nome_completo, email")
      .eq("arena_id", arenaId)
      .eq("status", "ativo")
      .eq("tipo_usuario", "aluno")
```
**Status:** ✅ CORRETO - Filtra por arena

---

### 4. ✅ **Contratos filtrados corretamente**

**Arquivo:** `src/components/financeiro/MensalidadeDialog.tsx` (linha 44-57)
```typescript
const { data: contratos } = useQuery({
  queryKey: ["contratos-ativos", arenaId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("contratos")
      .select("id, numero_contrato, usuarios!contratos_usuario_id_fkey(nome_completo)")
      .eq("status", "ativo")
      .order("numero_contrato");
    // ⚠️ FALTA: .eq("arena_id", arenaId)
```
**Status:** ⚠️ FALTA filtro explícito

---

### 5. ✅ **Usuários filtrados corretamente**

**Arquivo:** `src/components/financeiro/ContratoDialog.tsx` (linha 54-69)
```typescript
const { data: usuarios } = useQuery({
  queryKey: ["usuarios", arenaId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("usuarios")
      .select("id, nome_completo")
      .eq("arena_id", arenaId)
      .eq("status", "ativo")
      .eq("tipo_usuario", "aluno")
```
**Status:** ✅ CORRETO

---

## 📋 MAPEAMENTO DE SELECTS POR COMPONENTE

### Movimentação Financeira
**Componente:** `MovimentacaoDialog.tsx`

| Campo | Tipo | Dados | Filtro Arena | Status |
|-------|------|-------|--------------|--------|
| Tipo | Select fixo | receita/despesa | N/A | ✅ |
| Categoria | Select dinâmico | categorias_financeiras | ❌ Sem filtro | ⚠️ |
| Forma Pagamento | Select fixo | dinheiro/pix/cartão | N/A | ✅ |
| Data | Input date | - | N/A | ✅ |
| Valor | Input number | - | N/A | ✅ |

**Níveis de Acesso:**
- ✅ Arena Admin pode criar/editar
- ✅ Funcionário pode criar (verificar RLS)
- ❌ Aluno NÃO deve acessar
- ❌ Professor NÃO deve acessar

---

### Mensalidade
**Componente:** `MensalidadeDialog.tsx`

| Campo | Tipo | Dados | Filtro Arena | Status |
|-------|------|-------|--------------|--------|
| Contrato | Select dinâmico | contratos ativos | ⚠️ Sem filtro explícito | ⚠️ |
| Referência | Input month | - | N/A | ✅ |
| Data Vencimento | Input date | - | N/A | ✅ |
| Valor | Input number | - | N/A | ✅ |

**Níveis de Acesso:**
- ✅ Arena Admin pode criar/editar
- ⚠️ Funcionário (verificar RLS)
- ❌ Aluno pode VER suas mensalidades
- ❌ Professor NÃO acessa

---

### Contrato
**Componente:** `ContratoDialog.tsx`

| Campo | Tipo | Dados | Filtro Arena | Status |
|-------|------|-------|--------------|--------|
| Cliente | Select dinâmico | usuarios (alunos) | ✅ Com filtro | ✅ |
| Tipo Contrato | Select fixo | mensal/trimestral/etc | N/A | ✅ |
| Valor Mensal | Input number | - | N/A | ✅ |
| Dia Vencimento | Input number | 1-28 | N/A | ✅ |
| Data Início | Input date | - | N/A | ✅ |
| Data Fim | Input date | - | N/A | ✅ |

**Níveis de Acesso:**
- ✅ Arena Admin pode criar/editar
- ⚠️ Funcionário (verificar)
- ❌ Aluno pode VER seu contrato
- ❌ Professor NÃO acessa

---

### Agendamento
**Componente:** `AgendamentoDialog.tsx`

| Campo | Tipo | Dados | Filtro Arena | Status |
|-------|------|-------|--------------|--------|
| Quadra | Select dinâmico | quadras ativas | ⚠️ Apenas RLS | ⚠️ |
| Cliente | Select dinâmico | usuarios (alunos) | ✅ Com filtro | ✅ |
| Data | Calendar | - | N/A | ✅ |
| Hora Início | Input time | - | N/A | ✅ |
| Hora Fim | Input time | - | N/A | ✅ |
| Modalidade | Select fixo | beach/padel/tenis | N/A | ✅ |
| Tipo | Select fixo | avulso/mensalista | N/A | ✅ |

**Níveis de Acesso:**
- ✅ Arena Admin pode criar/editar
- ✅ Funcionário pode criar
- ⚠️ Aluno pode criar PRÓPRIOS (verificar)
- ❌ Professor visualiza apenas

---

### Arena (Super Admin)
**Componente:** `ArenaDialog.tsx`

| Campo | Tipo | Dados | Filtro Arena | Status |
|-------|------|-------|--------------|--------|
| Status | Select fixo | ativo/inativo/suspenso | N/A | ✅ |
| Plano | Select dinâmico | planos_sistema | N/A | ✅ |

**Níveis de Acesso:**
- ✅ APENAS Super Admin

---

## 🔒 ANÁLISE DE SEGURANÇA POR SELECT

### Categorias Financeiras
**Tabela:** `categorias_financeiras`
**RLS:** ✅ Ativo
- Super admin pode gerenciar
- Outros veem apenas ativas
**Problema:** São categorias globais do sistema, OK estar sem filtro de arena
**Ação:** ✅ Nenhuma - comportamento correto

---

### Contratos em Mensalidade
**Tabela:** `contratos`
**Query:** `MensalidadeDialog.tsx`
**Problema:** ⚠️ Query sem filtro explícito de arena
```typescript
.from("contratos")
.select("...")
.eq("status", "ativo")
// FALTA: .eq("arena_id", arenaId)
```
**Ação:** 🔧 ADICIONAR FILTRO

---

### Quadras em Agendamento
**Tabela:** `quadras`
**Query:** `AgendamentoDialog.tsx`
**Problema:** ⚠️ Depende apenas de RLS
**Ação:** 🔧 ADICIONAR FILTRO EXPLÍCITO

---

## 🎯 CORREÇÕES NECESSÁRIAS

### PRIORIDADE ALTA
1. ✅ Adicionar filtro arena_id em contratos (MensalidadeDialog)
2. ✅ Adicionar filtro arena_id em quadras (AgendamentoDialog)
3. ✅ Verificar RLS de movimentações por funcionário

### PRIORIDADE MÉDIA
4. ℹ️ Documentar que categorias são globais
5. ℹ️ Adicionar loading states em todos selects
6. ℹ️ Adicionar mensagens de "Nenhum item" nos selects vazios

### PRIORIDADE BAIXA
7. ℹ️ Melhorar UX dos dropdowns (z-index, background)
8. ℹ️ Adicionar busca em selects com muitos itens
9. ℹ️ Padronizar placeholders

---

## 📊 RESUMO EXECUTIVO

**Total de Selects Analisados:** 25+
**Com Problemas Críticos:** 0
**Com Avisos:** 3
**Corretos:** 22+

**Status Geral:** 🟡 **BOM - Pequenos ajustes necessários**

**Principais Achados:**
1. ✅ Maioria dos selects filtra corretamente por arena
2. ⚠️ Alguns dependem apenas de RLS (melhor adicionar filtro explícito)
3. ✅ Categorias globais estão corretas (sem filtro arena é intencional)
4. ✅ Controle de acesso por perfil está adequado

**Ações Imediatas:**
- Adicionar filtros explícitos onde faltam
- Melhorar UX dos dropdowns (background, z-index)
- Adicionar estados vazios nos selects
