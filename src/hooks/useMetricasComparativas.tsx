import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, startOfDay } from "date-fns";

interface MetricasComparativasParams {
  arenaId?: string;
  diasPeriodo?: number; // Dias do período atual (padrão: 30)
}

export function useMetricasComparativas({ arenaId, diasPeriodo = 30 }: MetricasComparativasParams = {}) {
  return useQuery({
    queryKey: ["metricas-comparativas", arenaId, diasPeriodo],
    queryFn: async () => {
      const hoje = new Date();
      const inicioAtual = startOfDay(subDays(hoje, diasPeriodo));
      const inicioAnterior = startOfDay(subDays(hoje, diasPeriodo * 2));
      const fimAnterior = startOfDay(subDays(hoje, diasPeriodo));

      // Agendamentos - período atual
      const { count: agendamentosAtual } = await supabase
        .from("agendamentos")
        .select("*", { count: "exact", head: true })
        .eq(arenaId ? "arena_id" : "id", arenaId || "")
        .gte("data_agendamento", inicioAtual.toISOString().split("T")[0])
        .lte("data_agendamento", hoje.toISOString().split("T")[0]);

      // Agendamentos - período anterior
      const { count: agendamentosAnterior } = await supabase
        .from("agendamentos")
        .select("*", { count: "exact", head: true })
        .eq(arenaId ? "arena_id" : "id", arenaId || "")
        .gte("data_agendamento", inicioAnterior.toISOString().split("T")[0])
        .lt("data_agendamento", fimAnterior.toISOString().split("T")[0]);

      // Receita - período atual
      const { data: receitaAtualData } = await supabase
        .from("agendamentos")
        .select("valor_total")
        .eq(arenaId ? "arena_id" : "id", arenaId || "")
        .eq("status_pagamento", "pago")
        .gte("data_agendamento", inicioAtual.toISOString().split("T")[0])
        .lte("data_agendamento", hoje.toISOString().split("T")[0]);

      const receitaAtual = receitaAtualData?.reduce((sum, a) => sum + Number(a.valor_total), 0) || 0;

      // Receita - período anterior
      const { data: receitaAnteriorData } = await supabase
        .from("agendamentos")
        .select("valor_total")
        .eq(arenaId ? "arena_id" : "id", arenaId || "")
        .eq("status_pagamento", "pago")
        .gte("data_agendamento", inicioAnterior.toISOString().split("T")[0])
        .lt("data_agendamento", fimAnterior.toISOString().split("T")[0]);

      const receitaAnterior = receitaAnteriorData?.reduce((sum, a) => sum + Number(a.valor_total), 0) || 0;

      // Clientes novos - período atual
      const { count: clientesAtual } = await supabase
        .from("usuarios")
        .select("*", { count: "exact", head: true })
        .eq(arenaId ? "arena_id" : "id", arenaId || "")
        .gte("created_at", inicioAtual.toISOString());

      // Clientes novos - período anterior
      const { count: clientesAnterior } = await supabase
        .from("usuarios")
        .select("*", { count: "exact", head: true })
        .eq(arenaId ? "arena_id" : "id", arenaId || "")
        .gte("created_at", inicioAnterior.toISOString())
        .lt("created_at", fimAnterior.toISOString());

      // Calcular percentuais
      const calcularPercentual = (atual: number, anterior: number) => {
        if (anterior === 0) return atual > 0 ? 100 : 0;
        return ((atual - anterior) / anterior) * 100;
      };

      return {
        agendamentos: {
          atual: agendamentosAtual || 0,
          anterior: agendamentosAnterior || 0,
          percentual: calcularPercentual(agendamentosAtual || 0, agendamentosAnterior || 0),
        },
        receita: {
          atual: receitaAtual,
          anterior: receitaAnterior,
          percentual: calcularPercentual(receitaAtual, receitaAnterior),
        },
        clientes: {
          atual: clientesAtual || 0,
          anterior: clientesAnterior || 0,
          percentual: calcularPercentual(clientesAtual || 0, clientesAnterior || 0),
        },
      };
    },
    enabled: true,
  });
}
