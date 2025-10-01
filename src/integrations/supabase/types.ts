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
          arena_id: string | null
          checkin_realizado: boolean | null
          cliente_id: string | null
          created_at: string | null
          data_agendamento: string
          data_checkin: string | null
          desconto_aplicado: number | null
          hora_fim: string
          hora_inicio: string
          id: string
          max_participantes: number | null
          modalidade: Database["public"]["Enums"]["tipo_esporte"]
          observacoes: string | null
          observacoes_internas: string | null
          participantes: Json | null
          quadra_id: string | null
          status: Database["public"]["Enums"]["status_agendamento"]
          status_pagamento: Database["public"]["Enums"]["status_pagamento"]
          tipo_agendamento: string
          updated_at: string | null
          valor_por_pessoa: number | null
          valor_total: number
        }
        Insert: {
          arena_id?: string | null
          checkin_realizado?: boolean | null
          cliente_id?: string | null
          created_at?: string | null
          data_agendamento: string
          data_checkin?: string | null
          desconto_aplicado?: number | null
          hora_fim: string
          hora_inicio: string
          id?: string
          max_participantes?: number | null
          modalidade: Database["public"]["Enums"]["tipo_esporte"]
          observacoes?: string | null
          observacoes_internas?: string | null
          participantes?: Json | null
          quadra_id?: string | null
          status?: Database["public"]["Enums"]["status_agendamento"]
          status_pagamento?: Database["public"]["Enums"]["status_pagamento"]
          tipo_agendamento?: string
          updated_at?: string | null
          valor_por_pessoa?: number | null
          valor_total?: number
        }
        Update: {
          arena_id?: string | null
          checkin_realizado?: boolean | null
          cliente_id?: string | null
          created_at?: string | null
          data_agendamento?: string
          data_checkin?: string | null
          desconto_aplicado?: number | null
          hora_fim?: string
          hora_inicio?: string
          id?: string
          max_participantes?: number | null
          modalidade?: Database["public"]["Enums"]["tipo_esporte"]
          observacoes?: string | null
          observacoes_internas?: string | null
          participantes?: Json | null
          quadra_id?: string | null
          status?: Database["public"]["Enums"]["status_agendamento"]
          status_pagamento?: Database["public"]["Enums"]["status_pagamento"]
          tipo_agendamento?: string
          updated_at?: string | null
          valor_por_pessoa?: number | null
          valor_total?: number
        }
        Relationships: [
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
            foreignKeyName: "agendamentos_quadra_id_fkey"
            columns: ["quadra_id"]
            isOneToOne: false
            referencedRelation: "quadras"
            referencedColumns: ["id"]
          },
        ]
      }
      arenas: {
        Row: {
          cnpj: string
          configuracoes: Json | null
          cores_tema: Json | null
          created_at: string | null
          data_vencimento: string
          email: string
          endereco_completo: Json
          horario_funcionamento: Json
          id: string
          logo_url: string | null
          nome: string
          plano_sistema_id: string | null
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
          cores_tema?: Json | null
          created_at?: string | null
          data_vencimento: string
          email: string
          endereco_completo: Json
          horario_funcionamento: Json
          id?: string
          logo_url?: string | null
          nome: string
          plano_sistema_id?: string | null
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
          cores_tema?: Json | null
          created_at?: string | null
          data_vencimento?: string
          email?: string
          endereco_completo?: Json
          horario_funcionamento?: Json
          id?: string
          logo_url?: string | null
          nome?: string
          plano_sistema_id?: string | null
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
      usuarios: {
        Row: {
          aceite_termos: boolean
          arena_id: string | null
          auth_id: string | null
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
          auth_id?: string | null
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
          auth_id?: string | null
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
      [_ in never]: never
    }
    Enums: {
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
      status_geral: "ativo" | "inativo" | "suspenso" | "bloqueado"
      status_pagamento:
        | "pendente"
        | "pago"
        | "parcial"
        | "cancelado"
        | "vencido"
        | "estornado"
      tipo_esporte: "beach_tennis" | "padel" | "tenis" | "futevolei"
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
      status_geral: ["ativo", "inativo", "suspenso", "bloqueado"],
      status_pagamento: [
        "pendente",
        "pago",
        "parcial",
        "cancelado",
        "vencido",
        "estornado",
      ],
      tipo_esporte: ["beach_tennis", "padel", "tenis", "futevolei"],
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
