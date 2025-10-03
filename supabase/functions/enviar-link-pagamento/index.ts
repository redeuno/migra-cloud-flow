import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  mensalidade_id: string;
  cliente_id: string;
  enviar_whatsapp: boolean;
  enviar_email: boolean;
  mensagem_personalizada?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const {
      mensalidade_id,
      cliente_id,
      enviar_whatsapp,
      enviar_email,
      mensagem_personalizada,
    }: RequestBody = await req.json();

    console.log("Enviando link de pagamento:", {
      mensalidade_id,
      cliente_id,
      enviar_whatsapp,
      enviar_email,
    });

    // Buscar dados da mensalidade
    const { data: mensalidade, error: mensalidadeError } = await supabaseClient
      .from("mensalidades")
      .select("*, contratos(*, usuarios(*))")
      .eq("id", mensalidade_id)
      .single();

    if (mensalidadeError || !mensalidade) {
      throw new Error("Mensalidade não encontrada");
    }

    // Buscar dados do cliente
    const { data: cliente, error: clienteError } = await supabaseClient
      .from("usuarios")
      .select("*")
      .eq("id", cliente_id)
      .single();

    if (clienteError || !cliente) {
      throw new Error("Cliente não encontrado");
    }

    // Buscar configurações da arena
    const { data: config, error: configError } = await supabaseClient
      .from("configuracoes_arena")
      .select("*")
      .eq("arena_id", cliente.arena_id)
      .single();

    if (configError || !config) {
      throw new Error("Configurações da arena não encontradas");
    }

    // Preparar dados da mensagem
    const valorFormatado = `R$ ${mensalidade.valor_final || mensalidade.valor}`;
    const dataVencimento = new Date(mensalidade.data_vencimento).toLocaleDateString("pt-BR");
    const linkPagamento = mensalidade.asaas_invoice_url || "#";

    const mensagem = mensagem_personalizada || config.template_lembrete_pagamento
      ?.replace("{{nome}}", cliente.nome_completo)
      ?.replace("{{valor}}", valorFormatado)
      ?.replace("{{data_vencimento}}", dataVencimento)
      ?.replace("{{link_pagamento}}", linkPagamento);

    const results = [];

    // Enviar via WhatsApp
    if (enviar_whatsapp && config.evolution_api_enabled) {
      const telefone = cliente.whatsapp || cliente.telefone;
      if (!telefone) {
        throw new Error("Cliente não possui WhatsApp/telefone cadastrado");
      }

      try {
        const whatsappResponse = await fetch(
          `${config.evolution_api_url}/message/sendText/${config.evolution_instance_name}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "apikey": config.evolution_api_key,
            },
            body: JSON.stringify({
              number: telefone.replace(/\D/g, ""),
              textMessage: {
                text: mensagem,
              },
            }),
          }
        );

        if (!whatsappResponse.ok) {
          throw new Error("Erro ao enviar mensagem via WhatsApp");
        }

        results.push({ channel: "whatsapp", success: true });
        console.log("WhatsApp enviado com sucesso");
      } catch (error: any) {
        console.error("Erro ao enviar WhatsApp:", error);
        results.push({ channel: "whatsapp", success: false, error: error?.message || "Erro desconhecido" });
      }
    }

    // Enviar via Email (placeholder - implementar com Resend futuramente)
    if (enviar_email && config.notificacoes_email_enabled) {
      if (!cliente.email) {
        throw new Error("Cliente não possui email cadastrado");
      }

      // TODO: Implementar envio de email com Resend
      console.log("Email será enviado para:", cliente.email);
      results.push({ channel: "email", success: true, note: "Em desenvolvimento" });
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        message: "Link de pagamento enviado com sucesso",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
