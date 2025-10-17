import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface ValidacaoConflito {
  temConflito: boolean;
  mensagem?: string;
  agendamentosConflitantes?: any[];
}

/**
 * Valida se existe conflito de horário para um agendamento
 */
export async function validarConflitosAgendamento(
  quadraId: string,
  dataAgendamento: Date,
  horaInicio: string,
  horaFim: string,
  agendamentoId?: string // Para edição, ignora o próprio agendamento
): Promise<ValidacaoConflito> {
  try {
    const dataFormatada = format(dataAgendamento, "yyyy-MM-dd");

    // Buscar agendamentos na mesma quadra e data
    let query = supabase
      .from("agendamentos")
      .select("*")
      .eq("quadra_id", quadraId)
      .eq("data_agendamento", dataFormatada)
      .neq("status", "cancelado");

    // Se for edição, ignora o próprio agendamento
    if (agendamentoId) {
      query = query.neq("id", agendamentoId);
    }

    const { data: agendamentos, error } = await query;

    if (error) throw error;

    if (!agendamentos || agendamentos.length === 0) {
      return { temConflito: false };
    }

    // Verificar sobreposição de horários
    const conflitantes = agendamentos.filter((agendamento) => {
      const inicioExistente = agendamento.hora_inicio.substring(0, 5);
      const fimExistente = agendamento.hora_fim.substring(0, 5);

      // Verifica se há sobreposição
      // Caso 1: Novo agendamento começa durante um existente
      const comecaDurante = horaInicio >= inicioExistente && horaInicio < fimExistente;
      
      // Caso 2: Novo agendamento termina durante um existente
      const terminaDurante = horaFim > inicioExistente && horaFim <= fimExistente;
      
      // Caso 3: Novo agendamento engloba um existente
      const engloba = horaInicio <= inicioExistente && horaFim >= fimExistente;

      return comecaDurante || terminaDurante || engloba;
    });

    if (conflitantes.length > 0) {
      const horarios = conflitantes
        .map((a) => `${a.hora_inicio.substring(0, 5)} - ${a.hora_fim.substring(0, 5)}`)
        .join(", ");

      return {
        temConflito: true,
        mensagem: `Conflito de horário detectado. Já existe(m) agendamento(s) neste horário: ${horarios}`,
        agendamentosConflitantes: conflitantes,
      };
    }

    return { temConflito: false };
  } catch (error) {
    console.error("Erro ao validar conflitos:", error);
    throw error;
  }
}

/**
 * Valida se a quadra está bloqueada no horário
 */
export async function validarBloqueioQuadra(
  quadraId: string,
  dataAgendamento: Date,
  horaInicio: string,
  horaFim: string
): Promise<ValidacaoConflito> {
  try {
    const dataHoraInicio = new Date(`${format(dataAgendamento, "yyyy-MM-dd")}T${horaInicio}`);
    const dataHoraFim = new Date(`${format(dataAgendamento, "yyyy-MM-dd")}T${horaFim}`);

    const { data: bloqueios, error } = await supabase
      .from("bloqueios_quadra")
      .select("*")
      .eq("quadra_id", quadraId)
      .lte("data_inicio", dataHoraFim.toISOString())
      .gte("data_fim", dataHoraInicio.toISOString());

    if (error) throw error;

    if (bloqueios && bloqueios.length > 0) {
      const bloqueio = bloqueios[0];
      return {
        temConflito: true,
        mensagem: `A quadra está bloqueada: ${bloqueio.motivo}`,
      };
    }

    return { temConflito: false };
  } catch (error) {
    console.error("Erro ao validar bloqueios:", error);
    throw error;
  }
}

/**
 * Valida todos os conflitos possíveis
 */
export async function validarAgendamentoCompleto(
  quadraId: string,
  dataAgendamento: Date,
  horaInicio: string,
  horaFim: string,
  agendamentoId?: string
): Promise<ValidacaoConflito> {
  // Validar conflitos de horário
  const conflito = await validarConflitosAgendamento(
    quadraId,
    dataAgendamento,
    horaInicio,
    horaFim,
    agendamentoId
  );

  if (conflito.temConflito) {
    return conflito;
  }

  // Validar bloqueios
  const bloqueio = await validarBloqueioQuadra(
    quadraId,
    dataAgendamento,
    horaInicio,
    horaFim
  );

  return bloqueio;
}
