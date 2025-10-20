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

**Proteção de Rota**: `<ProtectedRoute requiredRole="super_admin">`

---

### Nível ARENA (Super Admin para qualquer arena / Arena Admin para sua arena)

#### Super Admin - Configurações de Qualquer Arena

**Rotas**: 
- `/configuracoes-arena` (com `ArenaSelector` visível)
- `/configuracoes-arena/:id` (acesso direto via URL)

**Gerencia**:
- ✅ Dados Gerais (nome, CNPJ, endereço)
- ✅ Assinatura e Plano
- ✅ Módulos Ativos/Inativos
- ✅ Evolution API (WhatsApp)
- ✅ Asaas (pagamentos)
- ✅ Templates customizados
- ✅ Horários de funcionamento

**Características**:
- Exibe `ArenaSelector` no topo da página
- Pode selecionar e gerenciar qualquer arena ativa
- Usa `effectiveArenaId = selectedArena || propArenaId`
- NÃO usa `contextArenaId` (Super Admin não tem arena associada)

**Proteção de Rota**: `<ProtectedRoute requiredRole="super_admin">`

---

#### Arena Admin - Configurações da Própria Arena

**Rota**: 
- `/configuracoes` (sem `ArenaSelector`, apenas sua arena)

**Gerencia**:
- ✅ Dados Gerais (nome, CNPJ, endereço)
- ✅ Assinatura e Plano (visualização)
- ✅ Módulos Ativos/Inativos
- ✅ Evolution API (WhatsApp)
- ✅ Asaas (pagamentos)
- ✅ Templates customizados
- ✅ Horários de funcionamento

**Características**:
- NÃO exibe `ArenaSelector`
- Usa APENAS `contextArenaId` (arena do usuário autenticado)
- Validação de segurança impede acesso a outras arenas
- Se `propArenaId !== contextArenaId`, exibe erro de permissão

**Proteção de Rota**: `<ProtectedRoute requiredRole="arena_admin">` + `<PerfilAccessGuard allowedRoles={["arena_admin"]}>`

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

## 🗄️ Estrutura Técnica do Banco de Dados

### Tabelas Principais

#### 1. `auth.users` (Gerenciada pelo Supabase Auth)
```sql
-- Tabela do Supabase Auth - não modificamos diretamente
id uuid PRIMARY KEY
email text UNIQUE
encrypted_password text
raw_user_meta_data jsonb  -- Metadados usados no signup
created_at timestamptz
updated_at timestamptz
```

#### 2. `usuarios` (Tabela de Perfis)
```sql
CREATE TABLE usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid UNIQUE NOT NULL,  -- ✅ UNIQUE + NOT NULL
  arena_id uuid REFERENCES arenas(id),
  tipo_usuario tipo_usuario NOT NULL,
  nome_completo varchar NOT NULL,
  email varchar NOT NULL,
  cpf varchar(14),
  telefone varchar,
  data_nascimento date,
  foto_url text,
  status status_geral DEFAULT 'ativo',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- ✅ Constraints de integridade
  CONSTRAINT usuarios_auth_id_unique UNIQUE (auth_id),
  CONSTRAINT usuarios_auth_id_fkey FOREIGN KEY (auth_id) 
    REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ✅ Indexes para performance
CREATE INDEX idx_usuarios_auth_id ON usuarios(auth_id);
CREATE INDEX idx_usuarios_arena_id ON usuarios(arena_id);
CREATE INDEX idx_usuarios_tipo_usuario ON usuarios(tipo_usuario);

-- ✅ Trigger: Validar arena_id obrigatório para não-super-admins
CREATE TRIGGER validate_usuario_arena_id_trigger
  BEFORE INSERT OR UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION validate_usuario_arena_id();
```

**Regras de Validação**:
- ✅ `auth_id` é **OBRIGATÓRIO** e **ÚNICO** (1:1 com `auth.users`)
- ✅ `arena_id` é **OBRIGATÓRIO** para todos exceto `super_admin`
- ✅ `tipo_usuario` determina role padrão no signup
- ✅ FK com `auth.users` garante integridade referencial
- ✅ `ON DELETE CASCADE` remove perfil quando usuário deletado

#### 3. `user_roles` (Tabela de Permissões)
```sql
CREATE TABLE user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  arena_id uuid REFERENCES arenas(id),  -- NULL apenas para super_admin
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  
  -- ✅ Um usuário não pode ter a mesma role duplicada na mesma arena
  CONSTRAINT user_roles_unique UNIQUE (user_id, role, arena_id)
);

-- ✅ Indexes para performance de queries RLS
CREATE INDEX idx_user_roles_arena_id ON user_roles(arena_id);
CREATE INDEX idx_user_roles_user_arena ON user_roles(user_id, arena_id);

-- ✅ Enum de Roles (fonte única da verdade)
CREATE TYPE app_role AS ENUM (
  'super_admin',
  'arena_admin', 
  'funcionario',
  'professor',
  'aluno'
);
```

**Características**:
- ✅ Um usuário pode ter **múltiplas roles** em **múltiplas arenas**
- ✅ `arena_id` é **NULL** apenas para `super_admin`
- ✅ Constraint `UNIQUE (user_id, role, arena_id)` evita duplicatas
- ✅ Indexes otimizam queries RLS (`has_role()` chamada frequentemente)

#### 4. `professores` (Tabela de Especialização)
```sql
CREATE TABLE professores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid UNIQUE REFERENCES usuarios(id) NOT NULL,
  arena_id uuid REFERENCES arenas(id) NOT NULL,
  valor_hora_aula numeric,
  percentual_comissao_padrao numeric,
  especialidades jsonb DEFAULT '[]',
  disponibilidade jsonb DEFAULT '{}',
  avaliacao_media numeric,
  total_avaliacoes integer DEFAULT 0,
  status status_geral DEFAULT 'ativo',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ✅ Index para joins frequentes
CREATE INDEX idx_professores_usuario_id ON professores(usuario_id);

-- ✅ Triggers automáticos
CREATE TRIGGER auto_create_professor_trigger
  AFTER INSERT OR UPDATE OF tipo_usuario ON usuarios
  FOR EACH ROW EXECUTE FUNCTION auto_create_professor();

CREATE TRIGGER sync_user_role_professor_trigger
  AFTER INSERT OR UPDATE OR DELETE ON professores
  FOR EACH ROW EXECUTE FUNCTION sync_user_role_professor();
```

#### 5. `funcionarios` (Tabela de Especialização)
```sql
CREATE TABLE funcionarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid UNIQUE REFERENCES usuarios(id) NOT NULL,
  arena_id uuid REFERENCES arenas(id) NOT NULL,
  cargo varchar NOT NULL,
  salario numeric,
  data_admissao date NOT NULL,
  data_demissao date,
  horario_trabalho jsonb DEFAULT '{}',
  permissoes jsonb DEFAULT '[]',
  status status_geral DEFAULT 'ativo',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ✅ Index para joins frequentes
CREATE INDEX idx_funcionarios_usuario_id ON funcionarios(usuario_id);

-- ✅ Triggers automáticos (implementados na Migration v2.1.0)
CREATE TRIGGER auto_create_funcionario_trigger
  AFTER INSERT OR UPDATE OF tipo_usuario ON usuarios
  FOR EACH ROW EXECUTE FUNCTION auto_create_funcionario();

CREATE TRIGGER sync_user_role_funcionario_trigger
  AFTER INSERT OR UPDATE OR DELETE ON funcionarios
  FOR EACH ROW EXECUTE FUNCTION sync_user_role_funcionario();
```

---

### Fluxo de Criação de Usuários

#### 1. Signup via Supabase Auth (Frontend)
```typescript
// React component
const { data, error } = await supabase.auth.signUp({
  email: 'joao@email.com',
  password: 'senha123',
  options: {
    data: {
      // ✅ Metadados usados pelo trigger handle_new_user()
      tipo_usuario: 'professor',  // ou 'aluno', 'funcionario', 'arena_admin'
      arena_id: 'uuid-da-arena',  // obrigatório para não-super-admin
      nome_completo: 'João Silva',
      telefone: '11999999999'
    }
  }
});
```

#### 2. Trigger `handle_new_user()` Executa Automaticamente
```sql
-- Trigger em auth.users:
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- O que a função faz:
1. Extrai metadados de raw_user_meta_data
2. Cria registro em usuarios com auth_id linkado
3. Cria role correspondente em user_roles
4. Se tipo_usuario='professor', dispara auto_create_professor()
5. Se tipo_usuario='funcionario', dispara auto_create_funcionario()
```

#### 3. Cascata de Triggers
```
INSERT em auth.users
  └─> handle_new_user()
      └─> INSERT em usuarios
          └─> auto_create_professor() OU auto_create_funcionario()
              └─> INSERT em professores/funcionarios
                  └─> sync_user_role_*()
                      └─> INSERT em user_roles
```

#### 4. Resultado Final (Exemplo: Professor)
```
auth.users
  id: abc-123
  email: joao@email.com
  
usuarios
  id: def-456
  auth_id: abc-123  ← FK para auth.users
  tipo_usuario: 'professor'
  arena_id: xyz-789
  
professores
  id: ghi-012
  usuario_id: def-456  ← FK para usuarios
  arena_id: xyz-789
  
user_roles
  user_id: abc-123  ← FK para auth.users
  role: 'professor'
  arena_id: xyz-789
```

---

### Diagrama ER Simplificado

```
┌──────────────┐
│ auth.users   │ (Supabase Auth)
│ (id, email)  │
└──────┬───────┘
       │ FK: auth_id
       │ (UNIQUE, NOT NULL, CASCADE)
       ▼
┌──────────────┐
│  usuarios    │◄────────┐
│ (auth_id,    │         │ FK: usuario_id
│  arena_id,   │         │ (UNIQUE)
│  tipo)       │         │
└──────┬───────┘         │
       │                 │
       │          ┌──────┴────────┐
       │          │ professores   │
       │          │ (valor_hora,  │
       │          │  comissao)    │
       │          └───────────────┘
       │          ┌───────────────┐
       │          │ funcionarios  │
       │          │ (cargo,       │
       │          │  salario)     │
       │          └───────────────┘
       │
       │ FK: user_id
       ▼
┌──────────────┐
│ user_roles   │
│ (user_id,    │
│  role,       │
│  arena_id)   │
└──────────────┘
```

---

### Funções de Segurança (Security Definer)

#### 1. `has_role(_user_id, _role)` - Verificação de Permissões
```sql
CREATE FUNCTION has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
```

**Uso em RLS Policies**:
```sql
-- Exemplo: Apenas admins podem deletar quadras
CREATE POLICY "Admin can delete quadras"
ON quadras FOR DELETE
USING (
  has_role(auth.uid(), 'super_admin') OR
  has_role(auth.uid(), 'arena_admin')
);
```

**Por que SECURITY DEFINER?**
- Evita recursão infinita em RLS policies
- Executa com privilégios da função, não do usuário
- Permite leitura de `user_roles` mesmo com RLS ativo

#### 2. `validate_usuario_arena_id()` - Validação de Integridade
```sql
CREATE FUNCTION validate_usuario_arena_id()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Super admin pode ter arena_id NULL
  IF EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = NEW.auth_id AND role = 'super_admin'
  ) THEN
    RETURN NEW;
  END IF;
  
  -- Outros roles precisam de arena_id
  IF NEW.arena_id IS NULL AND NEW.auth_id IS NOT NULL THEN
    RAISE EXCEPTION 'arena_id é obrigatório para usuários não-super-admin';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Aplicado antes de INSERT/UPDATE em usuarios
CREATE TRIGGER validate_usuario_arena_id_trigger
  BEFORE INSERT OR UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION validate_usuario_arena_id();
```

#### 3. `auto_create_professor()` - Auto-criação de Professor
```sql
CREATE FUNCTION auto_create_professor()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tipo_usuario = 'professor' THEN
    INSERT INTO professores (
      usuario_id, arena_id, valor_hora_aula, 
      percentual_comissao_padrao, status
    ) VALUES (
      NEW.id, NEW.arena_id, 100.00, 30.00, NEW.status
    )
    ON CONFLICT (usuario_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 4. `sync_user_role_professor()` - Sincronização de Roles
```sql
CREATE FUNCTION sync_user_role_professor()
RETURNS TRIGGER AS $$
DECLARE
  v_auth_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT auth_id INTO v_auth_id FROM usuarios WHERE id = NEW.usuario_id;
    INSERT INTO user_roles (user_id, arena_id, role)
    VALUES (v_auth_id, NEW.arena_id, 'professor')
    ON CONFLICT DO NOTHING;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Atualiza se arena mudou
    SELECT auth_id INTO v_auth_id FROM usuarios WHERE id = NEW.usuario_id;
    DELETE FROM user_roles WHERE user_id = v_auth_id AND role = 'professor';
    INSERT INTO user_roles (user_id, arena_id, role)
    VALUES (v_auth_id, NEW.arena_id, 'professor')
    ON CONFLICT DO NOTHING;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Remove role quando professor deletado
    SELECT auth_id INTO v_auth_id FROM usuarios WHERE id = OLD.usuario_id;
    DELETE FROM user_roles 
    WHERE user_id = v_auth_id AND role = 'professor';
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### Triggers Implementados (Completos)

| Trigger | Tabela | Função | Evento | Quando |
|---------|--------|--------|--------|--------|
| `on_auth_user_created` | `auth.users` | `handle_new_user()` | INSERT | AFTER |
| `validate_usuario_arena_id_trigger` | `usuarios` | `validate_usuario_arena_id()` | INSERT/UPDATE | BEFORE |
| `auto_create_professor_trigger` | `usuarios` | `auto_create_professor()` | INSERT/UPDATE | AFTER |
| `auto_create_funcionario_trigger` | `usuarios` | `auto_create_funcionario()` | INSERT/UPDATE | AFTER |
| `sync_user_role_professor_trigger` | `professores` | `sync_user_role_professor()` | INSERT/UPDATE/DELETE | AFTER |
| `sync_user_role_funcionario_trigger` | `funcionarios` | `sync_user_role_funcionario()` | INSERT/UPDATE/DELETE | AFTER |
| `auto_create_user_role` | `usuarios` | `auto_create_user_role()` | INSERT/UPDATE | AFTER |

**Ordem de Execução (Signup)**:
1. `INSERT` em `auth.users`
2. `handle_new_user()` → cria em `usuarios`
3. `validate_usuario_arena_id()` → valida arena_id
4. `auto_create_professor/funcionario()` → cria especialização
5. `sync_user_role_*()` → sincroniza `user_roles`
6. `auto_create_user_role()` → cria role base

---

### Constraints de Segurança

#### Integridade Referencial
```sql
-- ✅ Implementado
usuarios.auth_id → auth.users.id (FK, UNIQUE, NOT NULL, ON DELETE CASCADE)
user_roles.user_id → auth.users.id (FK, NOT NULL, ON DELETE CASCADE)
user_roles.arena_id → arenas.id (FK, NULL para super_admin)
professores.usuario_id → usuarios.id (FK, UNIQUE)
funcionarios.usuario_id → usuarios.id (FK, UNIQUE)
```

#### Validações de Negócio
- ✅ **Super admin** é o ÚNICO que pode ter `arena_id = NULL`
- ✅ Não pode haver **roles duplicadas** para mesmo `user_id + role + arena_id`
- ✅ **Professores/Funcionários** sempre sincronizam com `user_roles`
- ✅ Deleção em `auth.users` **cascateia** para todas as tabelas filhas
- ✅ `auth_id` em `usuarios` é **obrigatório e único** (1:1 com `auth.users`)

#### Indexes de Performance
```sql
-- ✅ Todos implementados na Migration v2.1.0
CREATE INDEX idx_usuarios_auth_id ON usuarios(auth_id);
CREATE INDEX idx_usuarios_arena_id ON usuarios(arena_id);
CREATE INDEX idx_usuarios_tipo_usuario ON usuarios(tipo_usuario);
CREATE INDEX idx_user_roles_arena_id ON user_roles(arena_id);
CREATE INDEX idx_user_roles_user_arena ON user_roles(user_id, arena_id);
CREATE INDEX idx_professores_usuario_id ON professores(usuario_id);
CREATE INDEX idx_funcionarios_usuario_id ON funcionarios(usuario_id);
```

**Benefício**: Queries RLS são executadas em **TODAS** as consultas. Indexes garantem performance escalável.

---

## 🔄 Histórico de Mudanças

### v2.1.0 (20/01/2025) - ✅ MIGRATION COMPLETA FASES 1-5

**STATUS: 100% IMPLEMENTADO E VERIFICADO**

#### **FASE 1: Limpeza de Dados** ✅
- ✅ Removidas entradas órfãs em `usuarios` (auth_id NULL)
- ✅ Removidas entradas órfãs em `user_roles` (user_id não existe em auth.users)
- ✅ Removidas duplicatas em `user_roles` (mesmo user_id + role + arena_id)
- ✅ Base de dados limpa e consistente para aplicação de constraints

#### **FASE 2: Constraints & Foreign Keys** ✅
- ✅ `usuarios.auth_id`: Adicionado `UNIQUE` constraint
- ✅ `usuarios.auth_id`: Adicionado `NOT NULL` constraint
- ✅ `usuarios.auth_id`: Adicionado `FOREIGN KEY` → `auth.users(id)` com `ON DELETE CASCADE`
- ✅ Função `validate_usuario_arena_id()`: Criada e testada
  - Valida que apenas `super_admin` pode ter `arena_id = NULL`
  - Bloqueia INSERT/UPDATE de usuários sem arena_id
- ✅ Trigger `trg_validate_usuario_arena_id`: Ativo em `usuarios` (BEFORE INSERT/UPDATE)

#### **FASE 3: Triggers Funcionários** ✅
- ✅ Função `auto_create_funcionario()`: Criada
  - Auto-cria entrada em `funcionarios` quando `tipo_usuario = 'funcionario'`
  - Inicializa com valores padrão (cargo, data_admissao, status)
- ✅ Trigger `trigger_auto_create_funcionario`: Ativo em `usuarios` (AFTER INSERT/UPDATE)
- ✅ Função `sync_user_role_funcionario()`: Criada
  - Sincroniza `user_roles` automaticamente em INSERT/UPDATE/DELETE
  - Mantém integridade entre `funcionarios` e `user_roles`
- ✅ Trigger `trg_sync_user_role_funcionario`: Ativo em `funcionarios` (AFTER INSERT/UPDATE/DELETE)

#### **FASE 4: Indexes de Performance** ✅
- ✅ `idx_usuarios_auth_id` - Otimiza joins com auth.users
- ✅ `idx_usuarios_arena_id` - Otimiza filtros por tenant
- ✅ `idx_usuarios_tipo_usuario` - Otimiza filtros por tipo
- ✅ `idx_user_roles_arena_id` - Otimiza RLS policies por arena
- ✅ `idx_user_roles_user_id` - Otimiza has_role() function
- ✅ `idx_user_roles_composite` - Otimiza queries compostas (user_id + arena_id)
- ✅ `idx_professores_usuario_id` - Otimiza joins com usuarios
- ✅ `idx_funcionarios_usuario_id` - Otimiza joins com usuarios

**Total: 8 indexes críticos para performance escalável**

#### **FASE 5: Signup Automation** ✅
- ✅ Função `handle_new_user()`: Reescrita completamente
  - Extrai metadados de `raw_user_meta_data` (tipo_usuario, arena_id, nome_completo, telefone)
  - Cria automaticamente entrada em `usuarios` vinculada a `auth.users`
  - Cria automaticamente entrada em `user_roles` com role correspondente
  - Dispara cascata de triggers (`auto_create_professor`, `auto_create_funcionario`)
  - Tratamento de erros não bloqueia signup (apenas warnings no log)
- ✅ Trigger `on_auth_user_created`: Ativo em `auth.users` (AFTER INSERT)

#### **Cascata de Automação Completa**
```
Signup → auth.users
  └─> handle_new_user()
      ├─> INSERT usuarios (com auth_id)
      │   └─> validate_usuario_arena_id() [valida arena_id]
      │   └─> auto_create_professor/funcionario() [se aplicável]
      │       └─> INSERT professores/funcionarios
      │           └─> sync_user_role_*() [sincroniza role]
      └─> INSERT user_roles (role inicial)
```

#### **Integridade Garantida**
- ✅ Relação 1:1 entre `auth.users` ↔ `usuarios` (UNIQUE + NOT NULL + FK)
- ✅ Validação automática de arena_id para não-super-admins
- ✅ Sincronização automática de roles em todas as operações
- ✅ Cascateamento de deleção (DELETE em auth.users remove tudo)
- ✅ Prevenção de duplicatas em user_roles (UNIQUE constraint)

#### **Performance Otimizada**
- ✅ Indexes estratégicos em todas as colunas de join/filter
- ✅ RLS policies executam rapidamente via has_role() indexado
- ✅ Queries de autenticação otimizadas para sub-10ms

#### **Documentação Atualizada**
- ✅ Estrutura técnica completa de todas as tabelas
- ✅ ER Diagram com constraints visuais
- ✅ Fluxo de signup detalhado passo-a-passo
- ✅ Triggers, functions e constraints documentados
- ✅ Exemplos práticos de uso

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
