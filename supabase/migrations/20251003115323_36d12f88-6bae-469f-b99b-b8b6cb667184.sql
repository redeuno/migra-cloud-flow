-- =====================================================
-- VERANA BEACH TENNIS - MIGRAÇÃO AJUSTADA
-- Criar apenas ENUMs e tabelas que não existem
-- =====================================================

-- ==================== NOVOS ENUMs (que não existem) ====================

-- Role system (separado para segurança)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM (
    'super_admin',
    'arena_admin', 
    'funcionario',
    'professor',
    'aluno'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tipos de aula
DO $$ BEGIN
  CREATE TYPE public.tipo_aula AS ENUM (
    'individual',
    'grupo',
    'clinica',
    'curso'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Status de aula
DO $$ BEGIN
  CREATE TYPE public.status_aula AS ENUM (
    'agendada',
    'confirmada',
    'realizada',
    'cancelada',
    'remarcada'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tipos de contrato
DO $$ BEGIN
  CREATE TYPE public.tipo_contrato AS ENUM (
    'mensal',
    'trimestral',
    'semestral',
    'anual'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Status de contrato
DO $$ BEGIN
  CREATE TYPE public.status_contrato AS ENUM (
    'ativo',
    'suspenso',
    'cancelado',
    'finalizado'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tipos de movimentação financeira
DO $$ BEGIN
  CREATE TYPE public.tipo_movimentacao AS ENUM (
    'receita',
    'despesa',
    'transferencia'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Categorias financeiras
DO $$ BEGIN
  CREATE TYPE public.categoria_financeira AS ENUM (
    'mensalidade',
    'agendamento',
    'aula',
    'torneio',
    'evento',
    'equipamento',
    'manutencao',
    'salario',
    'outros'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Status de torneio
DO $$ BEGIN
  CREATE TYPE public.status_torneio AS ENUM (
    'planejamento',
    'inscricoes_abertas',
    'em_andamento',
    'finalizado',
    'cancelado'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tipos de chaveamento
DO $$ BEGIN
  CREATE TYPE public.tipo_chaveamento AS ENUM (
    'eliminacao_simples',
    'eliminacao_dupla',
    'round_robin',
    'suico'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ==================== TABELA DE ROLES (CRÍTICA PARA SEGURANÇA) ====================

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  arena_id UUID REFERENCES public.arenas(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, role, arena_id)
);

-- ==================== TABELAS CORE ====================

-- Professores
CREATE TABLE IF NOT EXISTS public.professores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  arena_id UUID NOT NULL REFERENCES public.arenas(id) ON DELETE CASCADE,
  especialidades JSONB DEFAULT '[]'::jsonb,
  valor_hora_aula DECIMAL(10,2) NOT NULL,
  disponibilidade JSONB NOT NULL DEFAULT '{}'::jsonb,
  registro_profissional VARCHAR(50),
  biografia TEXT,
  foto_url TEXT,
  avaliacao_media DECIMAL(3,2) DEFAULT 0,
  total_avaliacoes INTEGER DEFAULT 0,
  status status_geral DEFAULT 'ativo',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Funcionários
CREATE TABLE IF NOT EXISTS public.funcionarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  arena_id UUID NOT NULL REFERENCES public.arenas(id) ON DELETE CASCADE,
  cargo VARCHAR(100) NOT NULL,
  salario DECIMAL(10,2),
  data_admissao DATE NOT NULL,
  data_demissao DATE,
  horario_trabalho JSONB NOT NULL DEFAULT '{}'::jsonb,
  permissoes JSONB DEFAULT '[]'::jsonb,
  status status_geral DEFAULT 'ativo',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Aulas
CREATE TABLE IF NOT EXISTS public.aulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id UUID NOT NULL REFERENCES public.arenas(id) ON DELETE CASCADE,
  professor_id UUID NOT NULL REFERENCES public.professores(id) ON DELETE RESTRICT,
  quadra_id UUID REFERENCES public.quadras(id) ON DELETE SET NULL,
  tipo_aula tipo_aula NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  descricao TEXT,
  data_aula DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  duracao_minutos INTEGER NOT NULL,
  max_alunos INTEGER NOT NULL DEFAULT 1,
  valor_por_aluno DECIMAL(10,2) NOT NULL,
  nivel VARCHAR(50),
  observacoes TEXT,
  status status_aula DEFAULT 'agendada',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Alunos das Aulas
CREATE TABLE IF NOT EXISTS public.aulas_alunos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aula_id UUID NOT NULL REFERENCES public.aulas(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  valor_pago DECIMAL(10,2) NOT NULL,
  status_pagamento status_pagamento DEFAULT 'pendente',
  data_pagamento TIMESTAMPTZ,
  forma_pagamento forma_pagamento,
  presenca BOOLEAN DEFAULT false,
  data_checkin TIMESTAMPTZ,
  avaliacao INTEGER CHECK (avaliacao >= 1 AND avaliacao <= 5),
  comentario_avaliacao TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(aula_id, usuario_id)
);

-- Contratos
CREATE TABLE IF NOT EXISTS public.contratos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id UUID NOT NULL REFERENCES public.arenas(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT,
  tipo_contrato tipo_contrato NOT NULL,
  valor_mensal DECIMAL(10,2) NOT NULL,
  dia_vencimento INTEGER NOT NULL CHECK (dia_vencimento >= 1 AND dia_vencimento <= 31),
  data_inicio DATE NOT NULL,
  data_fim DATE,
  descricao TEXT,
  beneficios JSONB DEFAULT '[]'::jsonb,
  observacoes TEXT,
  status status_contrato DEFAULT 'ativo',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Mensalidades
CREATE TABLE IF NOT EXISTS public.mensalidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES public.contratos(id) ON DELETE CASCADE,
  referencia DATE NOT NULL,
  data_vencimento DATE NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  desconto DECIMAL(10,2) DEFAULT 0,
  acrescimo DECIMAL(10,2) DEFAULT 0,
  valor_final DECIMAL(10,2) NOT NULL,
  data_pagamento TIMESTAMPTZ,
  forma_pagamento forma_pagamento,
  status_pagamento status_pagamento DEFAULT 'pendente',
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(contrato_id, referencia)
);

-- Movimentações Financeiras
CREATE TABLE IF NOT EXISTS public.movimentacoes_financeiras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id UUID NOT NULL REFERENCES public.arenas(id) ON DELETE CASCADE,
  tipo tipo_movimentacao NOT NULL,
  categoria categoria_financeira NOT NULL,
  descricao TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  data_movimentacao DATE NOT NULL,
  forma_pagamento forma_pagamento,
  referencia_id UUID,
  referencia_tipo VARCHAR(50),
  usuario_id UUID REFERENCES public.usuarios(id),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Torneios
CREATE TABLE IF NOT EXISTS public.torneios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id UUID NOT NULL REFERENCES public.arenas(id) ON DELETE CASCADE,
  nome VARCHAR(200) NOT NULL,
  descricao TEXT,
  modalidade tipo_esporte NOT NULL,
  tipo_chaveamento tipo_chaveamento NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  data_inicio_inscricoes DATE NOT NULL,
  data_fim_inscricoes DATE NOT NULL,
  max_participantes INTEGER,
  valor_inscricao DECIMAL(10,2) DEFAULT 0,
  premiacao JSONB DEFAULT '{}'::jsonb,
  regulamento TEXT,
  imagem_url TEXT,
  status status_torneio DEFAULT 'planejamento',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inscrições em Torneios
CREATE TABLE IF NOT EXISTS public.torneios_inscricoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  torneio_id UUID NOT NULL REFERENCES public.torneios(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  parceiro_id UUID REFERENCES public.usuarios(id),
  valor_pago DECIMAL(10,2) NOT NULL,
  status_pagamento status_pagamento DEFAULT 'pendente',
  data_pagamento TIMESTAMPTZ,
  forma_pagamento forma_pagamento,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(torneio_id, usuario_id, parceiro_id)
);

-- Jogos de Torneios
CREATE TABLE IF NOT EXISTS public.torneios_jogos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  torneio_id UUID NOT NULL REFERENCES public.torneios(id) ON DELETE CASCADE,
  quadra_id UUID REFERENCES public.quadras(id),
  fase VARCHAR(50) NOT NULL,
  numero_jogo INTEGER NOT NULL,
  dupla1_jogador1_id UUID REFERENCES public.usuarios(id),
  dupla1_jogador2_id UUID REFERENCES public.usuarios(id),
  dupla2_jogador1_id UUID REFERENCES public.usuarios(id),
  dupla2_jogador2_id UUID REFERENCES public.usuarios(id),
  data_jogo DATE,
  hora_inicio TIME,
  placar_dupla1 INTEGER,
  placar_dupla2 INTEGER,
  vencedor INTEGER CHECK (vencedor IN (1, 2)),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Módulos do Sistema
CREATE TABLE IF NOT EXISTS public.modulos_sistema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL UNIQUE,
  descricao TEXT,
  slug VARCHAR(50) NOT NULL UNIQUE,
  icone VARCHAR(50),
  ordem INTEGER NOT NULL,
  dependencias JSONB DEFAULT '[]'::jsonb,
  status status_geral DEFAULT 'ativo',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Módulos por Arena
CREATE TABLE IF NOT EXISTS public.arena_modulos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id UUID NOT NULL REFERENCES public.arenas(id) ON DELETE CASCADE,
  modulo_id UUID NOT NULL REFERENCES public.modulos_sistema(id) ON DELETE CASCADE,
  ativo BOOLEAN DEFAULT true,
  data_ativacao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_expiracao DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(arena_id, modulo_id)
);

-- Bloqueios de Quadra
CREATE TABLE IF NOT EXISTS public.bloqueios_quadra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quadra_id UUID NOT NULL REFERENCES public.quadras(id) ON DELETE CASCADE,
  data_inicio TIMESTAMPTZ NOT NULL,
  data_fim TIMESTAMPTZ NOT NULL,
  motivo TEXT NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  criado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Avaliações
CREATE TABLE IF NOT EXISTS public.avaliacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id UUID NOT NULL REFERENCES public.arenas(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  avaliado_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL,
  referencia_id UUID,
  nota INTEGER NOT NULL CHECK (nota >= 1 AND nota <= 5),
  comentario TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==================== FUNÇÃO SECURITY DEFINER ====================

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- ==================== RLS POLICIES ====================

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aulas_alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensalidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.torneios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.torneios_inscricoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.torneios_jogos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modulos_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arena_modulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bloqueios_quadra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;

-- Policies para user_roles
CREATE POLICY "Super admins can manage all roles" ON public.user_roles
FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Arena admins can view arena roles" ON public.user_roles
FOR SELECT USING (
  public.has_role(auth.uid(), 'arena_admin') AND
  arena_id IN (SELECT arena_id FROM public.user_roles WHERE user_id = auth.uid())
);

-- Policies tenant isolation para novas tabelas
CREATE POLICY "Tenant isolation" ON public.professores FOR ALL USING (
  arena_id IN (SELECT arena_id FROM public.user_roles WHERE user_id = auth.uid())
);

CREATE POLICY "Tenant isolation" ON public.funcionarios FOR ALL USING (
  arena_id IN (SELECT arena_id FROM public.user_roles WHERE user_id = auth.uid())
);

CREATE POLICY "Tenant isolation" ON public.aulas FOR ALL USING (
  arena_id IN (SELECT arena_id FROM public.user_roles WHERE user_id = auth.uid())
);

CREATE POLICY "Tenant isolation" ON public.contratos FOR ALL USING (
  arena_id IN (SELECT arena_id FROM public.user_roles WHERE user_id = auth.uid())
);

CREATE POLICY "Tenant isolation" ON public.movimentacoes_financeiras FOR ALL USING (
  arena_id IN (SELECT arena_id FROM public.user_roles WHERE user_id = auth.uid())
);

CREATE POLICY "Tenant isolation" ON public.torneios FOR ALL USING (
  arena_id IN (SELECT arena_id FROM public.user_roles WHERE user_id = auth.uid())
);

CREATE POLICY "Arena admins manage modulos" ON public.arena_modulos FOR ALL USING (
  arena_id IN (SELECT arena_id FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'arena_admin'))
);

CREATE POLICY "Tenant isolation" ON public.bloqueios_quadra FOR ALL USING (
  quadra_id IN (SELECT id FROM public.quadras WHERE arena_id IN (SELECT arena_id FROM public.user_roles WHERE user_id = auth.uid()))
);

CREATE POLICY "Tenant isolation" ON public.avaliacoes FOR ALL USING (
  arena_id IN (SELECT arena_id FROM public.user_roles WHERE user_id = auth.uid())
);

-- ==================== ÍNDICES ====================

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_arena_id ON public.user_roles(arena_id);
CREATE INDEX IF NOT EXISTS idx_professores_arena_id ON public.professores(arena_id);
CREATE INDEX IF NOT EXISTS idx_funcionarios_arena_id ON public.funcionarios(arena_id);
CREATE INDEX IF NOT EXISTS idx_aulas_arena_id ON public.aulas(arena_id);
CREATE INDEX IF NOT EXISTS idx_aulas_professor_id ON public.aulas(professor_id);
CREATE INDEX IF NOT EXISTS idx_aulas_data ON public.aulas(data_aula);
CREATE INDEX IF NOT EXISTS idx_contratos_arena_id ON public.contratos(arena_id);
CREATE INDEX IF NOT EXISTS idx_contratos_usuario_id ON public.contratos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_mensalidades_contrato_id ON public.mensalidades(contrato_id);
CREATE INDEX IF NOT EXISTS idx_mensalidades_vencimento ON public.mensalidades(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_arena_id ON public.movimentacoes_financeiras(arena_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_data ON public.movimentacoes_financeiras(data_movimentacao);
CREATE INDEX IF NOT EXISTS idx_torneios_arena_id ON public.torneios(arena_id);
CREATE INDEX IF NOT EXISTS idx_arena_modulos_arena_id ON public.arena_modulos(arena_id);