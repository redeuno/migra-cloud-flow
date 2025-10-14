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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log("🔔 Iniciando busca de agendamentos próximos (15 minutos)...");

    // Buscar agendamentos que começam em 15 minutos
    const agora = new Date();
    const em15min = new Date(agora.getTime() + 15 * 60 * 1000);

    const dataAgendamento = em15min.toISOString().split("T")[0];
    const horaInicio = em15min.toTimeString().substring(0, 5);

    console.log(`Buscando agendamentos para ${dataAgendamento} às ${horaInicio}...`);

    const { data: agendamentos, error: agendamentosError } = await supabase
      .from("agendamentos")
      .select(`
        id,
        data_agendamento,
        hora_inicio,
        cliente_id,
        arena_id,
        quadra_id,
        lembrete_enviado,
        status
      `)
      .eq("data_agendamento", dataAgendamento)
      .eq("hora_inicio", horaInicio)
      .eq("status", "confirmado")
      .eq("lembrete_enviado", false);

    if (agendamentosError) {
      console.error("Erro ao buscar agendamentos:", agendamentosError);
      throw agendamentosError;
    }

    console.log(`✅ Encontrados ${agendamentos?.length || 0} agendamentos`);

    if (!agendamentos || agendamentos.length === 0) {
      return new Response(
        JSON.stringify({ message: "Nenhum agendamento próximo", count: 0 }),
        {
          headers: { "Content-Type": "application/json", ...corsHeaders },
          status: 200,
        }
      );
    }

    // Criar notificações
    const notificacoesCriadas = [];

    for (const agendamento of agendamentos) {
      try {
        // Buscar dados completos do agendamento
        const { data: usuario } = await supabase
          .from("usuarios")
          .select("id, nome_completo")
          .eq("id", agendamento.cliente_id)
          .single();

        const { data: quadra } = await supabase
          .from("quadras")
          .select("numero, nome")
          .eq("id", agendamento.quadra_id)
          .single();

        if (!usuario || !quadra) {
          console.error(`Dados incompletos para agendamento ${agendamento.id}`);
          continue;
        }

        const quadraInfo = `Quadra ${quadra.numero} - ${quadra.nome}`;
        
        // Criar notificação
        const { error: notifError } = await supabase
          .from("notificacoes")
          .insert({
            usuario_id: usuario.id,
            arena_id: agendamento.arena_id,
            tipo: "agendamento_lembrete",
            titulo: "Seu agendamento está próximo!",
            mensagem: `Seu horário em ${quadraInfo} começa em 15 minutos (${horaInicio})`,
            link: "/agendamentos",
            metadata: {
              agendamento_id: agendamento.id,
              quadra_info: quadraInfo,
              hora_inicio: horaInicio,
            },
          });

        if (notifError) {
          console.error(`Erro ao criar notificação para agendamento ${agendamento.id}:`, notifError);
        } else {
          // Marcar lembrete como enviado
          await supabase
            .from("agendamentos")
            .update({ lembrete_enviado: true })
            .eq("id", agendamento.id);

          notificacoesCriadas.push(agendamento.id);
          console.log(`✅ Notificação criada para ${usuario.nome_completo}`);
        }
      } catch (err) {
        console.error(`Erro ao processar agendamento ${agendamento.id}:`, err);
      }
    }

    return new Response(
      JSON.stringify({
        message: "Notificações processadas",
        total: agendamentos.length,
        enviadas: notificacoesCriadas.length,
        ids: notificacoesCriadas,
      }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("❌ Erro na edge function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 500,
      }
    );
  }
});
