# Sistema de Roles - Verana

## 📋 Visão Geral

Este documento descreve o sistema de permissões (roles) do Verana, um sistema multi-tenant para gestão de arenas de Beach Tennis.

## 📖 Convenções de Nomenclatura

### Cliente vs Aluno

O sistema usa nomenclaturas diferentes dependendo do contexto para melhor experiência do usuário:

- **"Cliente"**: Usado em contextos de agendamentos e serviços avulsos
  - Exemplos: Agendamento de quadra, contratos, mensalidades
  - Representa qualquer pessoa que contrata serviços da arena
  - Labels: "Cliente", "Selecione um cliente"

- **"Aluno"**: Usado em contextos educacionais (aulas)
  - Exemplos: Aulas, presenças, turmas, avaliações
  - Representa pessoas matriculadas em aulas regulares
  - Labels: "Aluno", "Alunos inscritos", "Lista de alunos"

**Importante**: Tecnicamente ambos são registrados como `tipo_usuario: "aluno"` na tabela `usuarios`, mas a interface usa labels diferentes conforme o contexto para melhor clareza e UX.

## 🎭 Roles Oficiais

O sistema utiliza o enum `app_role` do PostgreSQL como fonte única da verdade:

```sql
CREATE TYPE app_role AS ENUM (
  'super_admin',
  'arena_admin', 
  'funcionario',
  'professor',
  'aluno'
);
```

### 1. Super Admin (`super_admin`)

**Descrição**: Administrador do sistema completo (SaaS owner)

**Permissões**:
- ✅ Acesso total a todas as arenas
- ✅ Gerenciar arenas (criar, editar, excluir)
- ✅ Gerenciar planos e módulos do sistema
- ✅ Visualizar faturas do sistema
- ✅ Acesso a todas as funcionalidades administrativas
- ✅ Configurar Evolution API e Asaas de qualquer arena
- ✅ Dashboard com filtros por arena específica ou visão consolidada

**Configurações Hierárquicas**:
- `/configuracoes-sistema` - Gerencia PLANOS, MÓDULOS, CATEGORIAS (nível global)
- `/configuracoes-arena` - Acessa configurações de QUALQUER arena específica:
  - Evolution API
  - Pagamentos (Asaas)
  - Templates WhatsApp
  - Horários
  - Módulos ativos
  - Dados gerais da arena

**Dashboard com Filtros**:
- Filtro por arena específica ou visão consolidada
- Métricas dinâmicas por arena
- Drill-down granular

**Páginas Acessíveis**:
- `/` - Dashboard consolidado
- `/arenas` - Gestão de arenas (exclusivo)
- `/configuracoes-sistema` - Configurações do sistema (exclusivo)
- `/configuracoes-arena` - Configurações de qualquer arena (exclusivo)
- Todas as demais páginas

---

### 2. Arena Admin (`arena_admin`)

**Descrição**: Administrador de uma arena específica

**Permissões**:
- ✅ Gestão completa da sua arena
- ✅ Gerenciar quadras
- ✅ Gerenciar clientes
- ✅ Gerenciar agendamentos
- ✅ Acesso ao financeiro da arena
- ✅ Gerenciar contratos e mensalidades
- ✅ Configurar integrações (Evolution API, Asaas)
- ✅ Gerenciar professores e aulas
- ✅ Gerenciar torneios
- ❌ Não pode acessar outras arenas
- ❌ Não pode gerenciar o sistema global

**Páginas Acessíveis**:
- `/` - Dashboard
- `/quadras` - Gestão de quadras
- `/agendamentos` - Agendamentos
- `/clientes` - Gestão de clientes
- `/financeiro` - Financeiro da arena
- `/aulas` - Gestão de aulas
- `/torneios` - Gestão de torneios
- `/configuracoes` - Configurações da arena

---

### 3. Funcionário (`funcionario`)

**Descrição**: Staff/funcionário da arena

**Permissões**:
- ✅ Visualizar e gerenciar agendamentos
- ✅ Visualizar clientes
- ✅ Registrar movimentações financeiras
- ✅ Gerenciar check-ins
- ✅ Visualizar quadras
- ✅ Visualizar aulas
- ✅ Visualizar torneios
- ❌ Não pode acessar configurações
- ❌ Não pode acessar relatórios financeiros completos
- ❌ Não pode gerenciar contratos

**Páginas Acessíveis**:
- `/` - Dashboard
- `/quadras` - Visualizar quadras
- `/agendamentos` - Gerenciar agendamentos
- `/clientes` - Visualizar clientes
- `/aulas` - Gerenciar aulas
- `/torneios` - Visualizar torneios

---

### 4. Professor (`professor`)

**Descrição**: Professor de aulas na arena

**Permissões**:
- ✅ Visualizar suas aulas
- ✅ Gerenciar presenças
- ✅ Gerenciar check-ins de aulas
- ✅ Visualizar alunos inscritos
- ❌ Não pode acessar financeiro
- ❌ Não pode gerenciar quadras ou agendamentos avulsos

**Páginas Acessíveis**:
- `/aulas` - Visualizar e gerenciar suas aulas

---

### 5. Aluno (`aluno`)

**Descrição**: Cliente/aluno da arena

**Permissões**:
- ✅ Visualizar seus agendamentos
- ✅ Visualizar seus contratos
- ✅ Visualizar suas mensalidades
- ✅ Pagar mensalidades (PIX, Boleto)
- ✅ Inscrever-se em aulas
- ✅ Inscrever-se em torneios
- ❌ Não pode acessar páginas administrativas
- ❌ Não pode visualizar dados de outros clientes

**Páginas Acessíveis**:
- `/meu-financeiro` - Portal financeiro pessoal
- `/agendamentos` - Visualizar seus agendamentos

---

## 🏗️ Hierarquia de Configurações

O sistema implementa uma separação clara entre configurações globais (sistema) e configurações específicas de arena:

### Nível SISTEMA (Super Admin Only)

**Rota**: `/configuracoes-sistema`

**Gerencia**:
- ✅ Planos do Sistema (valores, recursos)
- ✅ Módulos do Sistema (disponibilidade global)
- ✅ Categorias Financeiras (templates)
- ✅ Templates de Notificações (padrões)

**Descrição**: Configurações que afetam o funcionamento global do SaaS. Apenas o Super Admin tem acesso a essas configurações, pois elas impactam todas as arenas do sistema.

---

### Nível ARENA (Super Admin para qualquer arena / Arena Admin para sua arena)

**Rotas**: 
- `/configuracoes-arena` (super admin com selector de arena)
- `/configuracoes-arena/:id` (super admin via URL direta)
- `/configuracoes` (arena admin - apenas sua própria arena)

**Gerencia**:
- ✅ Dados Gerais (nome, CNPJ, endereço)
- ✅ Assinatura e Plano
- ✅ Módulos Ativos/Inativos
- ✅ Evolution API (WhatsApp)
- ✅ Asaas (pagamentos)
- ✅ Templates customizados
- ✅ Horários de funcionamento

**Descrição**: Configurações específicas de cada arena. Super Admin pode acessar configurações de qualquer arena através do seletor. Arena Admin só pode acessar configurações da sua própria arena.

---

### Diagrama de Fluxo

```
SUPER ADMIN
    ├── /configuracoes-sistema (Nível Global)
    │   ├── Planos do Sistema
    │   ├── Módulos do Sistema
    │   ├── Categorias Financeiras
    │   └── Templates de Notificações
    │
    └── /configuracoes-arena (Qualquer Arena)
        ├── <ArenaSelector> → escolhe arena
        └── Configurações da Arena Selecionada
            ├── Geral
            ├── Assinatura
            ├── Módulos Ativos
            ├── Evolution API
            ├── Pagamentos (Asaas)
            ├── Templates
            └── Horários

ARENA ADMIN
    └── /configuracoes (Apenas Sua Arena)
        ├── Geral
        ├── Assinatura
        ├── Módulos Ativos
        ├── Evolution API
        ├── Pagamentos (Asaas)
        ├── Templates
        └── Horários
```

---

### Componente Compartilhado

As configurações de arena utilizam o componente `ArenaConfigTabs` que centraliza toda a lógica de configuração, evitando duplicação de código:

```typescript
// src/components/configuracoes/ArenaConfigTabs.tsx
<ArenaConfigTabs 
  arenaId={id}              // ID da arena (opcional)
  showArenaSelector={true}  // Mostrar seletor de arena (super admin)
/>
```

**Benefícios**:
- 📦 DRY: Um único componente para duas páginas
- 🎨 Consistência visual padronizada
- 🔧 Manutenção centralizada
- 🧪 Testes simplificados

---

## 🔒 Arquitetura de Segurança

### Multi-Tenancy (Tenant Isolation)

Todas as tabelas utilizam `arena_id` para isolamento de dados:

```sql
-- Exemplo de RLS policy
CREATE POLICY "Tenant isolation"
ON public.contratos
FOR ALL
USING (arena_id IN (
  SELECT arena_id FROM user_roles
  WHERE user_id = auth.uid()
));
```

### Função de Verificação de Roles

```sql
CREATE FUNCTION has_role(_user_id uuid, _role app_role)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

### Tabela `user_roles`

```sql
CREATE TABLE user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  arena_id uuid REFERENCES arenas(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);
```

**Importante**: 
- Um usuário pode ter múltiplas roles
- `super_admin` não precisa de `arena_id`
- Demais roles devem ter `arena_id` preenchido

---

## 🛡️ Row Level Security (RLS)

### Política de Super Admin

```sql
-- Super admin tem acesso a tudo
CREATE POLICY "Super admin full access"
ON public.any_table
FOR ALL
USING (has_role(auth.uid(), 'super_admin'));
```

### Política de Tenant Isolation

```sql
-- Usuários só veem dados da sua arena
CREATE POLICY "Tenant isolation"
ON public.any_table
FOR ALL
USING (arena_id IN (
  SELECT arena_id FROM user_roles
  WHERE user_id = auth.uid()
));
```

### Política de Dados Pessoais

```sql
-- Alunos só veem seus próprios dados
CREATE POLICY "Users view own data"
ON public.mensalidades
FOR SELECT
USING (
  contrato_id IN (
    SELECT id FROM contratos
    WHERE usuario_id = (
      SELECT id FROM usuarios WHERE auth_id = auth.uid()
    )
  )
);
```

---

## 📝 Como Adicionar um Novo Role

### 1. Atualizar o Enum

```sql
ALTER TYPE app_role ADD VALUE 'novo_role';
```

### 2. Atualizar TypeScript

```typescript
// src/contexts/AuthContext.tsx
type AppRole = "super_admin" | "arena_admin" | "funcionario" | "professor" | "aluno" | "novo_role";
```

### 3. Atualizar ProtectedRoute

```typescript
// src/components/ProtectedRoute.tsx
interface ProtectedRouteProps {
  requiredRole?: "super_admin" | "arena_admin" | "funcionario" | "professor" | "aluno" | "novo_role";
}
```

### 4. Adicionar no Sidebar

```typescript
// src/components/AppSidebar.tsx
const navItems = [
  { title: "Nova Página", url: "/nova-pagina", icon: Icon, roles: ["novo_role"] },
];
```

### 5. Criar Rota Protegida

```typescript
// src/App.tsx
<Route
  path="/nova-pagina"
  element={
    <ProtectedRoute requiredRole="novo_role">
      <NovaPagina />
    </ProtectedRoute>
  }
/>
```

### 6. Atualizar RLS Policies

```sql
CREATE POLICY "Novo role pode acessar"
ON public.tabela
FOR SELECT
USING (has_role(auth.uid(), 'novo_role'));
```

---

## 🧪 Testando Roles

### Criar Usuário de Teste

```sql
-- 1. Criar usuário no auth
INSERT INTO auth.users (email, encrypted_password, ...)
VALUES (...);

-- 2. Criar perfil no usuarios
INSERT INTO usuarios (auth_id, nome_completo, email, arena_id, ...)
VALUES (...);

-- 3. Atribuir role
INSERT INTO user_roles (user_id, role, arena_id)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'teste@example.com'),
  'aluno',
  (SELECT id FROM arenas LIMIT 1)
);
```

### Verificar Permissões

```sql
-- Ver roles de um usuário
SELECT u.email, ur.role, a.nome as arena
FROM user_roles ur
JOIN auth.users u ON u.id = ur.user_id
LEFT JOIN arenas a ON a.id = ur.arena_id
WHERE u.email = 'teste@example.com';

-- Verificar se tem uma role específica
SELECT has_role(
  (SELECT id FROM auth.users WHERE email = 'teste@example.com'),
  'aluno'::app_role
);
```

---

## ⚠️ Convenções Importantes

### ✅ FAZER

- Usar sempre `app_role` do banco de dados
- Verificar roles usando a função `has_role()`
- Implementar RLS em todas as tabelas
- Isolar dados por `arena_id` (tenant isolation)
- Usar SECURITY DEFINER em funções de verificação

### ❌ NÃO FAZER

- Armazenar roles em `localStorage` ou `sessionStorage`
- Verificar roles apenas no frontend
- Usar credenciais hardcoded
- Misturar nomenclaturas (`cliente` vs `aluno`, `staff` vs `funcionario`)
- Referenciar diretamente `auth.users` em foreign keys de outras tabelas (usar `usuarios.auth_id`)

---

## 📊 Matriz de Permissões

| Funcionalidade | super_admin | arena_admin | funcionario | professor | aluno |
|----------------|-------------|-------------|-------------|-----------|-------|
| Gerenciar arenas | ✅ | ❌ | ❌ | ❌ | ❌ |
| Gerenciar quadras | ✅ | ✅ | ❌ | ❌ | ❌ |
| Ver agendamentos | ✅ | ✅ | ✅ | ❌ | ✅* |
| Criar agendamentos | ✅ | ✅ | ✅ | ❌ | ❌ |
| Ver clientes | ✅ | ✅ | ✅ | ❌ | ❌ |
| Gerenciar clientes | ✅ | ✅ | ❌ | ❌ | ❌ |
| Financeiro arena | ✅ | ✅ | ❌ | ❌ | ❌ |
| Financeiro pessoal | ❌ | ❌ | ❌ | ❌ | ✅ |
| Gerenciar aulas | ✅ | ✅ | ✅ | ✅* | ❌ |
| Inscrever em aulas | ✅ | ✅ | ✅ | ❌ | ✅ |
| Gerenciar torneios | ✅ | ✅ | ✅ | ❌ | ❌ |
| Inscrever em torneios | ✅ | ✅ | ✅ | ❌ | ✅ |
| Config. Sistema | ✅ | ❌ | ❌ | ❌ | ❌ |
| Config. Arenas (qualquer) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Config. Arena (própria) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Evolution API config | ✅ | ✅ | ❌ | ❌ | ❌ |
| Asaas config | ✅ | ✅ | ❌ | ❌ | ❌ |
| Dashboard com filtros | ✅ | ❌ | ❌ | ❌ | ❌ |

\* Com restrições (apenas seus próprios dados)

---

## 🔄 Histórico de Mudanças

### v2.0.0 (19/10/2025)
- ✅ Configurações hierárquicas (Sistema → Arena)
- ✅ Dashboard Super Admin com filtro por arena
- ✅ Super Admin pode acessar Evolution API e Asaas de qualquer arena
- ✅ RLS policies atualizadas para super admin
- ✅ Separação clara entre `/configuracoes-sistema` e `/configuracoes-arena`
- ✅ Componente compartilhado `ArenaConfigTabs` para padronização
- ✅ ArenaSelector para super admin escolher arena específica

### v1.0.0 (06/10/2025)
- ✅ Unificação completa do sistema de roles
- ✅ Migração de `cliente` → `aluno`
- ✅ Migração de `staff` → `funcionario`
- ✅ Documentação criada
- ✅ Sistema de roles padronizado em todo o projeto

---

## 📚 Referências

- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Enums](https://www.postgresql.org/docs/current/datatype-enum.html)
- [Multi-Tenancy Best Practices](https://supabase.com/docs/guides/auth/managing-user-data)
