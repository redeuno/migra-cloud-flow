import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useExportData } from "@/hooks/useExportData";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted))"];

export function RelatorioAgendamentos() {
  const [periodo, setPeriodo] = useState("mes_atual");
  const { exportToCSV } = useExportData();
  const { arenaId, hasRole } = useAuth();

  const getDateRange = () => {
    const hoje = new Date();
    switch (periodo) {
      case "mes_atual":
        return { inicio: startOfMonth(hoje), fim: endOfMonth(hoje) };
      case "mes_anterior":
        const mesAnterior = subMonths(hoje, 1);
        return { inicio: startOfMonth(mesAnterior), fim: endOfMonth(mesAnterior) };
      case "ultimos_3_meses":
        return { inicio: subMonths(hoje, 3), fim: hoje };
      default:
        return { inicio: startOfMonth(hoje), fim: endOfMonth(hoje) };
    }
  };

  const { inicio, fim } = getDateRange();

  const { data: agendamentos, isLoading } = useQuery({
    queryKey: ["relatorio-agendamentos", arenaId, inicio, fim],
    queryFn: async () => {
      if (!arenaId) return [];

      let query = supabase
        .from("agendamentos")
        .select("*, quadras(nome, numero)")
        .gte("data_agendamento", format(inicio, "yyyy-MM-dd"))
        .lte("data_agendamento", format(fim, "yyyy-MM-dd"));

      // Super admin pode ver todas, outros apenas da sua arena
      if (!hasRole("super_admin")) {
        query = query.eq("arena_id", arenaId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!arenaId,
  });

  const dadosPorStatus = agendamentos?.reduce((acc: any, ag: any) => {
    const status = ag.status;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const dadosStatusChart = dadosPorStatus
    ? Object.entries(dadosPorStatus).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }))
    : [];

  const dadosPorQuadra = agendamentos?.reduce((acc: any, ag: any) => {
    const quadra = ag.quadras?.nome || "Sem quadra";
    acc[quadra] = (acc[quadra] || 0) + 1;
    return acc;
  }, {});

  const dadosQuadraChart = dadosPorQuadra
    ? Object.entries(dadosPorQuadra).map(([name, count]) => ({
        name,
        agendamentos: count,
      }))
    : [];

  const totalAgendamentos = agendamentos?.length || 0;
  const totalConfirmados = agendamentos?.filter((ag: any) => ag.status === "confirmado").length || 0;
  const totalCancelados = agendamentos?.filter((ag: any) => ag.status === "cancelado").length || 0;
  const taxaOcupacao = totalAgendamentos > 0 ? ((totalConfirmados / totalAgendamentos) * 100).toFixed(1) : "0";
  const taxaCancelamento = totalAgendamentos > 0 ? ((totalCancelados / totalAgendamentos) * 100).toFixed(1) : "0";

  const handleExport = () => {
    if (!agendamentos) return;
    const dataToExport = agendamentos.map((ag: any) => ({
      Data: format(new Date(ag.data_agendamento), "dd/MM/yyyy"),
      Horario: `${ag.hora_inicio} - ${ag.hora_fim}`,
      Quadra: ag.quadras?.nome || "N/A",
      Status: ag.status,
      Pagamento: ag.status_pagamento,
      Valor: ag.valor_total,
    }));
    exportToCSV(dataToExport, `relatorio-agendamentos-${format(new Date(), "yyyy-MM-dd")}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mes_atual">Mês Atual</SelectItem>
            <SelectItem value="mes_anterior">Mês Anterior</SelectItem>
            <SelectItem value="ultimos_3_meses">Últimos 3 Meses</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleExport} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Cards de KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Agendamentos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAgendamentos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Confirmados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalConfirmados}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Taxa de Ocupação</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taxaOcupacao}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Taxa de Cancelamento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{taxaCancelamento}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Agendamentos por Quadra</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosQuadraChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="agendamentos" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosStatusChart}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => entry.name}
                    outerRadius={80}
                    fill="hsl(var(--primary))"
                    dataKey="value"
                  >
                    {dadosStatusChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
