import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useExportData } from "@/hooks/useExportData";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function RelatorioClientes() {
  const [periodo, setPeriodo] = useState("mes_atual");
  const { exportToCSV } = useExportData();

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

  const { data: clientes, isLoading: loadingClientes } = useQuery({
    queryKey: ["relatorio-clientes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: agendamentos, isLoading: loadingAgendamentos } = useQuery({
    queryKey: ["agendamentos-clientes", inicio, fim],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agendamentos")
        .select("*, usuarios!agendamentos_cliente_id_fkey(nome_completo)")
        .gte("data_agendamento", format(inicio, "yyyy-MM-dd"))
        .lte("data_agendamento", format(fim, "yyyy-MM-dd"));
      if (error) throw error;
      return data;
    },
  });

  // Ranking de clientes por agendamentos
  const rankingClientes = agendamentos?.reduce((acc: any, ag: any) => {
    const clienteNome = ag.usuarios?.nome_completo || "Sem cliente";
    if (!acc[clienteNome]) {
      acc[clienteNome] = { nome: clienteNome, total: 0, valor: 0 };
    }
    acc[clienteNome].total += 1;
    acc[clienteNome].valor += Number(ag.valor_total);
    return acc;
  }, {});

  const rankingArray = rankingClientes
    ? Object.values(rankingClientes)
        .sort((a: any, b: any) => b.total - a.total)
        .slice(0, 10)
    : [];

  const totalClientes = clientes?.length || 0;
  const clientesNovos = clientes?.filter((c: any) => {
    const dataCadastro = new Date(c.created_at);
    return dataCadastro >= inicio && dataCadastro <= fim;
  }).length || 0;

  const clientesAtivos = clientes?.filter((c: any) => c.status === "ativo").length || 0;

  const handleExport = () => {
    if (!rankingArray) return;
    exportToCSV(
      rankingArray.map((c: any) => ({
        Cliente: c.nome,
        Agendamentos: c.total,
        "Valor Total": c.valor.toFixed(2),
      })),
      `relatorio-clientes-${format(new Date(), "yyyy-MM-dd")}`
    );
  };

  if (loadingClientes || loadingAgendamentos) {
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
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Clientes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClientes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Clientes Novos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{clientesNovos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Clientes Ativos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientesAtivos}</div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico e Tabela */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Clientes por Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rankingArray} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="nome" type="category" width={150} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="total" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ranking de Clientes</CardTitle>
            <CardDescription>Por número de agendamentos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Agendamentos</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rankingArray.map((cliente: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}º</TableCell>
                      <TableCell>{cliente.nome}</TableCell>
                      <TableCell className="text-right">{cliente.total}</TableCell>
                      <TableCell className="text-right">
                        R$ {cliente.valor.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
