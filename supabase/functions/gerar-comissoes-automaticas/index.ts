import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Professor {
  id: string;
  arena_id: string;
  percentual_comissao_padrao: number;
}

interface Aula {
  id: string;
  valor_por_aluno: number;
  presencas: any[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Iniciando geração automática de comissões...");

    // Buscar todas as arenas ativas
    const { data: arenas, error: arenasError } = await supabase
      .from("arenas")
      .select("id")
      .eq("status", "ativo");

    if (arenasError) throw arenasError;

    let totalComissoes = 0;

    // Para cada arena, gerar comissões do mês anterior
    for (const arena of arenas || []) {
      console.log(`Processando arena ${arena.id}`);

      // Buscar professores ativos da arena
      const { data: professores, error: profError } = await supabase
        .from("professores")
        .select("id, arena_id, percentual_comissao_padrao")
        .eq("arena_id", arena.id)
        .eq("status", "ativo");

      if (profError) {
        console.error(`Erro ao buscar professores: ${profError.message}`);
        continue;
      }

      // Calcular data de referência (mês anterior)
      const hoje = new Date();
      const mesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
      const inicioMes = mesPassado.toISOString().split("T")[0];
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
        .toISOString()
        .split("T")[0];

      const comissoes = [];

      for (const professor of professores || []) {
        // Buscar aulas realizadas do professor no mês
        const { data: aulas, error: aulasError } = await supabase
          .from("aulas")
          .select("id, valor_por_aluno, presencas")
          .eq("professor_id", professor.id)
          .eq("arena_id", arena.id)
          .gte("data_aula", inicioMes)
          .lt("data_aula", fimMes)
          .eq("realizada", true);

        if (aulasError) {
          console.error(`Erro ao buscar aulas: ${aulasError.message}`);
          continue;
        }

        if (!aulas || aulas.length === 0) continue;

        // Calcular valor total
        const valorTotal = aulas.reduce((sum: number, aula: Aula) => {
          const presencas = (aula.presencas as any[]) || [];
          const valorAula = presencas.length * Number(aula.valor_por_aluno);
          return sum + valorAula;
        }, 0);

        const percentual = Number(professor.percentual_comissao_padrao || 30);
        const valorComissao = (valorTotal * percentual) / 100;

        comissoes.push({
          professor_id: professor.id,
          arena_id: arena.id,
          referencia: inicioMes,
          valor_aulas: valorTotal,
          percentual_comissao: percentual,
          valor_comissao: valorComissao,
          status: "pendente",
          metadata: {
            gerado_automaticamente: true,
            data_geracao: new Date().toISOString(),
            total_aulas: aulas.length,
          },
        });
      }

      if (comissoes.length > 0) {
        const { error: insertError } = await supabase
          .from("comissoes_professores")
          .insert(comissoes);

        if (insertError) {
          console.error(`Erro ao inserir comissões: ${insertError.message}`);
        } else {
          totalComissoes += comissoes.length;
          console.log(`${comissoes.length} comissões geradas para arena ${arena.id}`);
        }
      }
    }

    console.log(`Total de comissões geradas: ${totalComissoes}`);

    return new Response(
      JSON.stringify({
        success: true,
        totalComissoes,
        message: `${totalComissoes} comissões geradas com sucesso`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Erro na geração de comissões:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.toString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
