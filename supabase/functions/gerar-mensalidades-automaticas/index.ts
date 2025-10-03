import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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
    const diaAtual = hoje.getDate();
    const competencia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    console.log(`Gerando mensalidades para dia ${diaAtual}...`);

    // Buscar todos os contratos ativos cujo dia de vencimento é hoje
    const { data: contratos, error: contratosError } = await supabaseClient
      .from("contratos")
      .select("*")
      .eq("status", "ativo")
      .eq("dia_vencimento", diaAtual);

    if (contratosError) {
      throw new Error(`Erro ao buscar contratos: ${contratosError.message}`);
    }

    console.log(`${contratos?.length || 0} contratos encontrados`);

    let mensalidadesCriadas = 0;
    let mensalidadesIgnoradas = 0;

    for (const contrato of contratos || []) {
      // Verificar se já existe mensalidade para este mês
      const { data: existente } = await supabaseClient
        .from("mensalidades")
        .select("id")
        .eq("contrato_id", contrato.id)
        .eq("referencia", competencia.toISOString().split("T")[0])
        .maybeSingle();

      if (existente) {
        console.log(
          `Mensalidade já existe para contrato ${contrato.numero_contrato}`
        );
        mensalidadesIgnoradas++;
        continue;
      }

      // Calcular valor final com desconto
      const valorBase = contrato.valor_mensal;
      const descontoValor =
        (valorBase * (contrato.desconto_percentual || 0)) / 100;
      const valorFinal = valorBase - descontoValor;

      // Criar nova mensalidade
      const { error: insertError } = await supabaseClient
        .from("mensalidades")
        .insert({
          contrato_id: contrato.id,
          referencia: competencia.toISOString().split("T")[0],
          data_vencimento: new Date(
            hoje.getFullYear(),
            hoje.getMonth(),
            contrato.dia_vencimento
          ).toISOString().split("T")[0],
          valor: valorBase,
          desconto: descontoValor,
          acrescimo: 0,
          valor_final: valorFinal,
          status_pagamento: "pendente",
        });

      if (insertError) {
        console.error(
          `Erro ao criar mensalidade para ${contrato.numero_contrato}:`,
          insertError
        );
        continue;
      }

      console.log(
        `Mensalidade criada para contrato ${contrato.numero_contrato}`
      );
      mensalidadesCriadas++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        mensalidadesCriadas,
        mensalidadesIgnoradas,
        totalContratos: contratos?.length || 0,
        data: hoje.toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Erro na função gerar-mensalidades-automaticas:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
