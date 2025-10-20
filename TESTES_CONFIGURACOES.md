# Testes de Configurações - Sistema de Roles

## 📋 Visão Geral

Este documento descreve os testes necessários para validar o sistema de configurações após as correções de duplicação (Fases 1-5).

---

## 🧪 FASE 5: TESTES E VALIDAÇÕES

### 5.1. Testar Fluxo Arena Admin

#### Teste 1: Acesso à Rota `/configuracoes`
**Objetivo**: Validar que Arena Admin acessa apenas configurações da própria arena

**Passos**:
1. Login como Arena Admin
2. Acessar `/configuracoes`
3. ✅ Verificar que página carrega sem erros
4. ✅ Verificar que NÃO aparece `ArenaSelector`
5. ✅ Verificar que vê 7 tabs: Geral, Assinatura, Módulos, Evolution, Pagamentos, Templates, Horários
6. ✅ Verificar que todos os dados exibidos são da arena do usuário

**Resultado Esperado**: Arena Admin vê apenas configurações da sua própria arena, sem opção de trocar de arena.

---

#### Teste 2: Toggle de Módulos (Sem Duplicatas)
**Objetivo**: Validar que ativação/desativação de módulos não cria duplicatas

**Passos**:
1. Na tab "Módulos", selecionar um módulo incluso no plano
2. Ativar o módulo clicando no switch
3. ✅ Verificar que toast "Módulo atualizado!" aparece
4. Desativar o módulo clicando novamente no switch
5. ✅ Verificar que toast "Módulo atualizado!" aparece
6. Clicar rapidamente várias vezes no switch (teste de cliques rápidos)
7. ✅ Verificar que não há erros de duplicata (código 23505)
8. ✅ Verificar que o switch fica desabilitado durante o processamento

**Resultado Esperado**: Módulo alterna entre ativo/inativo sem criar registros duplicados na tabela `arena_modulos`.

**Validação no Banco**:
```sql
-- Deve retornar apenas 1 registro por módulo
SELECT modulo_id, COUNT(*) as total
FROM arena_modulos
WHERE arena_id = '<arena_id>'
GROUP BY modulo_id
HAVING COUNT(*) > 1;
-- Resultado esperado: 0 linhas
```

---

#### Teste 3: Tentativa de Acesso a Outras Arenas (Segurança)
**Objetivo**: Validar que Arena Admin NÃO pode acessar configurações de outras arenas

**Passos**:
1. Login como Arena Admin
2. Tentar acessar `/configuracoes-arena` (rota do super admin)
3. ✅ Verificar que é bloqueado por `ProtectedRoute` (redirect ou acesso negado)
4. Tentar manipular URL: `/configuracoes-arena/<outra_arena_id>`
5. ✅ Verificar que é bloqueado por `ProtectedRoute`

**Resultado Esperado**: Arena Admin não consegue acessar configurações de outras arenas.

---

### 5.2. Testar Fluxo Super Admin

#### Teste 4: Acesso à Rota `/configuracoes-sistema`
**Objetivo**: Validar que Super Admin acessa configurações globais do sistema

**Passos**:
1. Login como Super Admin
2. Acessar `/configuracoes-sistema`
3. ✅ Verificar que página carrega sem erros
4. ✅ Verificar que vê 4 tabs: Planos do Sistema, Módulos do Sistema, Categorias, Templates
5. ✅ Verificar que pode gerenciar planos, módulos globais e categorias

**Resultado Esperado**: Super Admin tem acesso completo às configurações globais do SaaS.

---

#### Teste 5: Acesso à Rota `/configuracoes-arena`
**Objetivo**: Validar que Super Admin pode gerenciar qualquer arena específica

**Passos**:
1. Login como Super Admin
2. Acessar `/configuracoes-arena`
3. ✅ Verificar que aparece `ArenaSelector` no topo
4. ✅ Verificar que pode selecionar qualquer arena ativa
5. Selecionar uma arena no selector
6. ✅ Verificar que vê 7 tabs: Geral, Assinatura, Módulos, Evolution, Pagamentos, Templates, Horários
7. ✅ Verificar que todos os dados exibidos correspondem à arena selecionada
8. Trocar para outra arena no selector
9. ✅ Verificar que os dados são atualizados corretamente

**Resultado Esperado**: Super Admin consegue gerenciar configurações de qualquer arena através do selector.

---

#### Teste 6: Acesso Via URL Direta `/configuracoes-arena/:id`
**Objetivo**: Validar que Super Admin pode acessar arena específica via URL

**Passos**:
1. Login como Super Admin
2. Acessar diretamente `/configuracoes-arena/<arena_id>`
3. ✅ Verificar que página carrega sem erros
4. ✅ Verificar que `ArenaSelector` está presente e já tem a arena selecionada
5. ✅ Verificar que vê todas as configurações da arena do `:id`

**Resultado Esperado**: Super Admin acessa configurações de arena específica via URL direta.

---

#### Teste 7: Toggle de Módulos por Super Admin
**Objetivo**: Validar que Super Admin pode ativar/desativar módulos de qualquer arena

**Passos**:
1. Acessar `/configuracoes-arena`
2. Selecionar uma arena no selector
3. Ir para tab "Módulos"
4. Ativar/desativar um módulo
5. ✅ Verificar que mudança é aplicada corretamente
6. Trocar para outra arena no selector
7. ✅ Verificar que módulos da nova arena são exibidos corretamente

**Resultado Esperado**: Super Admin gerencia módulos de qualquer arena sem problemas.

---

### 5.3. Testar Segurança (Tentativas de Bypass)

#### Teste 8: Arena Admin Tenta Acessar Configurações de Outra Arena
**Objetivo**: Validar que Arena Admin não pode burlar isolamento de tenant

**Passos**:
1. Login como Arena Admin da Arena A
2. Capturar `arena_id` da Arena B (via DevTools ou inspeção do banco)
3. Tentar acessar `/configuracoes-arena/<arena_b_id>`
4. ✅ Verificar que é bloqueado (redirect ou acesso negado)

**Resultado Esperado**: Tentativa de acesso é bloqueada no nível de rota.

---

#### Teste 9: Arena Admin Tenta Manipular `arenaId` via Props (Não Aplicável - Frontend)
**Objetivo**: Validar que `ArenaConfigTabs` ignora `arenaId` quando não é super admin

**Passos**:
1. Login como Arena Admin
2. No código, tentar forçar `<ArenaConfigTabs arenaId="<outra_arena_id>" />`
3. ✅ Verificar que componente exibe alert de "Você não tem permissão"

**Resultado Esperado**: Validação de segurança no componente impede acesso indevido.

---

#### Teste 10: Super Admin Sem Arena Selecionada
**Objetivo**: Validar que Super Admin vê mensagem clara quando não seleciona arena

**Passos**:
1. Login como Super Admin
2. Acessar `/configuracoes-arena` (sem `:id`)
3. NÃO selecionar nenhuma arena no selector
4. ✅ Verificar que aparece alert: "Selecione uma arena acima para visualizar e editar suas configurações."
5. ✅ Verificar que tabs NÃO são exibidas até selecionar arena

**Resultado Esperado**: Super Admin recebe orientação clara de que precisa selecionar uma arena.

---

## 📊 Checklist de Validação

### FASE 1: Separação de Responsabilidades
- [ ] Rota `/configuracoes` acessível apenas para `arena_admin`
- [ ] Rota `/configuracoes-arena` acessível apenas para `super_admin`
- [ ] Rota `/configuracoes-sistema` acessível apenas para `super_admin`
- [ ] `ArenaSelector` visível apenas para Super Admin
- [ ] Arena Admin vê apenas configurações da própria arena

### FASE 2: Validação de Módulos
- [ ] Toggle de módulo usa `UPDATE` se já existe
- [ ] Toggle de módulo usa `INSERT` se não existe
- [ ] Erro de duplicata (23505) tratado corretamente
- [ ] Loading state (`togglingModulo`) previne cliques rápidos
- [ ] Switch desabilitado durante processamento

### FASE 3: Permissões e Acessos
- [ ] Arena Admin NÃO vê `ArenaSelector`
- [ ] Arena Admin NÃO pode acessar `/configuracoes-arena`
- [ ] Super Admin pode trocar entre arenas livremente
- [ ] Validação de segurança em `ArenaConfigTabs` funciona

### FASE 4: Documentação
- [ ] Comentários claros em `App.tsx` explicando as 3 rotas
- [ ] `ROLES.md` atualizado com hierarquia de configurações
- [ ] Documentação de fluxos de Super Admin e Arena Admin

### FASE 5: Testes
- [ ] Todos os 10 testes documentados neste arquivo
- [ ] Validação no banco de dados (sem duplicatas)
- [ ] Testes de segurança (bypass) executados

---

## 🔍 Validações Diretas no Banco de Dados

### Verificar Duplicatas em `arena_modulos`
```sql
-- Deve retornar 0 linhas se não houver duplicatas
SELECT arena_id, modulo_id, COUNT(*) as total
FROM arena_modulos
GROUP BY arena_id, modulo_id
HAVING COUNT(*) > 1;
```

### Verificar Roles dos Usuários
```sql
-- Ver roles de todos os usuários
SELECT 
  u.email,
  ur.role,
  a.nome as arena
FROM user_roles ur
JOIN auth.users u ON u.id = ur.user_id
LEFT JOIN arenas a ON a.id = ur.arena_id
ORDER BY ur.role, u.email;
```

### Verificar Arenas e Planos
```sql
-- Ver arenas com seus planos
SELECT 
  a.nome as arena,
  ps.nome as plano,
  a.status
FROM arenas a
LEFT JOIN planos_sistema ps ON ps.id = a.plano_sistema_id
ORDER BY a.nome;
```

---

## 🚨 Casos de Falha Conhecidos

### Problema 1: Duplicatas em `arena_modulos`
**Sintoma**: Erro 23505 ao ativar módulo
**Causa**: Cliques rápidos ou falta de validação `maybeSingle()`
**Solução**: Implementada em FASE 2 (usar `maybeSingle()` + loading state)

### Problema 2: Arena Admin vê outras arenas
**Sintoma**: Arena Admin consegue ver configurações de outras arenas
**Causa**: `PerfilAccessGuard` permitindo `super_admin` em rota errada
**Solução**: Implementada em FASE 1 (remover `super_admin` de `allowedRoles`)

### Problema 3: Super Admin sem arena_id causa erro
**Sintoma**: Erro ao tentar usar `contextArenaId` que é `null`
**Causa**: Super Admin não tem `arena_id` associado
**Solução**: Implementada em FASE 1 (usar `effectiveArenaId` condicional)

---

## ✅ Critérios de Sucesso

O sistema está 100% funcional e seguro quando:

1. ✅ Arena Admin acessa apenas `/configuracoes` (própria arena)
2. ✅ Super Admin acessa `/configuracoes-sistema` (global) e `/configuracoes-arena` (qualquer arena)
3. ✅ Módulos não criam duplicatas em `arena_modulos`
4. ✅ Arena Admin não consegue acessar outras arenas (mesmo manipulando URL)
5. ✅ Super Admin vê `ArenaSelector` e pode trocar entre arenas
6. ✅ Todas as queries no banco retornam 0 duplicatas
7. ✅ Testes de segurança (bypass) são bloqueados corretamente

---

## 📝 Notas de Implementação

- **Data da Implementação**: 2025-10-20
- **Fases Implementadas**: 1, 2, 3, 4, 5
- **Arquivos Modificados**:
  - `src/pages/Configuracoes.tsx`
  - `src/components/configuracoes/ArenaConfigTabs.tsx`
  - `src/components/configuracoes/ModulosArenaManager.tsx`
  - `src/App.tsx`
  - `ROLES.md`
- **Documentos Criados**:
  - `TESTES_CONFIGURACOES.md` (este arquivo)
