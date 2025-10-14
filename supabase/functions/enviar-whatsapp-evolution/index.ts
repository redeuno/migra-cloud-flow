import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WhatsAppRequest {
  arena_id: string;
  numero: string;
  mensagem: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { arena_id, numero, mensagem }: WhatsAppRequest = await req.json();

    console.log(`📱 Enviando WhatsApp para ${numero} (Arena: ${arena_id})`);

    // Buscar configuração da arena
    const { data: config, error: configError } = await supabase
      .from("configuracoes_arena")
      .select("*")
      .eq("arena_id", arena_id)
      .single();

    if (configError || !config) {
      console.error("Configuração não encontrada para arena:", arena_id);
      throw new Error("Configuração Evolution API não encontrada");
    }

    if (!config.evolution_api_enabled || !config.notificacoes_whatsapp_enabled) {
      console.log("WhatsApp desabilitado para esta arena");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "WhatsApp não está habilitado" 
        }),
        {
          headers: { "Content-Type": "application/json", ...corsHeaders },
          status: 200,
        }
      );
    }

    // Formatar número (remover caracteres especiais)
    const numeroLimpo = numero.replace(/\D/g, "");
    const numeroCompleto = numeroLimpo.startsWith("55") 
      ? `${numeroLimpo}@s.whatsapp.net`
      : `55${numeroLimpo}@s.whatsapp.net`;

    // Enviar mensagem via Evolution API
    const evolutionUrl = `${config.evolution_api_url}/message/sendText/${config.evolution_instance_name}`;
    
    console.log(`Enviando para Evolution API: ${evolutionUrl}`);

    const response = await fetch(evolutionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": config.evolution_api_key,
      },
      body: JSON.stringify({
        number: numeroCompleto,
        text: mensagem,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro da Evolution API:", errorText);
      throw new Error(`Evolution API error: ${response.status}`);
    }

    const result = await response.json();
    console.log("✅ Mensagem enviada com sucesso:", result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Mensagem enviada",
        evolution_response: result 
      }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("❌ Erro ao enviar WhatsApp:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 500,
      }
    );
  }
});
