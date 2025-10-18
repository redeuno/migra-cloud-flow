# Análise Completa: Gestão de Professores e Alunos

## 🔴 PROBLEMAS IDENTIFICADOS

### 1. **Cadastro Incompleto de Professores**

**Situação Atual:**
- Professores são cadastrados via `/clientes` → `ClienteDialog`
- Apenas cria registro na tabela `usuarios` com `tipo_usuario = "professor"`
- **NÃO cria** registro na tabela `professores` automaticamente
- **NÃO cria** registro em `user_roles` automaticamente

**Consequências:**
- Professor criado não tem dados profissionais (valor_hora, comissão, especialidades)
- Professor não tem role correta em `user_roles`
- Não pode dar aulas ou receber comissões
- Sistema quebrado

### 2. **Cadastro Incompleto de Alunos**

**Situação Atual:**
- Alunos são cadastrados via `/clientes` → `ClienteDialog`
- Apenas cria registro na tabela `usuarios` com `tipo_usuario = "aluno"`
- **NÃO cria** registro em `user_roles` automaticamente

**Consequências:**
- Aluno não tem permissões corretas
- Não consegue acessar suas telas (meus agendamentos, minhas aulas, etc)

### 3. **Falta de Interface Dedicada para Professores**

**O que NÃO existe:**
- ❌ Página `/professores` para listar professores
- ❌ Dialog específico com campos de professor (valor_hora, comissão, especialidades)
- ❌ Visualização de disponibilidade do professor
- ❌ Gerenciamento de permissões/acessos

### 4. **Controle de Permissões Inexistente**

**O que falta:**
- Não há interface para Arena Admin gerenciar permissões de professores
- Não há forma de ativar/desativar acessos específicos
- Não há visualização do que cada professor pode fazer

---

## ✅ SOLUÇÃO COMPLETA

### Fase 1: Banco de Dados - Triggers Automáticos

#### Trigger 1: Auto-criar registro em `professores` quando cria usuário tipo professor
```sql
CREATE OR REPLACE FUNCTION auto_create_professor()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tipo_usuario = 'professor' THEN
    INSERT INTO professores (
      usuario_id,
      arena_id,
      valor_hora_aula,
      percentual_comissao_padrao,
      disponibilidade,
      especialidades,
      status
    ) VALUES (
      NEW.id,
      NEW.arena_id,
      0, -- Arena admin deve configurar depois
      30.00, -- Padrão 30%
      '{}',
      '[]',
      NEW.status
    )
    ON CONFLICT (usuario_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_create_professor
AFTER INSERT ON usuarios
FOR EACH ROW
EXECUTE FUNCTION auto_create_professor();
```

#### Trigger 2: Auto-criar role em `user_roles` quando cria usuário
```sql
CREATE OR REPLACE FUNCTION auto_create_user_role()
RETURNS TRIGGER AS $$
DECLARE
  _role app_role;
BEGIN
  -- Mapear tipo_usuario para app_role
  CASE NEW.tipo_usuario
    WHEN 'professor' THEN _role := 'professor'::app_role;
    WHEN 'aluno' THEN _role := 'aluno'::app_role;
    WHEN 'funcionario' THEN _role := 'funcionario'::app_role;
    WHEN 'arena_admin' THEN _role := 'arena_admin'::app_role;
    ELSE RETURN NEW;
  END CASE;

  -- Se usuário tem auth_id, criar role
  IF NEW.auth_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, arena_id, role)
    VALUES (NEW.auth_id, NEW.arena_id, _role)
    ON CONFLICT (user_id, role, arena_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_create_user_role
AFTER INSERT OR UPDATE OF auth_id ON usuarios
FOR EACH ROW
EXECUTE FUNCTION auto_create_user_role();
```

### Fase 2: Interface - Nova Página de Professores

#### Estrutura de Arquivos:
```
src/
  pages/
    Professores.tsx (NOVO)
  components/
    professores/
      ProfessoresTable.tsx (NOVO)
      ProfessorDialog.tsx (NOVO)
      ProfessorPermissoesDialog.tsx (NOVO)
```

#### Funcionalidades `/professores`:

1. **Listagem de Professores:**
   - Tabela com: Nome, Email, Especialidades, Avaliação, Status
   - Filtros: Status, Especialidade
   - Busca por nome

2. **CRUD Completo:**
   - ✅ Criar: Dados pessoais + Dados profissionais
   - ✅ Editar: Todos os campos
   - ✅ Excluir: Com confirmação
   - ✅ Ativar/Desativar: Toggle rápido

3. **Dialog Específico de Professor:**
   - **Aba 1: Dados Pessoais** (nome, email, cpf, telefone, data_nascimento)
   - **Aba 2: Dados Profissionais:**
     - Valor hora/aula
     - % Comissão padrão
     - Registro profissional
     - Especialidades (multi-select)
   - **Aba 3: Disponibilidade:**
     - Grade semanal de horários disponíveis
   - **Aba 4: Avaliações:**
     - Visualização das avaliações recebidas

4. **Gerenciamento de Permissões:**
   - Dialog separado para configurar acessos específicos
   - Toggle para cada permissão/módulo

### Fase 3: Melhorar Página `/clientes`

#### Renomear para `/pessoas` ou manter `/clientes` mas melhorar:

1. **Filtros por Tipo:**
   - Tabs: "Todos" | "Alunos" | "Professores" | "Funcionários"

2. **Ações Específicas por Tipo:**
   - Aluno: Ver contratos, mensalidades, agendamentos
   - Professor: Redirecionar para `/professores` para edição completa
   - Funcionário: Ver permissões

3. **Visualização Diferenciada:**
   - Badge indicando tipo de usuário
   - Colunas dinâmicas baseadas no tipo

---

## 📋 FLUXOS COMPLETOS

### Fluxo 1: Arena Admin Cadastra Professor

**Caminho:** Menu → Professores → Novo Professor

1. Arena Admin clica "Novo Professor"
2. Abre `ProfessorDialog` com abas
3. Preenche:
   - Dados pessoais (nome, email, cpf, telefone, nascimento)
   - Dados profissionais (valor_hora, comissão, especialidades)
   - Disponibilidade (grade horária)
4. Clica "Cadastrar"
5. **Sistema automaticamente:**
   - Cria registro em `usuarios` (tipo_usuario = "professor")
   - **Trigger** cria registro em `professores`
   - **Trigger** cria registro em `user_roles` (role = "professor")
6. Professor cadastrado e operacional

### Fluxo 2: Arena Admin Gerencia Permissões de Professor

**Caminho:** Menu → Professores → Editar → Aba Permissões

1. Arena Admin abre professor na lista
2. Clica em "Editar"
3. Vai para aba "Permissões"
4. Vê lista de módulos/funcionalidades
5. Ativa/desativa permissões específicas
6. Salva

### Fluxo 3: Arena Admin Cadastra Aluno

**Caminho:** Menu → Pessoas → Novo Cliente

1. Arena Admin clica "Novo Cliente"
2. Preenche dados básicos
3. Seleciona tipo_usuario = "aluno"
4. Clica "Cadastrar"
5. **Sistema automaticamente:**
   - Cria registro em `usuarios`
   - **Trigger** cria registro em `user_roles` (role = "aluno")
6. Aluno pode fazer login e acessar suas telas

### Fluxo 4: Professor Acessa Sistema

1. Professor faz login
2. Sistema carrega roles de `user_roles`
3. Sidebar mostra apenas itens permitidos:
   - Dashboard
   - Minhas Aulas
   - Comissões (suas comissões)
4. Professor não vê:
   - Quadras, Agendamentos, Clientes, Financeiro (da arena)

### Fluxo 5: Aluno Acessa Sistema

1. Aluno faz login
2. Sistema carrega roles de `user_roles`
3. Sidebar mostra apenas:
   - Dashboard (dele)
   - Meus Agendamentos
   - Minhas Aulas
   - Meu Financeiro
4. Aluno não vê nada administrativo

---

## 🎯 RESULTADO FINAL

### Para Arena Admin:
- ✅ Cadastra professores completos (dados + permissões)
- ✅ Gerencia permissões de cada professor
- ✅ Cadastra alunos funcionais
- ✅ Visualiza e controla tudo

### Para Professor:
- ✅ Acesso automático após cadastro
- ✅ Vê apenas suas funcionalidades
- ✅ Gerencia suas aulas e comissões
- ✅ Não acessa dados da arena

### Para Aluno:
- ✅ Acesso automático após cadastro
- ✅ Vê apenas seus dados
- ✅ Agenda aulas, vê financeiro pessoal
- ✅ Avalia professores

### Segurança:
- ✅ RLS protege dados por arena_id
- ✅ Roles controlam acesso por função
- ✅ Triggers garantem consistência
- ✅ Sem duplicação de dados

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ Criar triggers no banco
2. ✅ Criar página `/professores`
3. ✅ Criar `ProfessorDialog` completo
4. ✅ Melhorar página `/clientes` com filtros
5. ✅ Testar fluxos completos
