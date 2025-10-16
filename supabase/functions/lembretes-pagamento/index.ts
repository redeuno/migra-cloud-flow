import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const hoje = new Date();
    const amanha = new Date(hoje);
    amanha.setDate(hoje.getDate() + 1);

    console.log("Enviando lembretes de pagamento...");

    // Buscar mensalidades que vencem amanhã e ainda estão pendentes
    const { data: mensalidades, error: mensalidadesError } = await supabaseClient
      .from("mensalidades")
      .select(`
        id,
        valor_final,
        data_vencimento,
        contrato_id,
        contratos (
          id,
          usuario_id,
          arena_id,
          usuarios (
            id,
            nome_completo
          )
        )
      `)
      .eq("status_pagamento", "pendente")
      .eq("data_vencimento", amanha.toISOString().split("T")[0]);

    if (mensalidadesError) {
      throw new Error(`Erro ao buscar mensalidades: ${mensalidadesError.message}`);
    }

    console.log(`${mensalidades?.length || 0} mensalidades vencendo amanhã`);

    let lembretesEnviados = 0;

    for (const mensalidade of mensalidades || []) {
      const contrato = mensalidade.contratos as any;
      const usuario = contrato?.usuarios;

      if (!usuario) continue;

      // Criar notificação
      await supabaseClient.from("notificacoes").insert({
        usuario_id: usuario.id,
        arena_id: contrato.arena_id,
        tipo: "lembrete_pagamento",
        titulo: "Pagamento Vencendo Amanhã",
        mensagem: `Olá ${usuario.nome_completo}, sua mensalidade de R$ ${mensalidade.valor_final} vence amanhã.`,
        link: "/meu-financeiro",
        metadata: {
          mensalidade_id: mensalidade.id,
          valor: mensalidade.valor_final,
          data_vencimento: mensalidade.data_vencimento,
        },
      });

      lembretesEnviados++;
    }

    // Buscar mensalidades vencidas há 3 dias
    const tresDiasAtras = new Date(hoje);
    tresDiasAtras.setDate(hoje.getDate() - 3);

    const { data: mensalidadesVencidas, error: vencidasError } = await supabaseClient
      .from("mensalidades")
      .select(`
        id,
        valor_final,
        data_vencimento,
        contrato_id,
        contratos (
          id,
          usuario_id,
          arena_id,
          usuarios (
            id,
            nome_completo
          )
        )
      `)
      .eq("status_pagamento", "pendente")
      .eq("data_vencimento", tresDiasAtras.toISOString().split("T")[0]);

    if (vencidasError) {
      throw new Error(`Erro ao buscar mensalidades vencidas: ${vencidasError.message}`);
    }

    console.log(`${mensalidadesVencidas?.length || 0} mensalidades vencidas há 3 dias`);

    for (const mensalidade of mensalidadesVencidas || []) {
      const contrato = mensalidade.contratos as any;
      const usuario = contrato?.usuarios;

      if (!usuario) continue;

      // Atualizar status para atrasado
      await supabaseClient
        .from("mensalidades")
        .update({ status_pagamento: "atrasado" })
        .eq("id", mensalidade.id);

      // Notificar
      await supabaseClient.from("notificacoes").insert({
        usuario_id: usuario.id,
        arena_id: contrato.arena_id,
        tipo: "pagamento_atrasado",
        titulo: "Pagamento Atrasado",
        mensagem: `${usuario.nome_completo}, seu pagamento de R$ ${mensalidade.valor_final} está atrasado.`,
        link: "/meu-financeiro",
        metadata: {
          mensalidade_id: mensalidade.id,
          valor: mensalidade.valor_final,
          data_vencimento: mensalidade.data_vencimento,
          dias_atraso: 3,
        },
      });

      lembretesEnviados++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        lembretesEnviados,
        mensalidadesVencendo: mensalidades?.length || 0,
        mensalidadesAtrasadas: mensalidadesVencidas?.length || 0,
        data: hoje.toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Erro na função lembretes-pagamento:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
