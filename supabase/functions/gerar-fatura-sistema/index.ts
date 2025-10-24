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
    const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY");
    if (!ASAAS_API_KEY) {
      throw new Error("ASAAS_API_KEY não configurado");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const hoje = new Date();
    const competencia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const diaVencimento = 5; // Dia 5 de cada mês

    console.log(`Gerando faturas do sistema para competência ${competencia.toISOString().split("T")[0]}...`);

    // Buscar todas as assinaturas ativas
    const { data: assinaturas, error: assinaturasError } =
      await supabaseClient
        .from("assinaturas_arena")
        .select("*, arenas(*)")
        .eq("status", "ativo");

    if (assinaturasError) {
      throw new Error(
        `Erro ao buscar assinaturas: ${assinaturasError.message}`
      );
    }

    console.log(`${assinaturas?.length || 0} assinaturas ativas encontradas`);

    let faturasCriadas = 0;
    let faturasIgnoradas = 0;

    for (const assinatura of assinaturas || []) {
      // Verificar se já existe fatura para este mês
      const { data: existente } = await supabaseClient
        .from("faturas_sistema")
        .select("id")
        .eq("assinatura_arena_id", assinatura.id)
        .eq("competencia", competencia.toISOString().split("T")[0])
        .maybeSingle();

      if (existente) {
        console.log(
          `Fatura já existe para assinatura ${assinatura.numero_assinatura}`
        );
        faturasIgnoradas++;
        continue;
      }

      const arena = assinatura.arenas;

      // Verificar se a arena tem customer_id no Asaas
      let customerId = assinatura.asaas_customer_id;

      if (!customerId) {
        // Criar ou buscar cliente no Asaas
        const customerResponse = await fetch(
          "https://api.asaas.com/v3/customers",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              access_token: ASAAS_API_KEY,
            },
            body: JSON.stringify({
              name: arena.razao_social,
              email: arena.email,
              cpfCnpj: arena.cnpj,
              phone: arena.telefone,
            }),
          }
        );

        if (!customerResponse.ok) {
          const errorText = await customerResponse.text();
          console.error(
            `Erro ao criar cliente Asaas para ${arena.nome}:`,
            errorText
          );
          continue;
        }

        const customer = await customerResponse.json();
        customerId = customer.id;

        // Atualizar assinatura com customer_id
        await supabaseClient
          .from("assinaturas_arena")
          .update({ asaas_customer_id: customerId })
          .eq("id", assinatura.id);

        console.log(`Cliente Asaas criado para ${arena.nome}: ${customerId}`);
      }

      // Criar cobrança no Asaas
      const dataVencimento = new Date(
        hoje.getFullYear(),
        hoje.getMonth(),
        diaVencimento
      ).toISOString().split("T")[0];

      const paymentResponse = await fetch(
        "https://api.asaas.com/v3/payments",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            access_token: ASAAS_API_KEY,
          },
          body: JSON.stringify({
            customer: customerId,
            billingType: "BOLETO",
            dueDate: dataVencimento,
            value: assinatura.valor_mensal,
            description: `Assinatura Verana - ${arena.nome} - ${competencia.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`,
          }),
        }
      );

      if (!paymentResponse.ok) {
        const errorText = await paymentResponse.text();
        console.error(
          `Erro ao criar cobrança Asaas para ${arena.nome}:`,
          errorText
        );
        continue;
      }

      const payment = await paymentResponse.json();
      console.log(`Cobrança criada no Asaas para ${arena.nome}: ${payment.id}`);

      // Criar fatura no Supabase
      const { error: insertError } = await supabaseClient
        .from("faturas_sistema")
        .insert({
          assinatura_arena_id: assinatura.id,
          arena_id: assinatura.arena_id,
          competencia: competencia.toISOString().split("T")[0],
          data_vencimento: dataVencimento,
          valor: assinatura.valor_mensal,
          status_pagamento: "pendente",
          asaas_payment_id: payment.id,
          asaas_bankslip_url: payment.bankSlipUrl,
          asaas_invoice_url: payment.invoiceUrl,
          linha_digitavel: payment.identificationField,
          historico_status: [
            {
              evento: "PAYMENT_CREATED",
              status: "pendente",
              data: new Date().toISOString(),
              dados_asaas: payment,
            },
          ],
        });

      if (insertError) {
        console.error(
          `Erro ao criar fatura para ${arena.nome}:`,
          insertError
        );
        continue;
      }

      console.log(`Fatura criada para ${arena.nome}`);
      faturasCriadas++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        faturasCriadas,
        faturasIgnoradas,
        totalAssinaturas: assinaturas?.length || 0,
        competencia: competencia.toISOString().split("T")[0],
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Erro na função gerar-fatura-sistema:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
