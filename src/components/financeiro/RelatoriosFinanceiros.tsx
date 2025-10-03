import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export function RelatoriosFinanceiros() {
  const { arenaId } = useAuth();
  const [periodo, setPeriodo] = useState("mes-atual");

  const { data: resumoFinanceiro } = useQuery({
    queryKey: ["relatorio-financeiro", arenaId, periodo],
    queryFn: async () => {
      const hoje = new Date();
      let dataInicio: Date;
      let dataFim = hoje;

      switch (periodo) {
        case "mes-atual":
          dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
          break;
        case "mes-anterior":
          dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
          dataFim = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
          break;
        case "trimestre":
          dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 3, 1);
          break;
        case "ano":
          dataInicio = new Date(hoje.getFullYear(), 0, 1);
          break;
        default:
          dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      }

      const { data: movimentacoes, error } = await supabase
        .from("movimentacoes_financeiras")
        .select("*")
        .eq("arena_id", arenaId!)
        .gte("data_movimentacao", dataInicio.toISOString().split("T")[0])
        .lte("data_movimentacao", dataFim.toISOString().split("T")[0]);

      if (error) throw error;

      const receitas = movimentacoes?.filter((m) => m.tipo === "receita") || [];
      const despesas = movimentacoes?.filter((m) => m.tipo === "despesa") || [];

      const totalReceitas = receitas.reduce((sum, m) => sum + m.valor, 0);
      const totalDespesas = despesas.reduce((sum, m) => sum + m.valor, 0);

      // Receitas por categoria
      const receitasPorCategoria = receitas.reduce((acc: any, m) => {
        acc[m.categoria] = (acc[m.categoria] || 0) + m.valor;
        return acc;
      }, {});

      // Despesas por categoria
      const despesasPorCategoria = despesas.reduce((acc: any, m) => {
        acc[m.categoria] = (acc[m.categoria] || 0) + m.valor;
        return acc;
      }, {});

      return {
        totalReceitas,
        totalDespesas,
        saldo: totalReceitas - totalDespesas,
        receitasPorCategoria,
        despesasPorCategoria,
        movimentacoes,
      };
    },
    enabled: !!arenaId,
  });

  const { data: fluxoCaixa } = useQuery({
    queryKey: ["fluxo-caixa", arenaId],
    queryFn: async () => {
      const meses = [];
      const hoje = new Date();

      for (let i = 5; i >= 0; i--) {
        const mes = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        const mesProximo = new Date(hoje.getFullYear(), hoje.getMonth() - i + 1, 0);

        const { data: movimentacoes } = await supabase
          .from("movimentacoes_financeiras")
          .select("tipo, valor")
          .eq("arena_id", arenaId!)
          .gte("data_movimentacao", mes.toISOString().split("T")[0])
          .lte("data_movimentacao", mesProximo.toISOString().split("T")[0]);

        const receitas = movimentacoes?.filter((m) => m.tipo === "receita").reduce((sum, m) => sum + m.valor, 0) || 0;
        const despesas = movimentacoes?.filter((m) => m.tipo === "despesa").reduce((sum, m) => sum + m.valor, 0) || 0;

        meses.push({
          mes: mes.toLocaleDateString("pt-BR", { month: "short" }),
          receitas,
          despesas,
          saldo: receitas - despesas,
        });
      }

      return meses;
    },
    enabled: !!arenaId,
  });

  const receitasChartData = resumoFinanceiro
    ? Object.entries(resumoFinanceiro.receitasPorCategoria).map(([categoria, valor]) => ({
        name: categoria,
        value: valor,
      }))
    : [];

  const despesasChartData = resumoFinanceiro
    ? Object.entries(resumoFinanceiro.despesasPorCategoria).map(([categoria, valor]) => ({
        name: categoria,
        value: valor,
      }))
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Relatórios Financeiros</h2>
          <p className="text-muted-foreground">Análise detalhada das finanças</p>
        </div>
        <div className="flex gap-2">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mes-atual">Mês Atual</SelectItem>
              <SelectItem value="mes-anterior">Mês Anterior</SelectItem>
              <SelectItem value="trimestre">Último Trimestre</SelectItem>
              <SelectItem value="ano">Ano Atual</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total de Receitas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {resumoFinanceiro?.totalReceitas.toFixed(2) || "0.00"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total de Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {resumoFinanceiro?.totalDespesas.toFixed(2) || "0.00"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(resumoFinanceiro?.saldo || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
              R$ {resumoFinanceiro?.saldo.toFixed(2) || "0.00"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Fluxo de Caixa */}
      <Card>
        <CardHeader>
          <CardTitle>Fluxo de Caixa - Últimos 6 Meses</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={fluxoCaixa}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="receitas" stroke="#10b981" name="Receitas" />
              <Line type="monotone" dataKey="despesas" stroke="#ef4444" name="Despesas" />
              <Line type="monotone" dataKey="saldo" stroke="#3b82f6" name="Saldo" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráficos de Pizza */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Receitas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={receitasChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {receitasChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={despesasChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {despesasChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
