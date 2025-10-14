import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, subDays } from "date-fns";

interface MetricasComparativasParams {
  arenaId?: string;
  diasPeriodo?: number;
}

export function useMetricasComparativas({ arenaId, diasPeriodo = 30 }: MetricasComparativasParams = {}) {
  const hoje = startOfDay(new Date());
  const inicioAtual = subDays(hoje, diasPeriodo);
  const inicioAnterior = subDays(inicioAtual, diasPeriodo);

  // Agendamentos
  const { data: agendamentos } = useQuery({
    queryKey: ["metricas-agendamentos", arenaId, diasPeriodo],
    queryFn: async () => {
      let query = supabase
        .from("agendamentos")
        .select("data_agendamento, created_at");

      if (arenaId) {
        query = query.eq("arena_id", arenaId);
      }

      const { data } = await query;
      if (!data) return { atual: 0, anterior: 0 };

      const atual = data.filter(
        (a) => new Date(a.created_at) >= inicioAtual
      ).length;

      const anterior = data.filter(
        (a) =>
          new Date(a.created_at) >= inicioAnterior &&
          new Date(a.created_at) < inicioAtual
      ).length;

      return { atual, anterior };
    },
  });

  // Receita
  const { data: receita } = useQuery({
    queryKey: ["metricas-receita", arenaId, diasPeriodo],
    queryFn: async () => {
      let query = supabase
        .from("movimentacoes_financeiras")
        .select("valor, data_movimentacao, tipo");

      if (arenaId) {
        query = query.eq("arena_id", arenaId);
      }

      const { data } = await query.eq("tipo", "receita");
      if (!data) return { atual: 0, anterior: 0 };

      const atual = data
        .filter((m) => new Date(m.data_movimentacao) >= inicioAtual)
        .reduce((sum, m) => sum + Number(m.valor), 0);

      const anterior = data
        .filter(
          (m) =>
            new Date(m.data_movimentacao) >= inicioAnterior &&
            new Date(m.data_movimentacao) < inicioAtual
        )
        .reduce((sum, m) => sum + Number(m.valor), 0);

      return { atual, anterior };
    },
  });

  // Novos clientes
  const { data: clientes } = useQuery({
    queryKey: ["metricas-clientes", arenaId, diasPeriodo],
    queryFn: async () => {
      let query = supabase
        .from("usuarios")
        .select("created_at, arena_id");

      if (arenaId) {
        query = query.eq("arena_id", arenaId);
      }

      const { data } = await query;
      if (!data) return { atual: 0, anterior: 0 };

      const atual = data.filter(
        (u) => new Date(u.created_at) >= inicioAtual
      ).length;

      const anterior = data.filter(
        (u) =>
          new Date(u.created_at) >= inicioAnterior &&
          new Date(u.created_at) < inicioAtual
      ).length;

      return { atual, anterior };
    },
  });

  const calcularVariacao = (atual: number, anterior: number) => {
    if (anterior === 0) return atual > 0 ? 100 : 0;
    return ((atual - anterior) / anterior) * 100;
  };

  return {
    agendamentos: {
      atual: agendamentos?.atual || 0,
      anterior: agendamentos?.anterior || 0,
      variacao: calcularVariacao(
        agendamentos?.atual || 0,
        agendamentos?.anterior || 0
      ),
    },
    receita: {
      atual: receita?.atual || 0,
      anterior: receita?.anterior || 0,
      variacao: calcularVariacao(receita?.atual || 0, receita?.anterior || 0),
    },
    clientes: {
      atual: clientes?.atual || 0,
      anterior: clientes?.anterior || 0,
      variacao: calcularVariacao(clientes?.atual || 0, clientes?.anterior || 0),
    },
  };
}
