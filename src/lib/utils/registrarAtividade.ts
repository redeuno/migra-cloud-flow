import { supabase } from "@/integrations/supabase/client";

interface RegistrarAtividadeParams {
  usuarioId: string;
  arenaId?: string;
  tipoAcao: string;
  descricao: string;
  metadata?: Record<string, any>;
}

export async function registrarAtividade({
  usuarioId,
  arenaId,
  tipoAcao,
  descricao,
  metadata = {},
}: RegistrarAtividadeParams) {
  try {
    const { error } = await supabase
      .from("historico_atividades")
      .insert({
        usuario_id: usuarioId,
        arena_id: arenaId,
        tipo_acao: tipoAcao,
        descricao,
        metadata,
        ip_address: null, // Pode ser implementado futuramente
        user_agent: navigator.userAgent,
      });

    if (error) {
      if (import.meta.env.DEV) console.error("Erro ao registrar atividade:", error);
    }
  } catch (error) {
    if (import.meta.env.DEV) console.error("Erro ao registrar atividade:", error);
  }
}
