# Automações do Sistema Verana

## 📋 Índice
1. [Sincronização de Módulos](#sincronização-de-módulos)
2. [Verificação de Acesso da Arena](#verificação-de-acesso-da-arena)
3. [Controle de Permissões por Módulo](#controle-de-permissões-por-módulo)
4. [Hooks Customizados](#hooks-customizados)

---

## 🔄 Sincronização de Módulos

### Função: `sync_arena_modulos_on_plan_change()`
**Trigger:** `AFTER INSERT OR UPDATE OF plano_sistema_id ON arenas`

#### O que faz:
- ✅ Quando uma arena é criada com um plano
- ✅ Quando o plano de uma arena é alterado

#### Comportamento:
1. **Desativa módulos** que NÃO estão no novo plano
2. **Ativa módulos** que estão no novo plano
3. **Adiciona módulos** que ainda não existem em `arena_modulos`
4. **Atualiza data_ativacao** para módulos reativados

#### Exemplo:
```sql
-- Mudar plano de Básico para Premium
UPDATE arenas 
SET plano_sistema_id = (SELECT id FROM planos_sistema WHERE nome = 'Premium')
WHERE id = 'arena-id';

-- Resultado automático:
-- ✅ Todos os módulos do Premium são adicionados/ativados
-- ❌ Módulos fora do Premium são desativados
```

---

## 🔐 Verificação de Acesso da Arena

### Função: `check_arena_status(_arena_id uuid)`

#### Retorna:
- `status`: Status atual da arena (ativo, suspenso, inativo)
- `data_vencimento`: Data de vencimento da assinatura
- `dias_ate_vencimento`: Dias restantes até vencer
- `pode_acessar`: Boolean se arena pode ser acessada
- `mensagem`: Mensagem explicativa do status

#### Regras de Bloqueio:
```typescript
// Arena NÃO pode acessar se:
- status = 'suspenso'
- status = 'inativo'  
- data_vencimento < CURRENT_DATE (vencido)

// Avisos:
- dias_ate_vencimento <= 7: Aviso de vencimento próximo
- dias_ate_vencimento <= 3: Aviso crítico
```

---

## 🎯 Controle de Permissões por Módulo

### Hook: `useModuloAccess({ moduloSlug, requiredRoles })`

#### Verifica:
1. ✅ **Role do usuário** está nas roles permitidas?
2. ✅ **Módulo está ativo** para a arena?
3. ✅ **Módulo existe** e está com status "ativo"?

#### Super Admin:
- ⚡ Sempre tem acesso, ignora verificações de módulo

#### Exemplo de uso:
```tsx
function QuadrasPage() {
  const { hasAccess, isLoading } = useModuloAccess({
    moduloSlug: "quadras",
    requiredRoles: ["arena_admin", "funcionario"]
  });

  if (!hasAccess) return <AcessoNegado />;
  
  return <QuadrasTable />;
}
```

---

## 🎨 Componentes de Proteção

### `<ArenaAccessGuard>`
**Usado em:** `Layout.tsx` (envolve todo o conteúdo)

#### Comportamento:
1. **Arena bloqueada**: Exibe tela de bloqueio com mensagem
2. **Vencimento próximo (≤7 dias)**: Exibe alerta amarelo no topo
3. **Arena ativa**: Renderiza conteúdo normalmente

#### Telas de bloqueio:
- 🔒 Arena suspensa → "Entre em contato com o suporte"
- 🔒 Arena inativa → "Entre em contato com o suporte"
- 🔒 Assinatura vencida → "Regularize o pagamento"

---

## 🛠️ Hooks Customizados

### `useArenaAccess()`
Verifica status e acesso da arena atual.

```tsx
const { 
  podeAcessar,      // boolean
  mensagem,         // string com status
  diasAteVencimento,// number | undefined
  isLoading         // boolean
} = useArenaAccess();
```

**Refetch automático:** A cada 60 segundos

---

### `useModuloAccess({ moduloSlug, requiredRoles })`
Verifica se usuário pode acessar módulo específico.

```tsx
const {
  hasAccess,        // boolean (role + módulo ativo)
  isLoading,        // boolean
  hasRequiredRole,  // boolean (apenas role)
  moduloAtivo       // boolean (apenas módulo)
} = useModuloAccess({
  moduloSlug: "financeiro",
  requiredRoles: ["arena_admin"]
});
```

---

## 📊 Fluxo Completo

### 1. Login do Usuário
```
Usuário faz login
    ↓
AuthContext carrega roles
    ↓
useArenaAccess verifica status da arena
    ↓
ArenaAccessGuard bloqueia/permite acesso
    ↓
AppSidebar carrega módulos ativos
    ↓
Menu exibe apenas módulos permitidos
```

### 2. Mudança de Plano
```
Admin muda plano da arena
    ↓
Trigger sync_arena_modulos_on_plan_change() dispara
    ↓
Módulos antigos são desativados
    ↓
Módulos novos são adicionados/ativados
    ↓
Query de módulos é invalidada
    ↓
Menu atualiza automaticamente
```

### 3. Vencimento da Arena
```
Data atual > data_vencimento
    ↓
check_arena_status() retorna pode_acessar = false
    ↓
useArenaAccess atualiza estado
    ↓
ArenaAccessGuard bloqueia acesso
    ↓
Usuário vê tela de bloqueio
```

---

## ⚙️ Configurações no Banco

### Constraints
```sql
-- Garante unicidade de módulos por arena
ALTER TABLE arena_modulos 
ADD CONSTRAINT arena_modulos_arena_id_modulo_id_key 
UNIQUE (arena_id, modulo_id);
```

### Triggers Ativos
- ✅ `sync_modulos_on_plan_change` - Sincroniza módulos
- ✅ `update_arena_modulos_updated_at` - Atualiza timestamps
- ✅ `populate_arena_modulos` - Popula módulos iniciais
- ✅ `gerar_numero_contrato` - Gera números de contratos
- ✅ `gerar_numero_fatura` - Gera números de faturas
- ✅ `gerar_numero_assinatura` - Gera números de assinaturas
- ✅ `notificar_novo_agendamento` - Notifica novos agendamentos
- ✅ `notificar_checkin` - Notifica check-ins

---

## 🧪 Como Testar

### Teste 1: Mudança de Plano
```sql
-- 1. Ver módulos atuais
SELECT * FROM arena_modulos WHERE arena_id = 'sua-arena-id';

-- 2. Mudar plano
UPDATE arenas 
SET plano_sistema_id = (SELECT id FROM planos_sistema WHERE nome = 'Premium')
WHERE id = 'sua-arena-id';

-- 3. Verificar módulos atualizados
SELECT * FROM arena_modulos WHERE arena_id = 'sua-arena-id';
```

### Teste 2: Verificar Acesso
```sql
-- Ver status da arena
SELECT * FROM check_arena_status('sua-arena-id');

-- Simular vencimento
UPDATE arenas 
SET data_vencimento = CURRENT_DATE - INTERVAL '1 day'
WHERE id = 'sua-arena-id';
```

### Teste 3: Módulos no Menu
1. Login como Arena Admin
2. Ir em Configurações > Módulos
3. Desativar um módulo
4. Verificar que item sumiu do menu lateral
5. Reativar módulo
6. Verificar que item voltou ao menu

---

## 🚀 Próximas Melhorias

### Permissões Customizadas por Usuário
- [ ] Tabela `user_modulo_permissions`
- [ ] Arena Admin escolhe módulos por usuário
- [ ] Override de permissões de role

### Notificações Automáticas
- [ ] Email 7 dias antes do vencimento
- [ ] WhatsApp 3 dias antes do vencimento
- [ ] Notificação in-app ao fazer login com conta vencida

### Logs de Auditoria
- [ ] Registrar mudanças de plano
- [ ] Registrar ativação/desativação de módulos
- [ ] Registrar tentativas de acesso bloqueado

---

**Última atualização:** 15/10/2025
**Versão:** 1.0.0
