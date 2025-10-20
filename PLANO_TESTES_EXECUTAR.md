# 🧪 PLANO DE TESTES - EXECUÇÃO PRÁTICA

## ✅ PASSO 1: Executar Script de Dados de Teste

1. Abra o Supabase Dashboard
2. Vá em **SQL Editor**
3. Copie e cole o conteúdo do arquivo `SCRIPT_DADOS_TESTE.sql`
4. Execute o script
5. Verifique o resumo no final

**O que será criado:**
- ✅ Vínculos professor-aluno
- ✅ Inscrições em aulas
- ✅ Notificações de teste
- ✅ Coordenadas da arena (São Paulo)
- ✅ 5+ aulas para os próximos dias
- ✅ Templates de notificação

---

## 🧪 PASSO 2: Testes por Role

### 🎾 **ALUNO - Testes Prioritários**

#### A. Dashboard e Navegação
- [ ] Fazer login como aluno
- [ ] Verificar dashboard com métricas
- [ ] Ver próximas aulas inscritas
- [ ] Ver mensalidades (se houver)

#### B. Aulas Disponíveis
- [ ] Acessar "Aulas Disponíveis"
- [ ] Ver lista de aulas futuras
- [ ] Clicar em "Ver Detalhes" de uma aula
- [ ] Verificar se botão "Inscrever-se" aparece
- [ ] Inscrever-se em uma aula nova
- [ ] Verificar notificação de sucesso
- [ ] Ver que aula aparece em "Minhas Aulas"

#### C. Minhas Aulas
- [ ] Acessar "Minhas Aulas"
- [ ] Ver aulas inscritas
- [ ] Tentar cancelar inscrição (validar 24h)
- [ ] Ver detalhes da aula
- [ ] Ver professor responsável

#### D. Check-in (SE AULA FOR HOJE)
**Importante:** Para testar check-in por geolocalização:
1. A aula precisa estar na janela de tempo (30 min antes até 15 min depois)
2. Você precisa estar próximo às coordenadas da arena (ou simular)

- [ ] Acessar aula com check-in habilitado
- [ ] Ver botão "Fazer Check-in"
- [ ] **Método Manual:**
  - [ ] Selecionar aba "Manual"
  - [ ] Adicionar observação
  - [ ] Confirmar check-in
- [ ] **Método Geolocalização:**
  - [ ] Selecionar aba "Localização"
  - [ ] Ver status do GeolocationChecker
  - [ ] Verificar se mostra distância da arena
  - [ ] Confirmar check-in (se dentro do raio)

#### E. Meus Agendamentos
- [ ] Criar novo agendamento avulso
- [ ] Editar agendamento futuro
- [ ] Cancelar agendamento

---

### 👨‍🏫 **PROFESSOR - Testes Prioritários**

#### A. Dashboard Professor
- [ ] Fazer login como professor
- [ ] Ver dashboard com estatísticas
- [ ] Ver próximas aulas
- [ ] Ver check-ins recentes
- [ ] Ver avaliações recebidas

#### B. Minhas Aulas
- [ ] Acessar "Minhas Aulas"
- [ ] Ver lista de aulas criadas
- [ ] Clicar em "Nova Aula"
- [ ] Criar aula nova (grupo ou individual)
- [ ] Editar aula futura
- [ ] Ver alunos inscritos
- [ ] Clicar em "Gerenciar Inscrições"

#### C. Gerenciar Inscrições
- [ ] Ver lista de alunos inscritos
- [ ] Ver status de pagamento
- [ ] Remover aluno da aula
- [ ] Confirmar que aluno foi removido

#### D. Meus Alunos
- [ ] Acessar "Meus Alunos"
- [ ] Ver lista de alunos vinculados
- [ ] Verificar vínculo criado pelo script
- [ ] Ver histórico com aluno

#### E. Marcar Presença
- [ ] Abrir aula realizada ou em andamento
- [ ] Clicar em "Marcar Presença"
- [ ] Ver lista de inscritos
- [ ] Marcar presença de cada aluno
- [ ] Confirmar e finalizar aula

#### F. Comissões
- [ ] Acessar "Comissões"
- [ ] Ver comissões geradas
- [ ] Filtrar por status (pendente/pago)
- [ ] Ver detalhes da comissão

---

### 🏢 **ARENA ADMIN - Testes Prioritários**

#### A. Dashboard Arena
- [ ] Fazer login como arena_admin
- [ ] Ver métricas gerais
- [ ] Ver agendamentos do dia
- [ ] Ver ocupação de quadras
- [ ] Ver vencimentos

#### B. Gestão de Professores
- [ ] Acessar "Professores"
- [ ] Ver lista de professores
- [ ] Clicar em "Detalhes" de um professor
- [ ] Ver alunos vinculados
- [ ] Clicar em "Vincular Aluno"
- [ ] Vincular novo aluno ao professor
- [ ] Verificar notificação de sucesso
- [ ] Ver vínculo na lista

#### C. Gestão de Aulas
- [ ] Acessar "Aulas"
- [ ] Ver todas as aulas
- [ ] Criar aula para um professor
- [ ] Editar aula
- [ ] Ver inscrições da aula
- [ ] Remover aluno de uma aula
- [ ] Cancelar aula

#### D. Configurações da Arena
- [ ] Acessar "Configurações"
- [ ] Verificar coordenadas da arena
- [ ] Alterar raio de check-in (ex: 50m, 100m, 200m)
- [ ] Alterar janela de check-in (ex: 15min, 30min, 60min)
- [ ] Salvar alterações
- [ ] Testar check-in com nova configuração

#### E. Financeiro
- [ ] Ver contratos ativos
- [ ] Ver mensalidades pendentes
- [ ] Gerar comissões de professores
- [ ] Ver relatório financeiro

#### F. Relatórios
- [ ] Relatório de agendamentos
- [ ] Relatório de professores
- [ ] Relatório de clientes
- [ ] Exportar para Excel/PDF

---

### 👑 **SUPER ADMIN - Testes Prioritários**

#### A. Dashboard Global
- [ ] Fazer login como super_admin
- [ ] Ver métricas de todas as arenas
- [ ] Filtrar por arena específica
- [ ] Ver gráficos de receita

#### B. Gestão de Arenas
- [ ] Acessar "Arenas"
- [ ] Ver lista de todas as arenas
- [ ] Editar arena
- [ ] Ver histórico de faturas
- [ ] Alterar plano da arena

#### C. Gestão de Planos e Módulos
- [ ] Acessar "Configurações Sistema"
- [ ] Ver planos sistema
- [ ] Ver módulos disponíveis
- [ ] Ativar/Desativar módulo

#### D. Financeiro Global
- [ ] Ver faturas de todas as arenas
- [ ] Ver assinaturas ativas
- [ ] Ver inadimplências

---

## 🔒 TESTES DE SEGURANÇA (RLS)

### Isolamento Multi-tenant
1. **Login como Arena Admin A:**
   - [ ] Não consegue ver dados da Arena B
   - [ ] Não consegue editar usuários da Arena B
   - [ ] Não consegue ver agendamentos da Arena B

2. **Login como Professor:**
   - [ ] Vê apenas suas próprias aulas
   - [ ] Vê apenas seus alunos vinculados
   - [ ] Não vê aulas de outros professores
   - [ ] Não vê comissões de outros professores

3. **Login como Aluno:**
   - [ ] Vê apenas seus agendamentos
   - [ ] Vê apenas suas aulas inscritas
   - [ ] Não vê dados de outros alunos
   - [ ] Não consegue acessar rotas de admin

### Permissões de Edição
1. **Aluno tenta:**
   - [ ] ✅ Criar agendamento próprio
   - [ ] ✅ Editar agendamento futuro confirmado
   - [ ] ❌ Editar agendamento passado
   - [ ] ❌ Editar agendamento de outro aluno
   - [ ] ❌ Deletar aula
   - [ ] ✅ Cancelar inscrição em aula (24h antes)

2. **Professor tenta:**
   - [ ] ✅ Criar aulas
   - [ ] ✅ Editar suas aulas
   - [ ] ❌ Editar aulas de outros professores
   - [ ] ✅ Remover aluno de sua aula
   - [ ] ❌ Ver comissões de outros professores

---

## 🧪 TESTES DE VALIDAÇÃO

### Validações de Aula
- [ ] **Vagas completas:** Tentar inscrever quando `max_alunos` atingido
- [ ] **Conflito de horário:** Aluno inscrito em 2 aulas no mesmo horário
- [ ] **Cancelamento:** Tentar cancelar com menos de 24h
- [ ] **Professor sem alunos vinculados:** Criar aula sem vínculos

### Validações de Check-in
- [ ] **Fora da janela:** Tentar check-in antes/depois da janela
- [ ] **Fora do raio:** Tentar check-in geolocalizado longe da arena
- [ ] **Sem coordenadas:** Arena sem lat/long configurados
- [ ] **Permissão negada:** Navegador bloqueia geolocalização

### Validações de Vínculo
- [ ] **Vínculo duplicado:** Tentar vincular mesmo aluno ao professor 2x
- [ ] **Desvincular:** Desvincular aluno e verificar que não aparece mais
- [ ] **Aluno de outra arena:** Tentar vincular aluno de arena diferente

---

## 📊 CONSULTAS ÚTEIS PARA VALIDAÇÃO

Execute no SQL Editor do Supabase:

```sql
-- Ver todos os vínculos professor-aluno
SELECT 
  pa.*,
  p.nome as professor_nome,
  u.nome_completo as aluno_nome
FROM professor_alunos pa
JOIN professores p ON p.id = pa.professor_id
JOIN usuarios u ON u.id = pa.aluno_id
WHERE pa.ativo = true;

-- Ver todas as inscrições em aulas
SELECT 
  aa.*,
  a.titulo as aula_titulo,
  a.data_aula,
  u.nome_completo as aluno_nome
FROM aulas_alunos aa
JOIN aulas a ON a.id = aa.aula_id
JOIN usuarios u ON u.id = aa.usuario_id
ORDER BY a.data_aula, a.hora_inicio;

-- Ver aulas futuras com inscrições
SELECT 
  a.titulo,
  a.data_aula,
  a.hora_inicio,
  a.max_alunos,
  COUNT(aa.id) as inscritos,
  a.max_alunos - COUNT(aa.id) as vagas_restantes
FROM aulas a
LEFT JOIN aulas_alunos aa ON aa.aula_id = a.id
WHERE a.data_aula >= CURRENT_DATE
GROUP BY a.id, a.titulo, a.data_aula, a.hora_inicio, a.max_alunos
ORDER BY a.data_aula, a.hora_inicio;

-- Ver notificações não lidas
SELECT * FROM notificacoes 
WHERE lida = false 
ORDER BY created_at DESC;

-- Ver coordenadas da arena
SELECT 
  nome,
  coordenadas_latitude,
  coordenadas_longitude,
  raio_checkin_metros,
  janela_checkin_minutos_antes,
  janela_checkin_minutos_depois
FROM arenas 
WHERE status = 'ativo';
```

---

## ✅ CHECKLIST FINAL

Após executar todos os testes:

- [ ] Vínculos professor-aluno funcionando
- [ ] Inscrições em aulas funcionando
- [ ] Cancelamento de inscrição validado
- [ ] Check-in manual funcionando
- [ ] Check-in por geolocalização funcionando
- [ ] GeolocationChecker mostrando distância
- [ ] Notificações sendo criadas
- [ ] RLS isolando dados por tenant
- [ ] Permissões de edição validadas
- [ ] Templates de notificação aplicados
- [ ] Validações de vagas funcionando
- [ ] Validações de horário funcionando

---

## 🚨 PROBLEMAS ENCONTRADOS

Anote aqui qualquer problema encontrado durante os testes:

1. **Problema:**
   - Descrição:
   - Role:
   - Passos para reproduzir:

2. **Problema:**
   - Descrição:
   - Role:
   - Passos para reproduzir:

---

## 📈 PRÓXIMOS PASSOS

Após validar tudo:
1. ✅ Marcar como testado
2. 🐛 Corrigir bugs encontrados
3. 📝 Documentar fluxos validados
4. 🚀 Preparar para produção
