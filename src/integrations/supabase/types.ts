export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agendamentos: {
        Row: {
          agendamento_pai_id: string | null
          arena_id: string | null
          checkin_aberto_em: string | null
          checkin_fechado_em: string | null
          checkin_realizado: boolean | null
          cliente_id: string | null
          created_at: string | null
          criado_por_id: string | null
          data_agendamento: string
          data_checkin: string | null
          desconto_aplicado: number | null
          e_recorrente: boolean | null
          hora_fim: string
          hora_inicio: string
          id: string
          lembrete_enviado: boolean | null
          max_participantes: number | null
          modalidade: Database["public"]["Enums"]["tipo_esporte"]
          notificacoes_enviadas: Json | null
          observacoes: string | null
          observacoes_internas: string | null
          participantes: Json | null
          permite_checkin: boolean | null
          quadra_id: string | null
          recorrencia_config: Json | null
          status: Database["public"]["Enums"]["status_agendamento"]
          status_pagamento: Database["public"]["Enums"]["status_pagamento"]
          tipo_agendamento: string
          updated_at: string | null
          valor_por_pessoa: number | null
          valor_total: number
        }
        Insert: {
          agendamento_pai_id?: string | null
          arena_id?: string | null
          checkin_aberto_em?: string | null
          checkin_fechado_em?: string | null
          checkin_realizado?: boolean | null
          cliente_id?: string | null
          created_at?: string | null
          criado_por_id?: string | null
          data_agendamento: string
          data_checkin?: string | null
          desconto_aplicado?: number | null
          e_recorrente?: boolean | null
          hora_fim: string
          hora_inicio: string
          id?: string
          lembrete_enviado?: boolean | null
          max_participantes?: number | null
          modalidade: Database["public"]["Enums"]["tipo_esporte"]
          notificacoes_enviadas?: Json | null
          observacoes?: string | null
          observacoes_internas?: string | null
          participantes?: Json | null
          permite_checkin?: boolean | null
          quadra_id?: string | null
          recorrencia_config?: Json | null
          status?: Database["public"]["Enums"]["status_agendamento"]
          status_pagamento?: Database["public"]["Enums"]["status_pagamento"]
          tipo_agendamento?: string
          updated_at?: string | null
          valor_por_pessoa?: number | null
          valor_total?: number
        }
        Update: {
          agendamento_pai_id?: string | null
          arena_id?: string | null
          checkin_aberto_em?: string | null
          checkin_fechado_em?: string | null
          checkin_realizado?: boolean | null
          cliente_id?: string | null
          created_at?: string | null
          criado_por_id?: string | null
          data_agendamento?: string
          data_checkin?: string | null
          desconto_aplicado?: number | null
          e_recorrente?: boolean | null
          hora_fim?: string
          hora_inicio?: string
          id?: string
          lembrete_enviado?: boolean | null
          max_participantes?: number | null
          modalidade?: Database["public"]["Enums"]["tipo_esporte"]
          notificacoes_enviadas?: Json | null
          observacoes?: string | null
          observacoes_internas?: string | null
          participantes?: Json | null
          permite_checkin?: boolean | null
          quadra_id?: string | null
          recorrencia_config?: Json | null
          status?: Database["public"]["Enums"]["status_agendamento"]
          status_pagamento?: Database["public"]["Enums"]["status_pagamento"]
          tipo_agendamento?: string
          updated_at?: string | null
          valor_por_pessoa?: number | null
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_agendamento_pai_id_fkey"
            columns: ["agendamento_pai_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_arena_id_fkey"
            columns: ["arena_id"]
            isOneToOne: false
            referencedRelation: "arenas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_criado_por_id_fkey"
            columns: ["criado_por_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_quadra_id_fkey"
            columns: ["quadra_id"]
            isOneToOne: false
            referencedRelation: "quadras"
            referencedColumns: ["id"]
          },
        ]
      }
      arena_modulos: {
        Row: {
          arena_id: string
          ativo: boolean | null
          created_at: string | null
          data_ativacao: string
          data_expiracao: string | null
          id: string
          modulo_id: string
          updated_at: string | null
        }
        Insert: {
          arena_id: string
          ativo?: boolean | null
          created_at?: string | null
          data_ativacao?: string
          data_expiracao?: string | null
          id?: string
          modulo_id: string
          updated_at?: string | null
        }
        Update: {
          arena_id?: string
          ativo?: boolean | null
          created_at?: string | null
          data_ativacao?: string
          data_expiracao?: string | null
          id?: string
          modulo_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "arena_modulos_arena_id_fkey"
            columns: ["arena_id"]
            isOneToOne: false
            referencedRelation: "arenas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arena_modulos_modulo_id_fkey"
            columns: ["modulo_id"]
            isOneToOne: false
            referencedRelation: "modulos_sistema"
            referencedColumns: ["id"]
          },
        ]
      }
      arenas: {
        Row: {
          cnpj: string
          configuracoes: Json | null
          coordenadas_latitude: number | null
          coordenadas_longitude: number | null
          cores_tema: Json | null
          created_at: string | null
          data_vencimento: string
          email: string
          endereco_completo: Json
          horario_funcionamento: Json
          id: string
          janela_checkin_minutos_antes: number | null
          janela_checkin_minutos_depois: number | null
          logo_url: string | null
          nome: string
          plano_sistema_id: string | null
          raio_checkin_metros: number | null
          razao_social: string
          status: Database["public"]["Enums"]["status_geral"]
          telefone: string
          tenant_id: string
          updated_at: string | null
          whatsapp: string
        }
        Insert: {
          cnpj: string
          configuracoes?: Json | null
          coordenadas_latitude?: number | null
          coordenadas_longitude?: number | null
          cores_tema?: Json | null
          created_at?: string | null
          data_vencimento: string
          email: string
          endereco_completo: Json
          horario_funcionamento: Json
          id?: string
          janela_checkin_minutos_antes?: number | null
          janela_checkin_minutos_depois?: number | null
          logo_url?: string | null
          nome: string
          plano_sistema_id?: string | null
          raio_checkin_metros?: number | null
          razao_social: string
          status?: Database["public"]["Enums"]["status_geral"]
          telefone: string
          tenant_id: string
          updated_at?: string | null
          whatsapp: string
        }
        Update: {
          cnpj?: string
          configuracoes?: Json | null
          coordenadas_latitude?: number | null
          coordenadas_longitude?: number | null
          cores_tema?: Json | null
          created_at?: string | null
          data_vencimento?: string
          email?: string
          endereco_completo?: Json
          horario_funcionamento?: Json
          id?: string
          janela_checkin_minutos_antes?: number | null
          janela_checkin_minutos_depois?: number | null
          logo_url?: string | null
          nome?: string
          plano_sistema_id?: string | null
          raio_checkin_metros?: number | null
          razao_social?: string
          status?: Database["public"]["Enums"]["status_geral"]
          telefone?: string
          tenant_id?: string
          updated_at?: string | null
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "arenas_plano_sistema_id_fkey"
            columns: ["plano_sistema_id"]
            isOneToOne: false
            referencedRelation: "planos_sistema"
            referencedColumns: ["id"]
          },
        ]
      }
      assinaturas_arena: {
        Row: {
          arena_id: string
          asaas_customer_id: string | null
          asaas_subscription_id: string | null
          created_at: string | null
          data_fim: string | null
          data_inicio: string
          dia_vencimento: number
          id: string
          numero_assinatura: string
          plano_sistema_id: string | null
          status: Database["public"]["Enums"]["status_contrato"]
          updated_at: string | null
          valor_mensal: number
        }
        Insert: {
          arena_id: string
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio: string
          dia_vencimento?: number
          id?: string
          numero_assinatura: string
          plano_sistema_id?: string | null
          status?: Database["public"]["Enums"]["status_contrato"]
          updated_at?: string | null
          valor_mensal: number
        }
        Update: {
          arena_id?: string
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string
          dia_vencimento?: number
          id?: string
          numero_assinatura?: string
          plano_sistema_id?: string | null
          status?: Database["public"]["Enums"]["status_contrato"]
          updated_at?: string | null
          valor_mensal?: number
        }
        Relationships: [
          {
            foreignKeyName: "assinaturas_arena_arena_id_fkey"
            columns: ["arena_id"]
            isOneToOne: false
            referencedRelation: "arenas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinaturas_arena_plano_sistema_id_fkey"
            columns: ["plano_sistema_id"]
            isOneToOne: false
            referencedRelation: "planos_sistema"
            referencedColumns: ["id"]
          },
        ]
      }
      aulas: {
        Row: {
          agendamento_id: string | null
          arena_id: string
          checkin_config: Json | null
          checkin_habilitado: boolean | null
          conteudo_programatico: string | null
          created_at: string | null
          data_aula: string
          data_realizacao: string | null
          descricao: string | null
          duracao_minutos: number
          hora_fim: string
          hora_inicio: string
          id: string
          material_necessario: string | null
          max_alunos: number
          min_alunos: number | null
          nivel: string | null
          objetivos: string | null
          observacoes: string | null
          presencas: Json | null
          professor_id: string
          quadra_id: string | null
          realizada: boolean | null
          status: Database["public"]["Enums"]["status_aula"] | null
          tipo_aula: Database["public"]["Enums"]["tipo_aula"]
          titulo: string
          updated_at: string | null
          valor_por_aluno: number
        }
        Insert: {
          agendamento_id?: string | null
          arena_id: string
          checkin_config?: Json | null
          checkin_habilitado?: boolean | null
          conteudo_programatico?: string | null
          created_at?: string | null
          data_aula: string
          data_realizacao?: string | null
          descricao?: string | null
          duracao_minutos: number
          hora_fim: string
          hora_inicio: string
          id?: string
          material_necessario?: string | null
          max_alunos?: number
          min_alunos?: number | null
          nivel?: string | null
          objetivos?: string | null
          observacoes?: string | null
          presencas?: Json | null
          professor_id: string
          quadra_id?: string | null
          realizada?: boolean | null
          status?: Database["public"]["Enums"]["status_aula"] | null
          tipo_aula: Database["public"]["Enums"]["tipo_aula"]
          titulo: string
          updated_at?: string | null
          valor_por_aluno: number
        }
        Update: {
          agendamento_id?: string | null
          arena_id?: string
          checkin_config?: Json | null
          checkin_habilitado?: boolean | null
          conteudo_programatico?: string | null
          created_at?: string | null
          data_aula?: string
          data_realizacao?: string | null
          descricao?: string | null
          duracao_minutos?: number
          hora_fim?: string
          hora_inicio?: string
          id?: string
          material_necessario?: string | null
          max_alunos?: number
          min_alunos?: number | null
          nivel?: string | null
          objetivos?: string | null
          observacoes?: string | null
          presencas?: Json | null
          professor_id?: string
          quadra_id?: string | null
          realizada?: boolean | null
          status?: Database["public"]["Enums"]["status_aula"] | null
          tipo_aula?: Database["public"]["Enums"]["tipo_aula"]
          titulo?: string
          updated_at?: string | null
          valor_por_aluno?: number
        }
        Relationships: [
          {
            foreignKeyName: "aulas_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aulas_arena_id_fkey"
            columns: ["arena_id"]
            isOneToOne: false
            referencedRelation: "arenas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aulas_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aulas_quadra_id_fkey"
            columns: ["quadra_id"]
            isOneToOne: false
            referencedRelation: "quadras"
            referencedColumns: ["id"]
          },
        ]
      }
      aulas_alunos: {
        Row: {
          aula_id: string
          avaliacao: number | null
          comentario_avaliacao: string | null
          created_at: string | null
          data_checkin: string | null
          data_pagamento: string | null
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"] | null
          id: string
          presenca: boolean | null
          status_pagamento:
            | Database["public"]["Enums"]["status_pagamento"]
            | null
          updated_at: string | null
          usuario_id: string
          valor_pago: number
        }
        Insert: {
          aula_id: string
          avaliacao?: number | null
          comentario_avaliacao?: string | null
          created_at?: string | null
          data_checkin?: string | null
          data_pagamento?: string | null
          forma_pagamento?:
            | Database["public"]["Enums"]["forma_pagamento"]
            | null
          id?: string
          presenca?: boolean | null
          status_pagamento?:
            | Database["public"]["Enums"]["status_pagamento"]
            | null
          updated_at?: string | null
          usuario_id: string
          valor_pago: number
        }
        Update: {
          aula_id?: string
          avaliacao?: number | null
          comentario_avaliacao?: string | null
          created_at?: string | null
          data_checkin?: string | null
          data_pagamento?: string | null
          forma_pagamento?:
            | Database["public"]["Enums"]["forma_pagamento"]
            | null
          id?: string
          presenca?: boolean | null
          status_pagamento?:
            | Database["public"]["Enums"]["status_pagamento"]
            | null
          updated_at?: string | null
          usuario_id?: string
          valor_pago?: number
        }
        Relationships: [
          {
            foreignKeyName: "aulas_alunos_aula_id_fkey"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "aulas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aulas_alunos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      avaliacoes: {
        Row: {
          arena_id: string
          avaliado_id: string
          comentario: string | null
          created_at: string | null
          id: string
          nota: number
          referencia_id: string | null
          tipo: string
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          arena_id: string
          avaliado_id: string
          comentario?: string | null
          created_at?: string | null
          id?: string
          nota: number
          referencia_id?: string | null
          tipo: string
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          arena_id?: string
          avaliado_id?: string
          comentario?: string | null
          created_at?: string | null
          id?: string
          nota?: number
          referencia_id?: string | null
          tipo?: string
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_arena_id_fkey"
            columns: ["arena_id"]
            isOneToOne: false
            referencedRelation: "arenas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_avaliado_id_fkey"
            columns: ["avaliado_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      bloqueios_quadra: {
        Row: {
          created_at: string | null
          criado_por: string | null
          data_fim: string
          data_inicio: string
          id: string
          motivo: string
          quadra_id: string
          tipo: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          criado_por?: string | null
          data_fim: string
          data_inicio: string
          id?: string
          motivo: string
          quadra_id: string
          tipo: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          criado_por?: string | null
          data_fim?: string
          data_inicio?: string
          id?: string
          motivo?: string
          quadra_id?: string
          tipo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bloqueios_quadra_quadra_id_fkey"
            columns: ["quadra_id"]
            isOneToOne: false
            referencedRelation: "quadras"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias_financeiras: {
        Row: {
          ativo: boolean | null
          cor: string | null
          created_at: string | null
          icone: string | null
          id: string
          nome: string
          ordem: number
          tipo: Database["public"]["Enums"]["tipo_movimentacao"]
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          cor?: string | null
          created_at?: string | null
          icone?: string | null
          id?: string
          nome: string
          ordem: number
          tipo: Database["public"]["Enums"]["tipo_movimentacao"]
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          cor?: string | null
          created_at?: string | null
          icone?: string | null
          id?: string
          nome?: string
          ordem?: number
          tipo?: Database["public"]["Enums"]["tipo_movimentacao"]
          updated_at?: string | null
        }
        Relationships: []
      }
      checkins: {
        Row: {
          agendamento_id: string | null
          created_at: string | null
          data_checkin: string
          id: string
          observacoes: string | null
          tipo_checkin: string
          usuario_id: string | null
        }
        Insert: {
          agendamento_id?: string | null
          created_at?: string | null
          data_checkin?: string
          id?: string
          observacoes?: string | null
          tipo_checkin?: string
          usuario_id?: string | null
        }
        Update: {
          agendamento_id?: string | null
          created_at?: string | null
          data_checkin?: string
          id?: string
          observacoes?: string | null
          tipo_checkin?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkins_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      comissoes_professores: {
        Row: {
          arena_id: string
          aula_id: string | null
          created_at: string | null
          data_pagamento: string | null
          id: string
          metadata: Json | null
          observacoes: string | null
          percentual_comissao: number
          professor_id: string
          referencia: string
          status: string
          updated_at: string | null
          valor_aulas: number
          valor_comissao: number
        }
        Insert: {
          arena_id: string
          aula_id?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          id?: string
          metadata?: Json | null
          observacoes?: string | null
          percentual_comissao?: number
          professor_id: string
          referencia: string
          status?: string
          updated_at?: string | null
          valor_aulas?: number
          valor_comissao?: number
        }
        Update: {
          arena_id?: string
          aula_id?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          id?: string
          metadata?: Json | null
          observacoes?: string | null
          percentual_comissao?: number
          professor_id?: string
          referencia?: string
          status?: string
          updated_at?: string | null
          valor_aulas?: number
          valor_comissao?: number
        }
        Relationships: [
          {
            foreignKeyName: "comissoes_professores_arena_id_fkey"
            columns: ["arena_id"]
            isOneToOne: false
            referencedRelation: "arenas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_professores_aula_id_fkey"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "aulas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_professores_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professores"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes_arena: {
        Row: {
          arena_id: string
          created_at: string | null
          email_remetente: string | null
          evolution_api_enabled: boolean | null
          evolution_api_key: string | null
          evolution_api_url: string | null
          evolution_instance_name: string | null
          id: string
          notificacoes_email_enabled: boolean | null
          notificacoes_whatsapp_enabled: boolean | null
          template_confirmacao_pagamento: string | null
          template_lembrete_pagamento: string | null
          updated_at: string | null
        }
        Insert: {
          arena_id: string
          created_at?: string | null
          email_remetente?: string | null
          evolution_api_enabled?: boolean | null
          evolution_api_key?: string | null
          evolution_api_url?: string | null
          evolution_instance_name?: string | null
          id?: string
          notificacoes_email_enabled?: boolean | null
          notificacoes_whatsapp_enabled?: boolean | null
          template_confirmacao_pagamento?: string | null
          template_lembrete_pagamento?: string | null
          updated_at?: string | null
        }
        Update: {
          arena_id?: string
          created_at?: string | null
          email_remetente?: string | null
          evolution_api_enabled?: boolean | null
          evolution_api_key?: string | null
          evolution_api_url?: string | null
          evolution_instance_name?: string | null
          id?: string
          notificacoes_email_enabled?: boolean | null
          notificacoes_whatsapp_enabled?: boolean | null
          template_confirmacao_pagamento?: string | null
          template_lembrete_pagamento?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "configuracoes_arena_arena_id_fkey"
            columns: ["arena_id"]
            isOneToOne: true
            referencedRelation: "arenas"
            referencedColumns: ["id"]
          },
        ]
      }
      contratos: {
        Row: {
          arena_id: string
          beneficios: Json | null
          clausulas_especiais: string | null
          created_at: string | null
          data_cancelamento: string | null
          data_fim: string | null
          data_inicio: string
          desconto_percentual: number | null
          descricao: string | null
          dia_vencimento: number
          id: string
          modalidade: Database["public"]["Enums"]["tipo_esporte"] | null
          motivo_cancelamento: string | null
          numero_contrato: string | null
          observacoes: string | null
          status: Database["public"]["Enums"]["status_contrato"] | null
          tipo_contrato: Database["public"]["Enums"]["tipo_contrato"]
          updated_at: string | null
          usuario_id: string
          valor_mensal: number
          valor_taxa_adesao: number | null
          vendedor_id: string | null
        }
        Insert: {
          arena_id: string
          beneficios?: Json | null
          clausulas_especiais?: string | null
          created_at?: string | null
          data_cancelamento?: string | null
          data_fim?: string | null
          data_inicio: string
          desconto_percentual?: number | null
          descricao?: string | null
          dia_vencimento: number
          id?: string
          modalidade?: Database["public"]["Enums"]["tipo_esporte"] | null
          motivo_cancelamento?: string | null
          numero_contrato?: string | null
          observacoes?: string | null
          status?: Database["public"]["Enums"]["status_contrato"] | null
          tipo_contrato: Database["public"]["Enums"]["tipo_contrato"]
          updated_at?: string | null
          usuario_id: string
          valor_mensal: number
          valor_taxa_adesao?: number | null
          vendedor_id?: string | null
        }
        Update: {
          arena_id?: string
          beneficios?: Json | null
          clausulas_especiais?: string | null
          created_at?: string | null
          data_cancelamento?: string | null
          data_fim?: string | null
          data_inicio?: string
          desconto_percentual?: number | null
          descricao?: string | null
          dia_vencimento?: number
          id?: string
          modalidade?: Database["public"]["Enums"]["tipo_esporte"] | null
          motivo_cancelamento?: string | null
          numero_contrato?: string | null
          observacoes?: string | null
          status?: Database["public"]["Enums"]["status_contrato"] | null
          tipo_contrato?: Database["public"]["Enums"]["tipo_contrato"]
          updated_at?: string | null
          usuario_id?: string
          valor_mensal?: number
          valor_taxa_adesao?: number | null
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contratos_arena_id_fkey"
            columns: ["arena_id"]
            isOneToOne: false
            referencedRelation: "arenas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      faturas_sistema: {
        Row: {
          arena_id: string
          asaas_bankslip_url: string | null
          asaas_invoice_url: string | null
          asaas_payment_id: string | null
          assinatura_arena_id: string
          competencia: string
          created_at: string | null
          data_pagamento: string | null
          data_vencimento: string
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"] | null
          historico_status: Json | null
          id: string
          linha_digitavel: string | null
          numero_fatura: string
          observacoes: string | null
          pix_copy_paste: string | null
          qr_code_pix: string | null
          status_pagamento: Database["public"]["Enums"]["status_pagamento"]
          updated_at: string | null
          valor: number
        }
        Insert: {
          arena_id: string
          asaas_bankslip_url?: string | null
          asaas_invoice_url?: string | null
          asaas_payment_id?: string | null
          assinatura_arena_id: string
          competencia: string
          created_at?: string | null
          data_pagamento?: string | null
          data_vencimento: string
          forma_pagamento?:
            | Database["public"]["Enums"]["forma_pagamento"]
            | null
          historico_status?: Json | null
          id?: string
          linha_digitavel?: string | null
          numero_fatura: string
          observacoes?: string | null
          pix_copy_paste?: string | null
          qr_code_pix?: string | null
          status_pagamento?: Database["public"]["Enums"]["status_pagamento"]
          updated_at?: string | null
          valor: number
        }
        Update: {
          arena_id?: string
          asaas_bankslip_url?: string | null
          asaas_invoice_url?: string | null
          asaas_payment_id?: string | null
          assinatura_arena_id?: string
          competencia?: string
          created_at?: string | null
          data_pagamento?: string | null
          data_vencimento?: string
          forma_pagamento?:
            | Database["public"]["Enums"]["forma_pagamento"]
            | null
          historico_status?: Json | null
          id?: string
          linha_digitavel?: string | null
          numero_fatura?: string
          observacoes?: string | null
          pix_copy_paste?: string | null
          qr_code_pix?: string | null
          status_pagamento?: Database["public"]["Enums"]["status_pagamento"]
          updated_at?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "faturas_sistema_arena_id_fkey"
            columns: ["arena_id"]
            isOneToOne: false
            referencedRelation: "arenas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faturas_sistema_assinatura_arena_id_fkey"
            columns: ["assinatura_arena_id"]
            isOneToOne: false
            referencedRelation: "assinaturas_arena"
            referencedColumns: ["id"]
          },
        ]
      }
      funcionarios: {
        Row: {
          arena_id: string
          cargo: string
          created_at: string | null
          data_admissao: string
          data_demissao: string | null
          horario_trabalho: Json
          id: string
          permissoes: Json | null
          salario: number | null
          status: Database["public"]["Enums"]["status_geral"] | null
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          arena_id: string
          cargo: string
          created_at?: string | null
          data_admissao: string
          data_demissao?: string | null
          horario_trabalho?: Json
          id?: string
          permissoes?: Json | null
          salario?: number | null
          status?: Database["public"]["Enums"]["status_geral"] | null
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          arena_id?: string
          cargo?: string
          created_at?: string | null
          data_admissao?: string
          data_demissao?: string | null
          horario_trabalho?: Json
          id?: string
          permissoes?: Json | null
          salario?: number | null
          status?: Database["public"]["Enums"]["status_geral"] | null
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "funcionarios_arena_id_fkey"
            columns: ["arena_id"]
            isOneToOne: false
            referencedRelation: "arenas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funcionarios_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_atividades: {
        Row: {
          arena_id: string | null
          created_at: string | null
          descricao: string
          id: string
          ip_address: string | null
          metadata: Json | null
          tipo_acao: string
          user_agent: string | null
          usuario_id: string
        }
        Insert: {
          arena_id?: string | null
          created_at?: string | null
          descricao: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          tipo_acao: string
          user_agent?: string | null
          usuario_id: string
        }
        Update: {
          arena_id?: string | null
          created_at?: string | null
          descricao?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          tipo_acao?: string
          user_agent?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "historico_atividades_arena_id_fkey"
            columns: ["arena_id"]
            isOneToOne: false
            referencedRelation: "arenas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_atividades_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      mensalidades: {
        Row: {
          acrescimo: number | null
          asaas_customer_id: string | null
          asaas_invoice_url: string | null
          asaas_payment_id: string | null
          contrato_id: string
          created_at: string | null
          data_pagamento: string | null
          data_vencimento: string
          desconto: number | null
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"] | null
          historico_status: Json | null
          id: string
          linha_digitavel: string | null
          observacoes: string | null
          pix_copy_paste: string | null
          qr_code_pix: string | null
          referencia: string
          status_pagamento:
            | Database["public"]["Enums"]["status_pagamento"]
            | null
          updated_at: string | null
          valor: number
          valor_final: number
        }
        Insert: {
          acrescimo?: number | null
          asaas_customer_id?: string | null
          asaas_invoice_url?: string | null
          asaas_payment_id?: string | null
          contrato_id: string
          created_at?: string | null
          data_pagamento?: string | null
          data_vencimento: string
          desconto?: number | null
          forma_pagamento?:
            | Database["public"]["Enums"]["forma_pagamento"]
            | null
          historico_status?: Json | null
          id?: string
          linha_digitavel?: string | null
          observacoes?: string | null
          pix_copy_paste?: string | null
          qr_code_pix?: string | null
          referencia: string
          status_pagamento?:
            | Database["public"]["Enums"]["status_pagamento"]
            | null
          updated_at?: string | null
          valor: number
          valor_final: number
        }
        Update: {
          acrescimo?: number | null
          asaas_customer_id?: string | null
          asaas_invoice_url?: string | null
          asaas_payment_id?: string | null
          contrato_id?: string
          created_at?: string | null
          data_pagamento?: string | null
          data_vencimento?: string
          desconto?: number | null
          forma_pagamento?:
            | Database["public"]["Enums"]["forma_pagamento"]
            | null
          historico_status?: Json | null
          id?: string
          linha_digitavel?: string | null
          observacoes?: string | null
          pix_copy_paste?: string | null
          qr_code_pix?: string | null
          referencia?: string
          status_pagamento?:
            | Database["public"]["Enums"]["status_pagamento"]
            | null
          updated_at?: string | null
          valor?: number
          valor_final?: number
        }
        Relationships: [
          {
            foreignKeyName: "mensalidades_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
        ]
      }
      modulos_sistema: {
        Row: {
          created_at: string | null
          dependencias: Json | null
          descricao: string | null
          icone: string | null
          id: string
          nome: string
          ordem: number
          slug: string
          status: Database["public"]["Enums"]["status_geral"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dependencias?: Json | null
          descricao?: string | null
          icone?: string | null
          id?: string
          nome: string
          ordem: number
          slug: string
          status?: Database["public"]["Enums"]["status_geral"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dependencias?: Json | null
          descricao?: string | null
          icone?: string | null
          id?: string
          nome?: string
          ordem?: number
          slug?: string
          status?: Database["public"]["Enums"]["status_geral"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      movimentacoes_financeiras: {
        Row: {
          arena_id: string
          categoria_id: string | null
          created_at: string | null
          data_movimentacao: string
          descricao: string
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"] | null
          id: string
          observacoes: string | null
          referencia_id: string | null
          referencia_tipo: string | null
          tipo: Database["public"]["Enums"]["tipo_movimentacao"]
          updated_at: string | null
          usuario_id: string | null
          valor: number
        }
        Insert: {
          arena_id: string
          categoria_id?: string | null
          created_at?: string | null
          data_movimentacao: string
          descricao: string
          forma_pagamento?:
            | Database["public"]["Enums"]["forma_pagamento"]
            | null
          id?: string
          observacoes?: string | null
          referencia_id?: string | null
          referencia_tipo?: string | null
          tipo: Database["public"]["Enums"]["tipo_movimentacao"]
          updated_at?: string | null
          usuario_id?: string | null
          valor: number
        }
        Update: {
          arena_id?: string
          categoria_id?: string | null
          created_at?: string | null
          data_movimentacao?: string
          descricao?: string
          forma_pagamento?:
            | Database["public"]["Enums"]["forma_pagamento"]
            | null
          id?: string
          observacoes?: string | null
          referencia_id?: string | null
          referencia_tipo?: string | null
          tipo?: Database["public"]["Enums"]["tipo_movimentacao"]
          updated_at?: string | null
          usuario_id?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_financeiras_arena_id_fkey"
            columns: ["arena_id"]
            isOneToOne: false
            referencedRelation: "arenas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_financeiras_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_financeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_financeiras_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          arena_id: string | null
          created_at: string | null
          id: string
          lida: boolean | null
          lida_em: string | null
          link: string | null
          mensagem: string
          metadata: Json | null
          tipo: Database["public"]["Enums"]["tipo_notificacao"]
          titulo: string
          usuario_id: string
        }
        Insert: {
          arena_id?: string | null
          created_at?: string | null
          id?: string
          lida?: boolean | null
          lida_em?: string | null
          link?: string | null
          mensagem: string
          metadata?: Json | null
          tipo: Database["public"]["Enums"]["tipo_notificacao"]
          titulo: string
          usuario_id: string
        }
        Update: {
          arena_id?: string | null
          created_at?: string | null
          id?: string
          lida?: boolean | null
          lida_em?: string | null
          link?: string | null
          mensagem?: string
          metadata?: Json | null
          tipo?: Database["public"]["Enums"]["tipo_notificacao"]
          titulo?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_arena_id_fkey"
            columns: ["arena_id"]
            isOneToOne: false
            referencedRelation: "arenas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      planos_sistema: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          max_quadras: number
          max_usuarios: number
          modulos_inclusos: Json
          nome: string
          recursos_extras: Json | null
          status: Database["public"]["Enums"]["status_geral"]
          updated_at: string | null
          valor_mensal: number
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          max_quadras?: number
          max_usuarios?: number
          modulos_inclusos?: Json
          nome: string
          recursos_extras?: Json | null
          status?: Database["public"]["Enums"]["status_geral"]
          updated_at?: string | null
          valor_mensal: number
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          max_quadras?: number
          max_usuarios?: number
          modulos_inclusos?: Json
          nome?: string
          recursos_extras?: Json | null
          status?: Database["public"]["Enums"]["status_geral"]
          updated_at?: string | null
          valor_mensal?: number
        }
        Relationships: []
      }
      professor_alunos: {
        Row: {
          aluno_id: string
          arena_id: string
          ativo: boolean | null
          created_at: string | null
          data_vinculo: string | null
          id: string
          observacoes: string | null
          professor_id: string
          updated_at: string | null
        }
        Insert: {
          aluno_id: string
          arena_id: string
          ativo?: boolean | null
          created_at?: string | null
          data_vinculo?: string | null
          id?: string
          observacoes?: string | null
          professor_id: string
          updated_at?: string | null
        }
        Update: {
          aluno_id?: string
          arena_id?: string
          ativo?: boolean | null
          created_at?: string | null
          data_vinculo?: string | null
          id?: string
          observacoes?: string | null
          professor_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professor_alunos_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professor_alunos_arena_id_fkey"
            columns: ["arena_id"]
            isOneToOne: false
            referencedRelation: "arenas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professor_alunos_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professores"
            referencedColumns: ["id"]
          },
        ]
      }
      professores: {
        Row: {
          arena_id: string
          avaliacao_media: number | null
          biografia: string | null
          created_at: string | null
          disponibilidade: Json
          especialidades: Json | null
          foto_url: string | null
          id: string
          percentual_comissao_padrao: number | null
          registro_profissional: string | null
          status: Database["public"]["Enums"]["status_geral"] | null
          total_avaliacoes: number | null
          updated_at: string | null
          usuario_id: string
          valor_hora_aula: number
        }
        Insert: {
          arena_id: string
          avaliacao_media?: number | null
          biografia?: string | null
          created_at?: string | null
          disponibilidade?: Json
          especialidades?: Json | null
          foto_url?: string | null
          id?: string
          percentual_comissao_padrao?: number | null
          registro_profissional?: string | null
          status?: Database["public"]["Enums"]["status_geral"] | null
          total_avaliacoes?: number | null
          updated_at?: string | null
          usuario_id: string
          valor_hora_aula: number
        }
        Update: {
          arena_id?: string
          avaliacao_media?: number | null
          biografia?: string | null
          created_at?: string | null
          disponibilidade?: Json
          especialidades?: Json | null
          foto_url?: string | null
          id?: string
          percentual_comissao_padrao?: number | null
          registro_profissional?: string | null
          status?: Database["public"]["Enums"]["status_geral"] | null
          total_avaliacoes?: number | null
          updated_at?: string | null
          usuario_id?: string
          valor_hora_aula?: number
        }
        Relationships: [
          {
            foreignKeyName: "professores_arena_id_fkey"
            columns: ["arena_id"]
            isOneToOne: false
            referencedRelation: "arenas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professores_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      quadras: {
        Row: {
          arena_id: string | null
          capacidade_jogadores: number
          cobertura: boolean
          created_at: string | null
          dimensoes: Json | null
          equipamentos_inclusos: Json | null
          horarios_pico: Json
          id: string
          iluminacao: boolean
          nome: string
          numero: number
          observacoes: string | null
          proxima_manutencao: string | null
          status: string
          tipo_esporte: Database["public"]["Enums"]["tipo_esporte"]
          tipo_piso: Database["public"]["Enums"]["tipo_piso"]
          ultima_manutencao: string | null
          updated_at: string | null
          valor_hora_normal: number
          valor_hora_pico: number
        }
        Insert: {
          arena_id?: string | null
          capacidade_jogadores?: number
          cobertura?: boolean
          created_at?: string | null
          dimensoes?: Json | null
          equipamentos_inclusos?: Json | null
          horarios_pico?: Json
          id?: string
          iluminacao?: boolean
          nome: string
          numero: number
          observacoes?: string | null
          proxima_manutencao?: string | null
          status?: string
          tipo_esporte: Database["public"]["Enums"]["tipo_esporte"]
          tipo_piso: Database["public"]["Enums"]["tipo_piso"]
          ultima_manutencao?: string | null
          updated_at?: string | null
          valor_hora_normal: number
          valor_hora_pico: number
        }
        Update: {
          arena_id?: string | null
          capacidade_jogadores?: number
          cobertura?: boolean
          created_at?: string | null
          dimensoes?: Json | null
          equipamentos_inclusos?: Json | null
          horarios_pico?: Json
          id?: string
          iluminacao?: boolean
          nome?: string
          numero?: number
          observacoes?: string | null
          proxima_manutencao?: string | null
          status?: string
          tipo_esporte?: Database["public"]["Enums"]["tipo_esporte"]
          tipo_piso?: Database["public"]["Enums"]["tipo_piso"]
          ultima_manutencao?: string | null
          updated_at?: string | null
          valor_hora_normal?: number
          valor_hora_pico?: number
        }
        Relationships: [
          {
            foreignKeyName: "quadras_arena_id_fkey"
            columns: ["arena_id"]
            isOneToOne: false
            referencedRelation: "arenas"
            referencedColumns: ["id"]
          },
        ]
      }
      templates_notificacao: {
        Row: {
          assunto: string | null
          ativo: boolean | null
          categoria: string | null
          created_at: string | null
          id: string
          mensagem: string
          nome: string
          tipo: string
          updated_at: string | null
          variaveis: Json | null
        }
        Insert: {
          assunto?: string | null
          ativo?: boolean | null
          categoria?: string | null
          created_at?: string | null
          id?: string
          mensagem: string
          nome: string
          tipo: string
          updated_at?: string | null
          variaveis?: Json | null
        }
        Update: {
          assunto?: string | null
          ativo?: boolean | null
          categoria?: string | null
          created_at?: string | null
          id?: string
          mensagem?: string
          nome?: string
          tipo?: string
          updated_at?: string | null
          variaveis?: Json | null
        }
        Relationships: []
      }
      torneios: {
        Row: {
          arena_id: string
          created_at: string | null
          data_fim: string
          data_fim_inscricoes: string
          data_inicio: string
          data_inicio_inscricoes: string
          descricao: string | null
          id: string
          imagem_url: string | null
          max_participantes: number | null
          modalidade: Database["public"]["Enums"]["tipo_esporte"]
          nome: string
          premiacao: Json | null
          regulamento: string | null
          status: Database["public"]["Enums"]["status_torneio"] | null
          tipo_chaveamento: Database["public"]["Enums"]["tipo_chaveamento"]
          updated_at: string | null
          valor_inscricao: number | null
        }
        Insert: {
          arena_id: string
          created_at?: string | null
          data_fim: string
          data_fim_inscricoes: string
          data_inicio: string
          data_inicio_inscricoes: string
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          max_participantes?: number | null
          modalidade: Database["public"]["Enums"]["tipo_esporte"]
          nome: string
          premiacao?: Json | null
          regulamento?: string | null
          status?: Database["public"]["Enums"]["status_torneio"] | null
          tipo_chaveamento: Database["public"]["Enums"]["tipo_chaveamento"]
          updated_at?: string | null
          valor_inscricao?: number | null
        }
        Update: {
          arena_id?: string
          created_at?: string | null
          data_fim?: string
          data_fim_inscricoes?: string
          data_inicio?: string
          data_inicio_inscricoes?: string
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          max_participantes?: number | null
          modalidade?: Database["public"]["Enums"]["tipo_esporte"]
          nome?: string
          premiacao?: Json | null
          regulamento?: string | null
          status?: Database["public"]["Enums"]["status_torneio"] | null
          tipo_chaveamento?: Database["public"]["Enums"]["tipo_chaveamento"]
          updated_at?: string | null
          valor_inscricao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "torneios_arena_id_fkey"
            columns: ["arena_id"]
            isOneToOne: false
            referencedRelation: "arenas"
            referencedColumns: ["id"]
          },
        ]
      }
      torneios_inscricoes: {
        Row: {
          created_at: string | null
          data_pagamento: string | null
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"] | null
          id: string
          observacoes: string | null
          parceiro_id: string | null
          status_pagamento:
            | Database["public"]["Enums"]["status_pagamento"]
            | null
          torneio_id: string
          updated_at: string | null
          usuario_id: string
          valor_pago: number
        }
        Insert: {
          created_at?: string | null
          data_pagamento?: string | null
          forma_pagamento?:
            | Database["public"]["Enums"]["forma_pagamento"]
            | null
          id?: string
          observacoes?: string | null
          parceiro_id?: string | null
          status_pagamento?:
            | Database["public"]["Enums"]["status_pagamento"]
            | null
          torneio_id: string
          updated_at?: string | null
          usuario_id: string
          valor_pago: number
        }
        Update: {
          created_at?: string | null
          data_pagamento?: string | null
          forma_pagamento?:
            | Database["public"]["Enums"]["forma_pagamento"]
            | null
          id?: string
          observacoes?: string | null
          parceiro_id?: string | null
          status_pagamento?:
            | Database["public"]["Enums"]["status_pagamento"]
            | null
          torneio_id?: string
          updated_at?: string | null
          usuario_id?: string
          valor_pago?: number
        }
        Relationships: [
          {
            foreignKeyName: "torneios_inscricoes_parceiro_id_fkey"
            columns: ["parceiro_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "torneios_inscricoes_torneio_id_fkey"
            columns: ["torneio_id"]
            isOneToOne: false
            referencedRelation: "torneios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "torneios_inscricoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      torneios_jogos: {
        Row: {
          created_at: string | null
          data_jogo: string | null
          dupla1_jogador1_id: string | null
          dupla1_jogador2_id: string | null
          dupla2_jogador1_id: string | null
          dupla2_jogador2_id: string | null
          fase: string
          hora_inicio: string | null
          id: string
          numero_jogo: number
          observacoes: string | null
          placar_dupla1: number | null
          placar_dupla2: number | null
          quadra_id: string | null
          torneio_id: string
          updated_at: string | null
          vencedor: number | null
        }
        Insert: {
          created_at?: string | null
          data_jogo?: string | null
          dupla1_jogador1_id?: string | null
          dupla1_jogador2_id?: string | null
          dupla2_jogador1_id?: string | null
          dupla2_jogador2_id?: string | null
          fase: string
          hora_inicio?: string | null
          id?: string
          numero_jogo: number
          observacoes?: string | null
          placar_dupla1?: number | null
          placar_dupla2?: number | null
          quadra_id?: string | null
          torneio_id: string
          updated_at?: string | null
          vencedor?: number | null
        }
        Update: {
          created_at?: string | null
          data_jogo?: string | null
          dupla1_jogador1_id?: string | null
          dupla1_jogador2_id?: string | null
          dupla2_jogador1_id?: string | null
          dupla2_jogador2_id?: string | null
          fase?: string
          hora_inicio?: string | null
          id?: string
          numero_jogo?: number
          observacoes?: string | null
          placar_dupla1?: number | null
          placar_dupla2?: number | null
          quadra_id?: string | null
          torneio_id?: string
          updated_at?: string | null
          vencedor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "torneios_jogos_dupla1_jogador1_id_fkey"
            columns: ["dupla1_jogador1_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "torneios_jogos_dupla1_jogador2_id_fkey"
            columns: ["dupla1_jogador2_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "torneios_jogos_dupla2_jogador1_id_fkey"
            columns: ["dupla2_jogador1_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "torneios_jogos_dupla2_jogador2_id_fkey"
            columns: ["dupla2_jogador2_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "torneios_jogos_quadra_id_fkey"
            columns: ["quadra_id"]
            isOneToOne: false
            referencedRelation: "quadras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "torneios_jogos_torneio_id_fkey"
            columns: ["torneio_id"]
            isOneToOne: false
            referencedRelation: "torneios"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          arena_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          arena_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          arena_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_arena_id_fkey"
            columns: ["arena_id"]
            isOneToOne: false
            referencedRelation: "arenas"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          aceite_termos: boolean
          arena_id: string | null
          auth_id: string
          cpf: string
          created_at: string | null
          data_cadastro: string
          data_nascimento: string
          email: string
          id: string
          nome_completo: string
          status: Database["public"]["Enums"]["status_geral"]
          telefone: string
          tipo_usuario: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          aceite_termos?: boolean
          arena_id?: string | null
          auth_id: string
          cpf: string
          created_at?: string | null
          data_cadastro?: string
          data_nascimento: string
          email: string
          id?: string
          nome_completo: string
          status?: Database["public"]["Enums"]["status_geral"]
          telefone: string
          tipo_usuario: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          aceite_termos?: boolean
          arena_id?: string | null
          auth_id?: string
          cpf?: string
          created_at?: string | null
          data_cadastro?: string
          data_nascimento?: string
          email?: string
          id?: string
          nome_completo?: string
          status?: Database["public"]["Enums"]["status_geral"]
          telefone?: string
          tipo_usuario?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_arena_id_fkey"
            columns: ["arena_id"]
            isOneToOne: false
            referencedRelation: "arenas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_arena_status: {
        Args: { _arena_id: string }
        Returns: {
          data_vencimento: string
          dias_ate_vencimento: number
          mensagem: string
          pode_acessar: boolean
          status: Database["public"]["Enums"]["status_geral"]
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "arena_admin"
        | "funcionario"
        | "professor"
        | "aluno"
      categoria_financeira:
        | "mensalidade"
        | "agendamento"
        | "aula"
        | "torneio"
        | "evento"
        | "equipamento"
        | "manutencao"
        | "salario"
        | "outros"
      forma_pagamento:
        | "pix"
        | "cartao_credito"
        | "cartao_debito"
        | "dinheiro"
        | "boleto"
        | "credito"
        | "transferencia"
      status_agendamento:
        | "confirmado"
        | "pendente"
        | "cancelado"
        | "realizado"
        | "no_show"
      status_aula:
        | "agendada"
        | "confirmada"
        | "realizada"
        | "cancelada"
        | "remarcada"
      status_contrato: "ativo" | "suspenso" | "cancelado" | "finalizado"
      status_geral: "ativo" | "inativo" | "suspenso" | "bloqueado"
      status_pagamento:
        | "pendente"
        | "pago"
        | "parcial"
        | "cancelado"
        | "vencido"
        | "estornado"
      status_torneio:
        | "planejamento"
        | "inscricoes_abertas"
        | "em_andamento"
        | "finalizado"
        | "cancelado"
      tipo_aula: "individual" | "grupo" | "clinica" | "curso"
      tipo_chaveamento:
        | "eliminacao_simples"
        | "eliminacao_dupla"
        | "round_robin"
        | "suico"
      tipo_contrato: "mensal" | "trimestral" | "semestral" | "anual"
      tipo_esporte: "beach_tennis" | "padel" | "tenis" | "futevolei"
      tipo_movimentacao: "receita" | "despesa" | "transferencia"
      tipo_notificacao:
        | "agendamento_novo"
        | "agendamento_cancelado"
        | "checkin_realizado"
        | "pagamento_recebido"
        | "pagamento_vencido"
        | "mensalidade_proxima"
        | "contrato_expirando"
        | "aula_confirmada"
        | "torneio_inscricao"
        | "sistema_alerta"
        | "financeiro_alerta"
        | "novo_aluno"
        | "professor_vinculado"
        | "inscricao_aula"
      tipo_piso: "areia" | "saibro" | "sintetico" | "concreto" | "grama"
      user_role:
        | "super_admin"
        | "arena_admin"
        | "funcionario"
        | "professor"
        | "aluno"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "super_admin",
        "arena_admin",
        "funcionario",
        "professor",
        "aluno",
      ],
      categoria_financeira: [
        "mensalidade",
        "agendamento",
        "aula",
        "torneio",
        "evento",
        "equipamento",
        "manutencao",
        "salario",
        "outros",
      ],
      forma_pagamento: [
        "pix",
        "cartao_credito",
        "cartao_debito",
        "dinheiro",
        "boleto",
        "credito",
        "transferencia",
      ],
      status_agendamento: [
        "confirmado",
        "pendente",
        "cancelado",
        "realizado",
        "no_show",
      ],
      status_aula: [
        "agendada",
        "confirmada",
        "realizada",
        "cancelada",
        "remarcada",
      ],
      status_contrato: ["ativo", "suspenso", "cancelado", "finalizado"],
      status_geral: ["ativo", "inativo", "suspenso", "bloqueado"],
      status_pagamento: [
        "pendente",
        "pago",
        "parcial",
        "cancelado",
        "vencido",
        "estornado",
      ],
      status_torneio: [
        "planejamento",
        "inscricoes_abertas",
        "em_andamento",
        "finalizado",
        "cancelado",
      ],
      tipo_aula: ["individual", "grupo", "clinica", "curso"],
      tipo_chaveamento: [
        "eliminacao_simples",
        "eliminacao_dupla",
        "round_robin",
        "suico",
      ],
      tipo_contrato: ["mensal", "trimestral", "semestral", "anual"],
      tipo_esporte: ["beach_tennis", "padel", "tenis", "futevolei"],
      tipo_movimentacao: ["receita", "despesa", "transferencia"],
      tipo_notificacao: [
        "agendamento_novo",
        "agendamento_cancelado",
        "checkin_realizado",
        "pagamento_recebido",
        "pagamento_vencido",
        "mensalidade_proxima",
        "contrato_expirando",
        "aula_confirmada",
        "torneio_inscricao",
        "sistema_alerta",
        "financeiro_alerta",
        "novo_aluno",
        "professor_vinculado",
        "inscricao_aula",
      ],
      tipo_piso: ["areia", "saibro", "sintetico", "concreto", "grama"],
      user_role: [
        "super_admin",
        "arena_admin",
        "funcionario",
        "professor",
        "aluno",
      ],
    },
  },
} as const
