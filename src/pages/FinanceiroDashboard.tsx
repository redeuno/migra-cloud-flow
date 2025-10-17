import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Users, Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { startOfMonth, endOfMonth, format, subMonths } from "date-fns";

export default function FinanceiroDashboard() {
  const { arenaId } = useAuth();

  // Receitas do mês atual
  const { data: receitasMes } = useQuery({
    queryKey: ["receitas-mes", arenaId],
    queryFn: async () => {
      const inicio = startOfMonth(new Date());
      const fim = endOfMonth(new Date());

      const { data, error } = await supabase
        .from("movimentacoes_financeiras")
        .select("valor")
        .eq("arena_id", arenaId)
        .eq("tipo", "receita")
        .gte("data_movimentacao", format(inicio, "yyyy-MM-dd"))
        .lte("data_movimentacao", format(fim, "yyyy-MM-dd"));

      if (error) throw error;
      return data.reduce((acc, mov) => acc + Number(mov.valor), 0);
    },
    enabled: !!arenaId,
  });

  // Despesas do mês atual
  const { data: despesasMes } = useQuery({
    queryKey: ["despesas-mes", arenaId],
    queryFn: async () => {
      const inicio = startOfMonth(new Date());
      const fim = endOfMonth(new Date());

      const { data, error } = await supabase
        .from("movimentacoes_financeiras")
        .select("valor")
        .eq("arena_id", arenaId)
        .eq("tipo", "despesa")
        .gte("data_movimentacao", format(inicio, "yyyy-MM-dd"))
        .lte("data_movimentacao", format(fim, "yyyy-MM-dd"));

      if (error) throw error;
      return data.reduce((acc, mov) => acc + Number(mov.valor), 0);
    },
    enabled: !!arenaId,
  });

  // Mensalidades pendentes
  const { data: mensalidadesPendentes } = useQuery({
    queryKey: ["mensalidades-pendentes", arenaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mensalidades")
        .select("valor, contratos!inner(arena_id)")
        .eq("contratos.arena_id", arenaId)
        .in("status_pagamento", ["pendente", "vencido"]);

      if (error) throw error;
      return {
        total: data.reduce((acc, m) => acc + Number(m.valor), 0),
        quantidade: data.length,
      };
    },
    enabled: !!arenaId,
  });

  // Inadimplência
  const { data: inadimplencia } = useQuery({
    queryKey: ["inadimplencia", arenaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mensalidades")
        .select("valor, contratos!inner(arena_id)")
        .eq("contratos.arena_id", arenaId)
        .eq("status_pagamento", "vencido")
        .lt("data_vencimento", format(new Date(), "yyyy-MM-dd"));

      if (error) throw error;
      return {
        total: data.reduce((acc, m) => acc + Number(m.valor), 0),
        quantidade: data.length,
      };
    },
    enabled: !!arenaId,
  });

  // Evolução mensal (últimos 6 meses)
  const { data: evolucaoMensal } = useQuery({
    queryKey: ["evolucao-mensal", arenaId],
    queryFn: async () => {
      const meses = [];
      for (let i = 5; i >= 0; i--) {
        const data = subMonths(new Date(), i);
        const inicio = startOfMonth(data);
        const fim = endOfMonth(data);

        const { data: receitas } = await supabase
          .from("movimentacoes_financeiras")
          .select("valor")
          .eq("arena_id", arenaId)
          .eq("tipo", "receita")
          .gte("data_movimentacao", format(inicio, "yyyy-MM-dd"))
          .lte("data_movimentacao", format(fim, "yyyy-MM-dd"));

        const { data: despesas } = await supabase
          .from("movimentacoes_financeiras")
          .select("valor")
          .eq("arena_id", arenaId)
          .eq("tipo", "despesa")
          .gte("data_movimentacao", format(inicio, "yyyy-MM-dd"))
          .lte("data_movimentacao", format(fim, "yyyy-MM-dd"));

        meses.push({
          mes: format(data, "MMM/yy"),
          receitas: receitas?.reduce((acc, r) => acc + Number(r.valor), 0) || 0,
          despesas: despesas?.reduce((acc, d) => acc + Number(d.valor), 0) || 0,
        });
      }
      return meses;
    },
    enabled: !!arenaId,
  });

  // Distribuição por categoria
  const { data: distribuicaoCategorias } = useQuery({
    queryKey: ["distribuicao-categorias", arenaId],
    queryFn: async () => {
      const inicio = startOfMonth(new Date());
      const fim = endOfMonth(new Date());

      const { data, error } = await supabase
        .from("movimentacoes_financeiras")
        .select("valor, tipo, categorias_financeiras(nome)")
        .eq("arena_id", arenaId)
        .gte("data_movimentacao", format(inicio, "yyyy-MM-dd"))
        .lte("data_movimentacao", format(fim, "yyyy-MM-dd"));

      if (error) throw error;

      const categorias = data.reduce((acc: any, mov: any) => {
        const categoria = mov.categorias_financeiras?.nome || "Sem categoria";
        if (!acc[categoria]) {
          acc[categoria] = 0;
        }
        acc[categoria] += Number(mov.valor);
        return acc;
      }, {});

      return Object.entries(categorias).map(([name, value]) => ({
        name,
        value: Number(value),
      }));
    },
    enabled: !!arenaId,
  });

  const saldoMes = (receitasMes || 0) - (despesasMes || 0);
  const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted))"];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard Financeiro</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Visão completa das finanças da arena
          </p>
        </div>

        {/* KPIs Principais */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Receitas do Mês"
            value={formatCurrency(receitasMes || 0)}
            icon={TrendingUp}
            description={`Saldo: ${formatCurrency(saldoMes)}`}
          />
          <MetricCard
            title="Despesas do Mês"
            value={formatCurrency(despesasMes || 0)}
            icon={TrendingDown}
          />
          <MetricCard
            title="A Receber"
            value={formatCurrency(mensalidadesPendentes?.total || 0)}
            icon={Calendar}
            description={`${mensalidadesPendentes?.quantidade || 0} mensalidades`}
          />
          <MetricCard
            title="Inadimplência"
            value={formatCurrency(inadimplencia?.total || 0)}
            icon={AlertCircle}
            description={`${inadimplencia?.quantidade || 0} vencidas`}
          />
        </div>

        {/* Gráficos */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Evolução Mensal */}
          <Card>
            <CardHeader>
              <CardTitle>Evolução Financeira</CardTitle>
              <CardDescription>Receitas e despesas dos últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={evolucaoMensal}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Bar dataKey="receitas" fill="hsl(var(--primary))" name="Receitas" />
                  <Bar dataKey="despesas" fill="hsl(var(--destructive))" name="Despesas" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Distribuição por Categoria */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Categoria</CardTitle>
              <CardDescription>Movimentações do mês atual</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={distribuicaoCategorias}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {distribuicaoCategorias?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Inadimplência */}
        {inadimplencia && inadimplencia.quantidade > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Alerta de Inadimplência
              </CardTitle>
              <CardDescription>
                {inadimplencia.quantidade} mensalidades vencidas totalizando {formatCurrency(inadimplencia.total)}
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </Layout>
  );
}
