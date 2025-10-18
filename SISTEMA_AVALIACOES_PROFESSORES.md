# Sistema de Avaliações de Professores

## Visão Geral

O sistema de avaliações permite que alunos avaliem professores após participarem de aulas, e que arena admins gerenciem essas avaliações.

## Estrutura do Banco de Dados

### 1. Tabela `professores`
Armazena dados agregados de avaliações:
- `avaliacao_media` (numeric): Média das avaliações (0-5)
- `total_avaliacoes` (integer): Total de avaliações recebidas

### 2. Tabela `aulas_alunos`
Registra avaliações de alunos após cada aula:
- `avaliacao` (integer): Nota de 1-5 estrelas
- `comentario_avaliacao` (text): Comentário opcional do aluno
- `aula_id`: Referência à aula
- `usuario_id`: Referência ao aluno que avaliou

### 3. Tabela `avaliacoes`
Tabela genérica para avaliações (opcional, para casos especiais):
- `tipo`: Tipo de avaliação (professor, quadra, etc)
- `nota`: Nota de 1-5
- `comentario`: Comentário
- `avaliado_id`: ID do professor avaliado
- `usuario_id`: ID do usuário que avaliou
- `referencia_id`: ID da aula relacionada

## Fluxo de Avaliação

### Para Alunos:
1. **Após a aula**: Aluno participa da aula
2. **Finalização**: Professor finaliza a aula e registra presença
3. **Avaliação**: Aluno pode avaliar o professor (nota + comentário opcional)
4. **Registro**: Avaliação salva em `aulas_alunos`

### Para Arena Admin:
1. **Visualização**: Ver todas as avaliações em relatórios
2. **Gerenciamento**: Pode ver detalhes, aprovar ou remover avaliações inapropriadas
3. **Análise**: Acompanhar evolução do professor ao longo do tempo

## Como Arena Admin Gerencia Avaliações

### 1. Via Relatório de Professores
- **Caminho**: Menu → Relatórios → Professores
- **Função**: Visualizar média geral e total de avaliações
- **Ação**: Clicar em "Ver Avaliações" para detalhes

### 2. Via Página de Comissões
- **Caminho**: Menu → Comissões → Aba "Avaliações"
- **Função**: Ver todas as avaliações detalhadas
- **Ações disponíveis**:
  - Visualizar todas as avaliações de cada professor
  - Ver comentários dos alunos
  - Filtrar por período
  - Remover avaliações inapropriadas (se necessário)

### 3. Via Página de Aulas
- **Caminho**: Menu → Aulas → Ver Detalhes da Aula
- **Função**: Ver avaliações específicas daquela aula
- **Ação**: Verificar feedback dos alunos sobre aulas específicas

## Cálculo da Média

A média de avaliação é calculada automaticamente:
```sql
AVG(avaliacao) FROM aulas_alunos WHERE aula_id IN (
  SELECT id FROM aulas WHERE professor_id = [professor_id]
) AND avaliacao IS NOT NULL
```

## Permissões (RLS)

### Tabela `aulas_alunos`:
- **Alunos**: Podem criar e atualizar suas próprias avaliações
- **Professores**: Podem visualizar avaliações das suas aulas
- **Arena Staff**: Podem ver e gerenciar todas as avaliações
- **Super Admin**: Acesso total

### Tabela `avaliacoes`:
- **Usuários**: Podem criar, atualizar e deletar suas próprias avaliações
- **Arena Staff**: Podem gerenciar todas as avaliações da arena
- **Super Admin**: Acesso total

## Interfaces Criadas

### 1. `AvaliacoesProfessoresTable.tsx`
Componente para arena admin gerenciar avaliações:
- Lista todas as avaliações por professor
- Filtros por professor, período, nota
- Visualização de comentários
- Estatísticas agregadas

### 2. Integração em `AulaPresencaDialog.tsx`
Permite alunos avaliarem após a aula:
- Campo de estrelas (1-5)
- Campo de comentário opcional
- Salva em `aulas_alunos`

### 3. Tab "Avaliações" em Comissões
Nova aba na página de comissões:
- Acesso rápido às avaliações
- Visão consolidada por professor
- Métricas e tendências

## Exemplo de Uso (Arena Admin)

1. **Acessar Comissões**: Menu → Comissões
2. **Aba Avaliações**: Clicar na aba "Avaliações"
3. **Selecionar Professor**: Filtrar por professor específico
4. **Ver Detalhes**: Ver todas as notas e comentários
5. **Ações**: 
   - Exportar relatório
   - Remover avaliação inapropriada
   - Ver evolução temporal

## Automações

### Atualização Automática da Média:
Quando uma nova avaliação é criada em `aulas_alunos`, um trigger atualiza automaticamente os campos `avaliacao_media` e `total_avaliacoes` na tabela `professores`.

### Notificações:
- Professor recebe notificação ao receber nova avaliação
- Arena admin pode configurar alertas para avaliações baixas (< 3 estrelas)

## Próximos Passos

1. ✅ Criar interface de gerenciamento para arena admin
2. ✅ Adicionar avaliação no fluxo de finalização de aulas
3. 🔄 Criar trigger para atualizar média automaticamente
4. 🔄 Adicionar notificações de novas avaliações
5. 🔄 Criar dashboard de evolução de avaliações por professor
