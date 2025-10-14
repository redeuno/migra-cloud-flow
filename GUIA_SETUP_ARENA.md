# Guia de Setup de Arena - Problema Identificado e Solução

## 🔴 PROBLEMA ATUAL

**Arena:** Arena Verana Demo  
**Email Admin:** admin.arena@verana.com  
**Problema:** Todos os módulos aparecem como "Upgrade Necessário"  
**Causa:** Arena não tem plano associado (`plano_sistema_id: NULL`)

## ✅ SOLUÇÃO RÁPIDA (Via Interface)

### Passo 1: Login como Super Admin
1. Faça logout se estiver como admin da arena
2. Faça login com uma conta super_admin

### Passo 2: Acessar Setup de Arenas
1. No menu lateral, clique em **"Setup Arenas"**
2. Você verá duas seções:
   - ❌ Arenas sem Plano (vermelho)
   - ✅ Arenas com Plano (verde)

### Passo 3: Associar Plano
1. **Selecione a Arena**: "Arena Verana Demo" no dropdown
2. **Selecione um Plano**: Escolha entre:
   - Plano Básico (agendamentos, quadras)
   - Plano Profissional (+ financeiro, aulas)
   - Plano Enterprise (+ torneios)
   - Premium (todos os módulos)
3. Clique em **"Associar Plano e Configurar Módulos"**

### Resultado
- ✅ Plano será associado à arena
- ✅ Módulos serão criados automaticamente em `arena_modulos`
- ✅ Admin da arena poderá acessar as funcionalidades

## 🛠️ SOLUÇÃO MANUAL (Via SQL - Apenas se necessário)

```sql
-- 1. Verificar arena
SELECT id, nome, plano_sistema_id 
FROM arenas 
WHERE nome = 'Arena Verana Demo';

-- 2. Verificar planos disponíveis
SELECT id, nome, modulos_inclusos, valor_mensal
FROM planos_sistema
WHERE status = 'ativo'
ORDER BY valor_mensal;

-- 3. Associar plano (use o ID do plano escolhido)
UPDATE arenas
SET plano_sistema_id = '51bd4197-fa78-4f82-98a5-02eacaaf62bd' -- Premium
WHERE id = '53b6b586-7482-466f-8bf6-290f814d43d9';

-- 4. Criar módulos (executar para cada slug do plano)
-- Exemplo para Premium: [gestao_arenas, gestao_quadras, etc]
INSERT INTO arena_modulos (arena_id, modulo_id, ativo)
SELECT 
  '53b6b586-7482-466f-8bf6-290f814d43d9' as arena_id,
  ms.id as modulo_id,
  true as ativo
FROM modulos_sistema ms
WHERE ms.slug IN (
  'gestao_arenas',
  'gestao_quadras', 
  'gestao_pessoas',
  'agendamentos',
  'gestao_aulas',
  'gestao_financeira',
  'torneios',
  'relatorios',
  'automacoes',
  'whatsapp'
)
AND ms.status = 'ativo';
```

## 📋 FLUXO COMPLETO DO SISTEMA

### 1. Criação de Arena
```
Nova Arena → Trigger populate_arena_modulos → 
  Verifica plano_sistema_id →
  Se existe: Cria módulos automaticamente
  Se NULL: Arena sem módulos (problema atual!)
```

### 2. Acesso aos Módulos
```
Login Arena Admin → 
  Busca arena_modulos WHERE arena_id = X AND ativo = true →
  Filtra menu lateral baseado em módulos ativos →
  Página Configurações mostra status dos módulos
```

### 3. Controle de Acesso
- **Sidebar** (`AppSidebar.tsx`): Filtra menu baseado em `arena_modulos`
- **Configurações** (`ModulosArenaManager.tsx`): Mostra status e permite toggle
- **Plano**: Define quais módulos podem ser ativados

## 🔍 VERIFICAÇÕES IMPORTANTES

### Verificar se arena tem plano:
```sql
SELECT a.nome, a.plano_sistema_id, ps.nome as plano_nome
FROM arenas a
LEFT JOIN planos_sistema ps ON a.plano_sistema_id = ps.id
WHERE a.nome = 'Arena Verana Demo';
```

### Verificar módulos da arena:
```sql
SELECT 
  ms.nome,
  ms.slug,
  am.ativo
FROM arena_modulos am
JOIN modulos_sistema ms ON am.modulo_id = ms.id
WHERE am.arena_id = '53b6b586-7482-466f-8bf6-290f814d43d9'
ORDER BY ms.ordem;
```

### Verificar permissões do usuário:
```sql
SELECT 
  u.email,
  ur.role,
  a.nome as arena_nome
FROM usuarios u
JOIN user_roles ur ON u.auth_id = ur.user_id
JOIN arenas a ON ur.arena_id = a.id
WHERE u.email = 'admin.arena@verana.com';
```

## 🎯 PREVENÇÃO FUTURA

### Ao criar nova arena:
1. **SEMPRE** associe um plano durante a criação
2. Use a página "Setup Arenas" para verificar status
3. O trigger `populate_arena_modulos` criará módulos automaticamente

### RLS Policies OK:
✅ `arena_modulos`: Super admin e arena_admin podem gerenciar  
✅ `arenas`: Isolamento por tenant funcionando  
✅ `user_roles`: Controle de acesso correto

## 📱 NAVEGAÇÃO

### Menu Super Admin:
- Dashboard (global)
- Arenas (lista todas)
- **Setup Arenas** ⭐ (NOVA - gerenciar planos e módulos)
- Financeiro (sistema)
- Config. Sistema

### Menu Arena Admin:
- Dashboard (da arena)
- Quadras, Agendamentos, Clientes, etc. (baseado em módulos ativos)
- Configurações (gerenciar módulos)

## ⚠️ AVISOS IMPORTANTES

1. **NÃO** deletar `arena_modulos` manualmente sem recriar
2. **SEMPRE** usar a interface de Setup ou SQL completo
3. Trigger `populate_arena_modulos` só funciona se `plano_sistema_id` não for NULL
4. Módulos inativos (`ativo = false`) não aparecem no menu

## 🔄 PRÓXIMOS PASSOS

Para resolver o problema atual da Arena Verana Demo:
1. Login como Super Admin
2. Acesse `/arena-setup`
3. Selecione "Arena Verana Demo"
4. Escolha "Premium" (ou outro plano)
5. Clique em "Associar Plano e Configurar Módulos"
6. Faça logout e login novamente como admin.arena@verana.com
7. ✅ Todos os módulos estarão disponíveis!
