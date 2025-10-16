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
    const tresDiasDepois = new Date(hoje);
    tresDiasDepois.setDate(hoje.getDate() + 3);

    console.log("Verificando vencimentos de arenas...");

    // Buscar arenas que vencem em 3 dias
    const { data: arenasVencendo, error: vencendoError } = await supabaseClient
      .from("arenas")
      .select("id, nome, data_vencimento")
      .eq("status", "ativo")
      .lte("data_vencimento", tresDiasDepois.toISOString().split("T")[0])
      .gte("data_vencimento", hoje.toISOString().split("T")[0]);

    if (vencendoError) {
      throw new Error(`Erro ao buscar arenas vencendo: ${vencendoError.message}`);
    }

    console.log(`${arenasVencendo?.length || 0} arenas vencendo em breve`);

    // Criar notificações para arena_admins
    for (const arena of arenasVencendo || []) {
      const diasRestantes = Math.ceil(
        (new Date(arena.data_vencimento).getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Buscar admins da arena
      const { data: admins } = await supabaseClient
        .from("user_roles")
        .select("user_id")
        .eq("arena_id", arena.id)
        .eq("role", "arena_admin");

      for (const admin of admins || []) {
        await supabaseClient.from("notificacoes").insert({
          usuario_id: admin.user_id,
          arena_id: arena.id,
          tipo: "vencimento_proximo",
          titulo: "Assinatura Vencendo",
          mensagem: `A assinatura de ${arena.nome} vence em ${diasRestantes} dia(s)!`,
          link: "/configuracoes?tab=assinatura",
          metadata: {
            arena_id: arena.id,
            data_vencimento: arena.data_vencimento,
            dias_restantes: diasRestantes,
          },
        });
      }
    }

    // Buscar arenas vencidas
    const { data: arenasVencidas, error: vencidasError } = await supabaseClient
      .from("arenas")
      .select("id, nome, data_vencimento")
      .eq("status", "ativo")
      .lt("data_vencimento", hoje.toISOString().split("T")[0]);

    if (vencidasError) {
      throw new Error(`Erro ao buscar arenas vencidas: ${vencidasError.message}`);
    }

    console.log(`${arenasVencidas?.length || 0} arenas vencidas para suspender`);

    // Suspender arenas vencidas
    for (const arena of arenasVencidas || []) {
      await supabaseClient
        .from("arenas")
        .update({ status: "suspenso" })
        .eq("id", arena.id);

      // Notificar admins
      const { data: admins } = await supabaseClient
        .from("user_roles")
        .select("user_id")
        .eq("arena_id", arena.id)
        .eq("role", "arena_admin");

      for (const admin of admins || []) {
        await supabaseClient.from("notificacoes").insert({
          usuario_id: admin.user_id,
          arena_id: arena.id,
          tipo: "assinatura_vencida",
          titulo: "Arena Suspensa",
          mensagem: `A arena ${arena.nome} foi suspensa por falta de pagamento.`,
          link: "/configuracoes?tab=assinatura",
          metadata: {
            arena_id: arena.id,
            data_vencimento: arena.data_vencimento,
          },
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        arenasVencendo: arenasVencendo?.length || 0,
        arenasSuspensas: arenasVencidas?.length || 0,
        data: hoje.toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Erro na função verificar-vencimentos-arena:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
