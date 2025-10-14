import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2, DollarSign, Users, Calendar, AlertTriangle, TrendingUp, Download, Filter, HelpCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { useNavigate } from "react-router-dom";
import { format, subMonths, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useExportData } from "@/hooks/useExportData";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

export default function DashboardSuperAdmin() {
  const navigate = useNavigate();
  const { exportToCSV } = useExportData();
  const [periodo, setPeriodo] = useState<"7d" | "30d" | "90d" | "1y">("30d");

  // Atalhos de teclado
  useKeyboardShortcuts({
    new: () => navigate("/arenas"),
    search: () => document.querySelector<HTMLInputElement>('input[type="search"]')?.focus(),
    help: () => {
      toast({
        title: "Atalhos de Teclado",
        description: "Ctrl+N: Nova Arena • Ctrl+H: Home • Ctrl+A: Arenas • Ctrl+F: Financeiro • ?: Ajuda",
      });
    },
  });

  // Query para estatísticas globais
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["super-admin-stats"],
    queryFn: async () => {
      // Total de arenas
      const { count: totalArenas } = await supabase
        .from("arenas")
        .select("*", { count: "exact", head: true });

      const { count: arenasAtivas } = await supabase
        .from("arenas")
        .select("*", { count: "exact", head: true })
        .eq("status", "ativo");

      const { count: arenasSuspensas } = await supabase
        .from("arenas")
        .select("*", { count: "exact", head: true })
        .eq("status", "suspenso");

      // Total de usuários
      const { count: totalUsuarios } = await supabase
        .from("usuarios")
        .select("*", { count: "exact", head: true });

      // Total de agendamentos (últimos 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { count: totalAgendamentos } = await supabase
        .from("agendamentos")
        .select("*", { count: "exact", head: true })
        .gte("data_agendamento", thirtyDaysAgo.toISOString().split("T")[0]);

      // Total de quadras ativas e em manutenção
      const { data: quadrasData } = await supabase
        .from("quadras")
        .select("id, status")
        .in("status", ["ativa", "manutencao"]);
      
      const totalQuadras = quadrasData?.length || 0;

      // Receita recorrente mensal (assinaturas ativas)
      const { data: assinaturasAtivas } = await supabase
        .from("assinaturas_arena")
        .select("valor_mensal")
        .eq("status", "ativo");

      const receitaRecorrente = assinaturasAtivas?.reduce((sum, a) => sum + Number(a.valor_mensal), 0) || 0;

      // Faturas pendentes
      const { count: faturasPendentes } = await supabase
        .from("faturas_sistema")
        .select("*", { count: "exact", head: true })
        .eq("status_pagamento", "pendente");

      return [
        {
          title: "Arenas Ativas",
          value: String(arenasAtivas || 0),
          total: totalArenas || 0,
          icon: Building2,
          description: `${arenasSuspensas || 0} suspensa${(arenasSuspensas || 0) !== 1 ? 's' : ''} • ${totalArenas || 0} total`,
          onClick: () => navigate("/arenas"),
          color: "hsl(var(--primary))",
        },
        {
          title: "Receita Recorrente",
          value: `R$ ${receitaRecorrente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          icon: DollarSign,
          description: "MRR de assinaturas ativas",
          onClick: () => navigate("/financeiro?tab=assinaturas"),
          color: "hsl(var(--chart-2))",
        },
        {
          title: "Total de Usuários",
          value: String(totalUsuarios || 0),
          icon: Users,
          description: "Todas as arenas",
          onClick: () => {},
          color: "hsl(var(--chart-3))",
        },
        {
          title: "Agendamentos (30d)",
          value: String(totalAgendamentos || 0),
          icon: Calendar,
          description: "Últimos 30 dias",
          onClick: () => {},
          color: "hsl(var(--chart-4))",
        },
        {
          title: "Quadras Totais",
          value: String(totalQuadras || 0),
          icon: TrendingUp,
          description: "Todas as arenas",
          onClick: () => {},
          color: "hsl(var(--chart-5))",
        },
        {
          title: "Faturas Pendentes",
          value: String(faturasPendentes || 0),
          icon: AlertTriangle,
          description: faturasPendentes ? "Requer atenção" : "Tudo em dia",
          onClick: () => navigate("/financeiro?tab=faturas"),
          color: faturasPendentes ? "hsl(var(--destructive))" : "hsl(var(--muted))",
        },
      ];
    },
  });

  // Query para evolução de arenas (últimos 6 meses)
  const { data: arenasEvolution, isLoading: loadingEvolution } = useQuery({
    queryKey: ['arenas-evolution'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('arenas')
        .select('created_at')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const monthsData: any = {};
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const monthKey = format(date, 'MMM/yy', { locale: ptBR });
        monthsData[monthKey] = { mes: monthKey, total: 0 };
      }

      (data || []).forEach((arena: any) => {
        const monthKey = format(new Date(arena.created_at), 'MMM/yy', { locale: ptBR });
        if (monthsData[monthKey]) {
          monthsData[monthKey].total += 1;
        }
      });

      // Acumular totais
      let accumulated = 0;
      return Object.values(monthsData).map((item: any) => {
        accumulated += item.total;
        return { ...item, total: accumulated };
      });
    },
  });

  // Query para receita por mês (últimos 6 meses)
  const { data: revenueData, isLoading: loadingRevenue } = useQuery({
    queryKey: ['revenue-evolution'],
    queryFn: async () => {
      const sixMonthsAgo = subMonths(new Date(), 6);
      
      const { data, error } = await supabase
        .from('faturas_sistema')
        .select('competencia, valor, status_pagamento')
        .gte('competencia', sixMonthsAgo.toISOString().split('T')[0])
        .order('competencia', { ascending: true });

      if (error) throw error;

      const grouped = (data || []).reduce((acc: any, item: any) => {
        const monthKey = format(new Date(item.competencia), 'MMM/yy', { locale: ptBR });
        if (!acc[monthKey]) {
          acc[monthKey] = { mes: monthKey, pago: 0, pendente: 0 };
        }
        if (item.status_pagamento === 'pago') {
          acc[monthKey].pago += Number(item.valor);
        } else {
          acc[monthKey].pendente += Number(item.valor);
        }
        return acc;
      }, {});

      return Object.values(grouped);
    },
  });

  // Query para distribuição por plano
  const { data: plansDistribution, isLoading: loadingPlans } = useQuery({
    queryKey: ['plans-distribution'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assinaturas_arena')
        .select(`
          valor_mensal,
          status
        `)
        .eq('status', 'ativo');

      if (error) throw error;

      const grouped = (data || []).reduce((acc: any, item: any) => {
        const valor = Number(item.valor_mensal);
        let plano = 'Outro';
        if (valor === 99) plano = 'Plano 99';
        else if (valor === 199) plano = 'Plano 199';
        else if (valor === 299) plano = 'Plano 299';

        if (!acc[plano]) {
          acc[plano] = { nome: plano, total: 0 };
        }
        acc[plano].total += 1;
        return acc;
      }, {});

      return Object.values(grouped);
    },
  });

  // Query para top 5 arenas por receita
  const { data: topArenas, isLoading: loadingTopArenas } = useQuery({
    queryKey: ['top-arenas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assinaturas_arena')
        .select(`
          arena_id,
          valor_mensal,
          arenas (nome)
        `)
        .eq('status', 'ativo')
        .order('valor_mensal', { ascending: false })
        .limit(5);

      if (error) throw error;

      return (data || []).map((item: any) => ({
        nome: item.arenas?.nome || 'Arena',
        valor: Number(item.valor_mensal),
      }));
    },
  });

  const COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--destructive))',
    'hsl(var(--accent-foreground))',
    'hsl(var(--muted-foreground))',
    'hsl(var(--secondary-foreground))',
  ];

  // Calcular data inicial baseado no período
  const getDataInicio = () => {
    const hoje = new Date();
    switch (periodo) {
      case "7d": return subDays(hoje, 7);
      case "30d": return subDays(hoje, 30);
      case "90d": return subDays(hoje, 90);
      case "1y": return subDays(hoje, 365);
      default: return subDays(hoje, 30);
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard Super Admin</h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Visão geral do sistema e métricas globais
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => {
                  toast({
                    title: "Atalhos de Teclado",
                    description: "Ctrl+N: Nova Arena • Ctrl+H: Home • Ctrl+A: Arenas • Ctrl+F: Financeiro",
                  });
                }}>
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Atalhos de teclado (Ctrl+?)</TooltipContent>
            </Tooltip>
            <Select value={periodo} onValueChange={(v: any) => setPeriodo(v)}>
              <SelectTrigger className="w-[130px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="90d">Últimos 90 dias</SelectItem>
                <SelectItem value="1y">Último ano</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => {
              if (stats) {
                exportToCSV(stats, "metricas_dashboard");
              }
            }}>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

      {/* Cards de Métricas - Mobile First */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {statsLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-3 w-40" />
              </CardContent>
            </Card>
          ))
        ) : (
          stats?.map((stat) => (
            <Tooltip key={stat.title}>
              <TooltipTrigger asChild>
                <Card 
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={stat.onClick}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">
                      {stat.description}
                    </p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>Clique para ver detalhes</p>
              </TooltipContent>
            </Tooltip>
          ))
        )}
      </div>

      {/* Gráficos - Mobile First com altura mínima */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Evolução de Arenas */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Evolução de Arenas</CardTitle>
            <CardDescription>Últimos 6 meses (acumulado)</CardDescription>
          </CardHeader>
          <CardContent className="min-h-[350px]">
            {loadingEvolution ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ChartContainer
                config={{
                  total: {
                    label: "Arenas",
                    color: "hsl(var(--primary))",
                  },
                }}
                className="h-[240px] sm:h-[300px]"
              >
                <LineChart data={arenasEvolution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="mes" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="var(--color-total)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-total)", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Receita Mensal */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Receita Mensal</CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent className="min-h-[350px]">
            {loadingRevenue ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ChartContainer
                config={{
                  pago: {
                    label: "Receita Paga",
                    color: "hsl(var(--primary))",
                  },
                  pendente: {
                    label: "Receita Pendente",
                    color: "hsl(var(--destructive))",
                  },
                }}
                className="h-[240px] sm:h-[300px]"
              >
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend wrapperStyle={{ paddingTop: "20px" }} />
                  <Bar dataKey="pago" fill="var(--color-pago)" name="Receita Paga" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pendente" fill="var(--color-pendente)" name="Receita Pendente" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Distribuição por Plano */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Distribuição por Plano</CardTitle>
            <CardDescription>Assinaturas ativas</CardDescription>
          </CardHeader>
          <CardContent className="min-h-[350px]">
            {loadingPlans ? (
              <Skeleton className="h-[300px] w-full" />
            ) : plansDistribution && plansDistribution.length > 0 ? (
              <ChartContainer
                config={{
                  total: {
                    label: "Arenas",
                    color: "hsl(var(--primary))",
                  },
                }}
                className="h-[240px] sm:h-[300px]"
              >
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend verticalAlign="bottom" height={36} />
                  <Pie
                    data={plansDistribution}
                    dataKey="total"
                    nameKey="nome"
                    cx="50%"
                    cy="45%"
                    outerRadius={90}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {plansDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            ) : (
              <EmptyState
                icon={DollarSign}
                title="Sem dados"
                description="Nenhuma assinatura ativa"
                className="py-8"
              />
            )}
          </CardContent>
        </Card>

        {/* Top 5 Arenas */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Top 5 Arenas</CardTitle>
            <CardDescription>Por valor de assinatura</CardDescription>
          </CardHeader>
          <CardContent className="min-h-[350px]">
            {loadingTopArenas ? (
              <Skeleton className="h-[300px] w-full" />
            ) : topArenas && topArenas.length > 0 ? (
              <ChartContainer
                config={{
                  valor: {
                    label: "Valor",
                    color: "hsl(var(--chart-3))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topArenas} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis dataKey="nome" type="category" className="text-xs" width={100} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="valor" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <EmptyState
                icon={Building2}
                title="Sem dados"
                description="Nenhuma arena com assinatura"
                className="py-8"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </TooltipProvider>
  );
}
