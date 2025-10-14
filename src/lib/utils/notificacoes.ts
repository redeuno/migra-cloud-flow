import { supabase } from "@/integrations/supabase/client";

export interface CriarNotificacaoParams {
  usuarioId: string;
  arenaId?: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  link?: string;
  metadata?: Record<string, any>;
}

export async function criarNotificacao({
  usuarioId,
  arenaId,
  tipo,
  titulo,
  mensagem,
  link,
  metadata = {},
}: CriarNotificacaoParams) {
  const { error } = await supabase.from("notificacoes").insert([{
    usuario_id: usuarioId,
    arena_id: arenaId || null,
    tipo: tipo as any,
    titulo,
    mensagem,
    link: link || null,
    metadata: metadata as any,
  }]);

  if (error) {
    console.error("Erro ao criar notificação:", error);
    throw error;
  }
}

export async function criarNotificacaoPagamento(
  usuarioId: string,
  arenaId: string,
  valorPago: number,
  contratoId: string
) {
  await criarNotificacao({
    usuarioId,
    arenaId,
    tipo: "pagamento_recebido",
    titulo: "Pagamento Recebido",
    mensagem: `Pagamento de R$ ${valorPago.toFixed(2)} foi confirmado`,
    link: "/financeiro?tab=mensalidades",
    metadata: { contrato_id: contratoId, valor: valorPago },
  });
}

export async function criarNotificacaoPagamentoVencido(
  usuarioId: string,
  arenaId: string,
  valorDevido: number,
  mensalidadeId: string
) {
  await criarNotificacao({
    usuarioId,
    arenaId,
    tipo: "pagamento_vencido",
    titulo: "Pagamento Vencido",
    mensagem: `Você tem um pagamento de R$ ${valorDevido.toFixed(2)} em atraso`,
    link: "/meu-financeiro",
    metadata: { mensalidade_id: mensalidadeId, valor: valorDevido },
  });
}

export async function criarNotificacaoMensalidadeProxima(
  usuarioId: string,
  arenaId: string,
  dataVencimento: string,
  valor: number
) {
  await criarNotificacao({
    usuarioId,
    arenaId,
    tipo: "mensalidade_proxima",
    titulo: "Mensalidade Próxima do Vencimento",
    mensagem: `Sua mensalidade de R$ ${valor.toFixed(2)} vence em ${dataVencimento}`,
    link: "/meu-financeiro",
    metadata: { data_vencimento: dataVencimento, valor },
  });
}

export async function criarNotificacaoAulaConfirmada(
  usuarioId: string,
  arenaId: string,
  tituloAula: string,
  dataAula: string,
  aulaId: string
) {
  await criarNotificacao({
    usuarioId,
    arenaId,
    tipo: "aula_confirmada",
    titulo: "Aula Confirmada",
    mensagem: `Sua inscrição em "${tituloAula}" foi confirmada para ${dataAula}`,
    link: "/minhas-aulas",
    metadata: { aula_id: aulaId },
  });
}

export async function criarNotificacaoTorneioInscricao(
  usuarioId: string,
  arenaId: string,
  nomeTorneio: string,
  torneioId: string
) {
  await criarNotificacao({
    usuarioId,
    arenaId,
    tipo: "torneio_inscricao",
    titulo: "Inscrição em Torneio",
    mensagem: `Sua inscrição no torneio "${nomeTorneio}" foi confirmada`,
    link: "/torneios",
    metadata: { torneio_id: torneioId },
  });
}
