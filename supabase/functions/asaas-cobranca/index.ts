import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CobrancaRequest {
  contratoId: string;
  mensalidadeId: string;
  valor: number;
  vencimento: string;
  clienteNome: string;
  clienteEmail: string;
  clienteCpf: string;
}

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

    const {
      contratoId,
      mensalidadeId,
      valor,
      vencimento,
      clienteNome,
      clienteEmail,
      clienteCpf,
    }: CobrancaRequest = await req.json();

    console.log("Criando cobrança no Asaas:", {
      valor,
      vencimento,
      clienteEmail,
    });

    // Criar ou obter cliente no Asaas
    const customerResponse = await fetch(
      "https://api.asaas.com/v3/customers",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          access_token: ASAAS_API_KEY,
        },
        body: JSON.stringify({
          name: clienteNome,
          email: clienteEmail,
          cpfCnpj: clienteCpf,
        }),
      }
    );

    if (!customerResponse.ok) {
      const errorText = await customerResponse.text();
      console.error("Erro ao criar cliente Asaas:", errorText);
      throw new Error(`Erro ao criar cliente: ${errorText}`);
    }

    const customer = await customerResponse.json();
    console.log("Cliente Asaas criado/encontrado:", customer.id);

    // Criar cobrança
    const paymentResponse = await fetch(
      "https://api.asaas.com/v3/payments",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          access_token: ASAAS_API_KEY,
        },
        body: JSON.stringify({
          customer: customer.id,
          billingType: "BOLETO",
          dueDate: vencimento,
          value: valor,
          description: `Mensalidade - Contrato ${contratoId.substring(0, 8)}`,
          externalReference: mensalidadeId,
        }),
      }
    );

    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text();
      console.error("Erro ao criar cobrança Asaas:", errorText);
      throw new Error(`Erro ao criar cobrança: ${errorText}`);
    }

    const payment = await paymentResponse.json();
    console.log("Cobrança criada no Asaas:", payment.id);

    // Atualizar mensalidade no Supabase com dados do Asaas
    const { error: updateError } = await supabaseClient
      .from("mensalidades")
      .update({
        observacoes: `ID Asaas: ${payment.id} | ${payment.bankSlipUrl || ""}`,
      })
      .eq("id", mensalidadeId);

    if (updateError) {
      console.error("Erro ao atualizar mensalidade:", updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        asaasId: payment.id,
        invoiceUrl: payment.invoiceUrl,
        bankSlipUrl: payment.bankSlipUrl,
        pixQrCode: payment.pixQrCodeId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Erro na função asaas-cobranca:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
