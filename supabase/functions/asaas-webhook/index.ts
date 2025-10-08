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
    // SEGURANÇA: Validar token do webhook (opcional mas recomendado)
    const asaasToken = req.headers.get("asaas-access-token");
    const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY");
    
    if (asaasToken && ASAAS_API_KEY && asaasToken !== ASAAS_API_KEY) {
      console.error("Token do webhook inválido");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: corsHeaders }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const payload = await req.json();
    console.log("Webhook recebido do Asaas:", JSON.stringify(payload, null, 2));

    const { event, payment } = payload;

    if (!event || !payment) {
      throw new Error("Payload inválido do webhook Asaas");
    }

    // Identificar se é mensalidade ou fatura_sistema
    let tipoCobranca: "mensalidade" | "fatura_sistema" = "mensalidade";
    let recordId = payment.externalReference;

    // Se não tem externalReference, pode ser fatura_sistema
    if (!recordId) {
      // Buscar pela asaas_payment_id
      const { data: fatura } = await supabaseClient
        .from("faturas_sistema")
        .select("id")
        .eq("asaas_payment_id", payment.id)
        .maybeSingle();

      if (fatura) {
        tipoCobranca = "fatura_sistema";
        recordId = fatura.id;
      }
    }

    if (!recordId) {
      console.error("Não foi possível identificar a cobrança");
      throw new Error("Cobrança não identificada");
    }

    // Buscar o registro correto
    const tabela = tipoCobranca === "mensalidade" ? "mensalidades" : "faturas_sistema";
    const { data: registro, error: findError } = await supabaseClient
      .from(tabela)
      .select("*")
      .eq("id", recordId)
      .single();

    if (findError || !registro) {
      console.error(`${tipoCobranca} não encontrada:`, recordId);
      throw new Error(`${tipoCobranca} não encontrada`);
    }

    console.log(`${tipoCobranca} encontrada:`, registro.id);

    // Mapear evento do Asaas para status interno (COMPLETO)
    let novoStatus: string;
    let deveCriarMovimentacao = false;
    
    switch (event) {
      case "PAYMENT_CREATED":
        novoStatus = "pendente";
        break;
      case "PAYMENT_AWAITING_PAYMENT":
        novoStatus = "pendente";
        break;
      case "PAYMENT_RECEIVED":
      case "PAYMENT_CONFIRMED":
      case "PAYMENT_RECEIVED_IN_CASH":
        novoStatus = "pago";
        deveCriarMovimentacao = true;
        break;
      case "PAYMENT_OVERDUE":
        novoStatus = "vencido";
        break;
      case "PAYMENT_REFUNDED":
      case "PAYMENT_CHARGEBACK_REQUESTED":
      case "PAYMENT_CHARGEBACK_DISPUTE":
      case "PAYMENT_DELETED":
        novoStatus = "cancelado";
        break;
      case "PAYMENT_RESTORED":
        novoStatus = "pendente";
        break;
      case "PAYMENT_REFUND_IN_PROGRESS":
        novoStatus = "cancelado";
        break;
      default:
        console.log(`Evento não mapeado: ${event}`);
        novoStatus = registro.status_pagamento || "pendente";
    }

    console.log(`Atualizando ${tipoCobranca} para status: ${novoStatus}`);

    // Adicionar ao histórico de status
    const historicoAtual = registro.historico_status || [];
    historicoAtual.push({
      evento: event,
      status: novoStatus,
      data: new Date().toISOString(),
      dados_asaas: payment,
    });

    // Atualizar status + histórico
    const updateData: any = {
      status_pagamento: novoStatus,
      historico_status: historicoAtual,
    };

    if (novoStatus === "pago" && payment.paymentDate) {
      updateData.data_pagamento = payment.paymentDate;
      updateData.forma_pagamento = payment.billingType?.toLowerCase();
    }

    const { error: updateError } = await supabaseClient
      .from(tabela)
      .update(updateData)
      .eq("id", registro.id);

    if (updateError) {
      console.error(`Erro ao atualizar ${tipoCobranca}:`, updateError);
      throw new Error(`Erro ao atualizar: ${updateError.message}`);
    }

    console.log(`${tipoCobranca} ${registro.id} atualizada para: ${novoStatus}`);

    // Se o pagamento foi confirmado, criar movimentação financeira e reativar arena
    if (deveCriarMovimentacao && novoStatus === "pago") {
      if (tipoCobranca === "mensalidade") {
        // Para mensalidades: criar receita na arena
        const { data: contrato } = await supabaseClient
          .from("contratos")
          .select("arena_id, usuario_id")
          .eq("id", registro.contrato_id)
          .maybeSingle();

        if (contrato) {
          const { error: movError } = await supabaseClient
            .from("movimentacoes_financeiras")
            .insert({
              arena_id: contrato.arena_id,
              usuario_id: contrato.usuario_id,
              tipo: "receita",
              categoria: "mensalidade",
              descricao: `Pagamento de mensalidade - Ref: ${registro.referencia}`,
              valor: payment.value || registro.valor_final,
              data_movimentacao: payment.paymentDate || new Date().toISOString().split("T")[0],
              forma_pagamento: payment.billingType?.toLowerCase() || "outros",
              referencia_tipo: "mensalidade",
              referencia_id: registro.id,
            });

          if (movError) {
            console.error("Erro ao criar movimentação:", movError);
          } else {
            console.log("Movimentação financeira criada com sucesso");
          }
        }
      } else if (tipoCobranca === "fatura_sistema") {
        // Para fatura_sistema: reativar arena
        console.log("Reativando arena após pagamento da fatura do sistema");
        
        const { error: arenaUpdateError } = await supabaseClient
          .from("arenas")
          .update({ 
            status: "ativo",
            data_vencimento: payment.dueDate || new Date(new Date().getTime() + 30*24*60*60*1000).toISOString().split("T")[0]
          })
          .eq("id", registro.arena_id);

        if (arenaUpdateError) {
          console.error("Erro ao reativar arena:", arenaUpdateError);
        } else {
          console.log(`Arena ${registro.arena_id} reativada com sucesso`);
        }
      }
    }

    // Enviar para webhook externo do usuário
    const ASAAS_WEBHOOK_URL = Deno.env.get("ASAAS_WEBHOOK_URL");
    if (ASAAS_WEBHOOK_URL) {
      try {
        const webhookResponse = await fetch(ASAAS_WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            event,
            payment,
            tipo: tipoCobranca,
            registro_id: registro.id,
            status: novoStatus,
            timestamp: new Date().toISOString(),
          }),
        });

        if (webhookResponse.ok) {
          console.log("Webhook externo notificado com sucesso");
        } else {
          console.error("Erro ao notificar webhook externo:", await webhookResponse.text());
        }
      } catch (webhookError) {
        console.error("Erro ao notificar webhook externo:", webhookError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Webhook processado com sucesso",
        tipo: tipoCobranca,
        registro_id: registro.id,
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
