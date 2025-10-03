import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, asaas-access-token",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ASAAS_WEBHOOK_URL = Deno.env.get("ASAAS_WEBHOOK_URL");
    if (!ASAAS_WEBHOOK_URL) {
      console.error("ASAAS_WEBHOOK_URL não configurado");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const payload = await req.json();
    console.log("Webhook Asaas recebido:", payload);

    const { event, payment } = payload;

    if (!event || !payment) {
      throw new Error("Payload inválido do webhook Asaas");
    }

    // Buscar mensalidade pelo externalReference
    const { data: mensalidade, error: findError } = await supabaseClient
      .from("mensalidades")
      .select("*")
      .eq("id", payment.externalReference)
      .single();

    if (findError || !mensalidade) {
      console.error("Mensalidade não encontrada:", payment.externalReference);
      throw new Error("Mensalidade não encontrada");
    }

    // Mapear evento Asaas para status
    let novoStatus: string | null = null;
    let dataPagamento: string | null = null;

    switch (event) {
      case "PAYMENT_RECEIVED":
      case "PAYMENT_CONFIRMED":
        novoStatus = "pago";
        dataPagamento = payment.paymentDate || new Date().toISOString();
        break;
      case "PAYMENT_OVERDUE":
        novoStatus = "vencido";
        break;
      case "PAYMENT_DELETED":
      case "PAYMENT_REFUNDED":
        novoStatus = "cancelado";
        break;
      default:
        console.log("Evento não tratado:", event);
    }

    if (novoStatus) {
      // Atualizar mensalidade
      const updateData: any = {
        status_pagamento: novoStatus,
        updated_at: new Date().toISOString(),
      };

      if (dataPagamento) {
        updateData.data_pagamento = dataPagamento;
      }

      const { error: updateError } = await supabaseClient
        .from("mensalidades")
        .update(updateData)
        .eq("id", mensalidade.id);

      if (updateError) {
        console.error("Erro ao atualizar mensalidade:", updateError);
        throw updateError;
      }

      // Se foi pago, criar movimentação financeira
      if (novoStatus === "pago" && mensalidade.contrato_id) {
        const { data: contrato } = await supabaseClient
          .from("contratos")
          .select("arena_id, usuario_id")
          .eq("id", mensalidade.contrato_id)
          .single();

        if (contrato) {
          const { error: movError } = await supabaseClient
            .from("movimentacoes_financeiras")
            .insert({
              arena_id: contrato.arena_id,
              usuario_id: contrato.usuario_id,
              tipo: "receita",
              categoria: "mensalidade",
              descricao: `Pagamento de mensalidade - Ref: ${mensalidade.referencia}`,
              valor: payment.value || mensalidade.valor_final,
              data_movimentacao: dataPagamento,
              forma_pagamento: payment.billingType?.toLowerCase() || "outros",
              referencia_tipo: "mensalidade",
              referencia_id: mensalidade.id,
            });

          if (movError) {
            console.error("Erro ao criar movimentação:", movError);
          }
        }
      }

      console.log(`Mensalidade ${mensalidade.id} atualizada para ${novoStatus}`);
    }

    // Enviar para webhook externo do usuário
    if (ASAAS_WEBHOOK_URL) {
      try {
        await fetch(ASAAS_WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            event,
            payment,
            mensalidade_id: mensalidade.id,
            status: novoStatus,
            timestamp: new Date().toISOString(),
          }),
        });
        console.log("Webhook externo notificado com sucesso");
      } catch (webhookError) {
        console.error("Erro ao notificar webhook externo:", webhookError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Webhook processado com sucesso",
        mensalidade_id: mensalidade.id,
        novo_status: novoStatus,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Erro no webhook Asaas:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
