import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar, DollarSign, Users, SquareActivity, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { useNavigate } from "react-router-dom";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { useMetricasComparativas } from "@/hooks/useMetricasComparativas";
import { AgendaDiaWidget } from "@/components/dashboard/AgendaDiaWidget";
import { VencimentosWidget } from "@/components/dashboard/VencimentosWidget";
import { AlertasWidget } from "@/components/dashboard/AlertasWidget";
import { OcupacaoQuadrasWidget } from "@/components/dashboard/OcupacaoQuadrasWidget";

export default function Dashboard() {
  const { user, userRoles, arenaId } = useAuth();
  const navigate = useNavigate();

  // Hook de métricas comparativas
  const metricas = useMetricasComparativas({
    arenaId: arenaId || undefined,
    diasPeriodo: 30,
  });

  // Query para estatísticas
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats", arenaId],
    queryFn: async () => {
      if (!arenaId) return null;

      const today = new Date().toISOString().split("T")[0];
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];

      // Agendamentos de hoje
      const { count: todayCount } = await supabase
        .from("agendamentos")
        .select("*", { count: "exact", head: true })
        .eq("arena_id", arenaId)
        .eq("data_agendamento", today);

      // Receita do mês
      const { data: monthRevenue } = await supabase
        .from("agendamentos")
        .select("valor_total")
        .eq("arena_id", arenaId)
        .gte("data_agendamento", firstDayOfMonth)
        .eq("status_pagamento", "pago");

      const totalRevenue = monthRevenue?.reduce((sum, a) => sum + Number(a.valor_total), 0) || 0;

      // Clientes ativos (usuários)
      const { count: clientsCount } = await supabase
        .from("usuarios")
        .select("*", { count: "exact", head: true })
        .eq("arena_id", arenaId)
        .eq("status", "ativo");

      // Quadras ativas
      const { count: courtsCount } = await supabase
        .from("quadras")
        .select("*", { count: "exact", head: true })
        .eq("arena_id", arenaId)
        .eq("status", "ativa");

      return [
        {
          title: "Agendamentos Hoje",
          value: String(todayCount || 0),
          icon: Calendar,
          description: todayCount ? `${todayCount} agendamento${todayCount > 1 ? 's' : ''}` : "Nenhum agendamento",
          onClick: () => navigate("/agendamentos"),
        },
        {
          title: "Receita do Mês",
          value: `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          icon: DollarSign,
          description: "Pagamentos confirmados",
          onClick: () => navigate("/financeiro"),
        },
        {
          title: "Clientes Ativos",
          value: String(clientsCount || 0),
          icon: Users,
          description: `${clientsCount || 0} cliente${(clientsCount || 0) !== 1 ? 's' : ''} cadastrado${(clientsCount || 0) !== 1 ? 's' : ''}`,
          onClick: () => navigate("/clientes"),
        },
        {
          title: "Quadras Ativas",
          value: String(courtsCount || 0),
          icon: SquareActivity,
          description: `${courtsCount || 0} quadra${(courtsCount || 0) !== 1 ? 's' : ''} disponíve${(courtsCount || 0) !== 1 ? 'is' : 'l'}`,
          onClick: () => navigate("/quadras"),
        },
      ];
    },
    enabled: !!arenaId,
  });

  // Query para próximos agendamentos
  const { data: nextBookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["next-bookings", arenaId],
    queryFn: async () => {
      if (!arenaId) return [];

      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from("agendamentos")
        .select(`
          id,
          data_agendamento,
          hora_inicio,
          hora_fim,
          quadra_id,
          cliente_id,
          quadras(nome),
          usuarios:cliente_id(nome_completo)
        `)
        .eq("arena_id", arenaId)
        .gte("data_agendamento", now.split("T")[0])
        .order("data_agendamento", { ascending: true })
        .order("hora_inicio", { ascending: true })
        .limit(5);

      if (error) throw error;
      
      // Filtrar agendamentos com dados válidos
      return (data || []).filter((booking: any) => 
        booking.quadras && booking.usuarios
      );
    },
    enabled: !!arenaId,
  });

  // Query para agendamentos semanais (gráfico)
  const { data: weeklyData, isLoading: loadingWeekly } = useQuery({
    queryKey: ['weekly-bookings', arenaId],
    queryFn: async () => {
      if (!arenaId) return [];
      
      const startDate = subDays(new Date(), 6);
      const { data, error } = await supabase
        .from('agendamentos')
        .select('data_agendamento, valor_total')
        .eq('arena_id', arenaId)
        .gte('data_agendamento', startDate.toISOString().split('T')[0])
        .order('data_agendamento', { ascending: true });

      if (error) throw error;

      const grouped = (data || []).reduce((acc: any, item: any) => {
        const day = format(new Date(item.data_agendamento), 'EEE', { locale: ptBR });
        if (!acc[day]) {
          acc[day] = { dia: day, agendamentos: 0, receita: 0 };
        }
        acc[day].agendamentos += 1;
        acc[day].receita += Number(item.valor_total || 0);
        return acc;
      }, {});

      return Object.values(grouped);
    },
    enabled: !!arenaId,
  });

  // Query para receita mensal (gráfico)
  const { data: monthlyRevenue, isLoading: loadingMonthly } = useQuery({
    queryKey: ['monthly-revenue', arenaId],
    queryFn: async () => {
      if (!arenaId) return [];
      
      const start = startOfMonth(new Date());
      const end = endOfMonth(new Date());
      
      const { data, error } = await supabase
        .from('movimentacoes_financeiras')
        .select('data_movimentacao, valor, tipo')
        .eq('arena_id', arenaId)
        .gte('data_movimentacao', start.toISOString().split('T')[0])
        .lte('data_movimentacao', end.toISOString().split('T')[0])
        .order('data_movimentacao', { ascending: true });

      if (error) throw error;

      const grouped = (data || []).reduce((acc: any, item: any) => {
        const day = format(new Date(item.data_movimentacao), 'dd/MM');
        if (!acc[day]) {
          acc[day] = { dia: day, receita: 0, despesa: 0 };
        }
        if (item.tipo === 'receita') {
          acc[day].receita += Number(item.valor);
        } else {
          acc[day].despesa += Number(item.valor);
        }
        return acc;
      }, {});

      return Object.values(grouped);
    },
    enabled: !!arenaId,
  });

  // Query para uso de quadras (gráfico pizza)
  const { data: courtUsage, isLoading: loadingCourts } = useQuery({
    queryKey: ['court-usage', arenaId],
    queryFn: async () => {
      if (!arenaId) return [];
      
      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          quadra_id,
          quadras (nome)
        `)
        .eq('arena_id', arenaId)
        .gte('data_agendamento', subDays(new Date(), 30).toISOString().split('T')[0]);

      if (error) throw error;

      const counted = (data || []).reduce((acc: any, item: any) => {
        const name = item.quadras?.nome || 'Sem quadra';
        if (!acc[name]) {
          acc[name] = { nome: name, total: 0 };
        }
        acc[name].total += 1;
        return acc;
      }, {});

      return Object.values(counted);
    },
    enabled: !!arenaId,
  });

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Bem-vindo de volta! Aqui está o resumo de hoje.
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
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
          <>
            <MetricCard
              title="Agendamentos"
              value={metricas?.agendamentos.atual || 0}
              icon={Calendar}
              description="Últimos 30 dias"
              comparativo={{
                percentual: metricas?.agendamentos.variacao || 0,
                periodo: "vs. período anterior"
              }}
              onClick={() => navigate("/agendamentos")}
            />
            <MetricCard
              title="Receita"
              value={`R$ ${(metricas?.receita.atual || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              icon={DollarSign}
              description="Últimos 30 dias"
              comparativo={{
                percentual: metricas?.receita.variacao || 0,
                periodo: "vs. período anterior"
              }}
              onClick={() => navigate("/financeiro")}
            />
            <MetricCard
              title="Novos Clientes"
              value={metricas.clientes.atual}
              icon={Users}
              description="Últimos 30 dias"
              comparativo={{
                percentual: metricas.clientes.variacao,
                periodo: "vs. período anterior"
              }}
              onClick={() => navigate("/clientes")}
            />
            {stats && stats[3] && (() => {
              const StatIcon = stats[3].icon;
              return (
                <Card 
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={stats[3].onClick}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stats[3].title}
                    </CardTitle>
                    <StatIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats[3].value}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats[3].description}
                    </p>
                  </CardContent>
                </Card>
              );
            })()}
          </>
        )}
      </div>

      {/* Widgets: Agenda do Dia, Vencimentos, Alertas e Ocupação */}
      {arenaId && (
        <>
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            <AgendaDiaWidget arenaId={arenaId} />
            <VencimentosWidget arenaId={arenaId} />
          </div>
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            <AlertasWidget arenaId={arenaId} />
            <OcupacaoQuadrasWidget arenaId={arenaId} />
          </div>
        </>
      )}

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Próximos Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between border-b pb-3">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-3 w-24" />
                  </div>
                ))}
              </div>
            ) : !nextBookings || nextBookings.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="Nenhum agendamento"
                description="Não há agendamentos futuros no momento."
                className="py-8"
              />
            ) : (
              <div className="space-y-4">
                {nextBookings.map((booking: any) => (
                  <div 
                    key={booking.id} 
                    className="flex items-center justify-between border-b pb-3 last:border-0 cursor-pointer hover:bg-accent/50 -mx-2 px-2 py-2 rounded transition-colors"
                    onClick={() => navigate("/agendamentos")}
                  >
                    <div>
                      <p className="font-medium">
                        {booking.quadras?.nome || "Quadra"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(booking.data_agendamento), "dd/MMM", { locale: ptBR })} • {booking.hora_inicio.slice(0, 5)} - {booking.hora_fim.slice(0, 5)}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {booking.usuarios?.nome_completo || "Cliente"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>Acessos rápidos às principais funções</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => navigate("/agendamentos")}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Novo Agendamento
            </Button>
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => navigate("/financeiro")}
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Nova Movimentação
            </Button>
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => navigate("/clientes")}
            >
              <Users className="mr-2 h-4 w-4" />
              Novo Cliente
            </Button>
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => navigate("/relatorios")}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Ver Relatórios
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Seção de Gráficos */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {/* Gráfico de Agendamentos Semanais */}
        <Card>
          <CardHeader>
            <CardTitle>Agendamentos da Semana</CardTitle>
            <CardDescription>Últimos 7 dias</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingWeekly ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ChartContainer
                config={{
                  agendamentos: {
                    label: "Agendamentos",
                    color: "hsl(var(--primary))",
                  },
                }}
                className="h-[250px] sm:h-[300px] w-full"
              >
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="dia" className="text-xs" />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="agendamentos" fill="var(--color-agendamentos)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Receitas e Despesas */}
        <Card>
          <CardHeader>
            <CardTitle>Receitas e Despesas</CardTitle>
            <CardDescription>Mês atual</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingMonthly ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ChartContainer
                config={{
                  receita: {
                    label: "Receita",
                    color: "hsl(var(--primary))",
                  },
                  despesa: {
                    label: "Despesa",
                    color: "hsl(var(--destructive))",
                  },
                }}
                className="h-[250px] sm:h-[300px] w-full"
              >
                <LineChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="dia" className="text-xs" />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="receita" stroke="var(--color-receita)" strokeWidth={2} />
                  <Line type="monotone" dataKey="despesa" stroke="var(--color-despesa)" strokeWidth={2} />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Uso de Quadras */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Uso de Quadras</CardTitle>
            <CardDescription>Últimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingCourts ? (
              <Skeleton className="h-[300px] w-full" />
            ) : courtUsage && courtUsage.length > 0 ? (
              <ChartContainer
                config={{
                  total: {
                    label: "Agendamentos",
                    color: "hsl(var(--primary))",
                  },
                }}
                className="h-[250px] sm:h-[300px] w-full"
              >
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie
                    data={courtUsage}
                    dataKey="total"
                    nameKey="nome"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {courtUsage.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            ) : (
              <EmptyState
                icon={SquareActivity}
                title="Sem dados de uso"
                description="Nenhum agendamento encontrado nos últimos 30 dias"
                className="py-8"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
