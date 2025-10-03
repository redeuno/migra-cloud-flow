import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, DollarSign, Users, SquareActivity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const { user, userRoles, arenaId } = useAuth();

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
        },
        {
          title: "Receita do Mês",
          value: `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          icon: DollarSign,
          description: "Pagamentos confirmados",
        },
        {
          title: "Clientes Ativos",
          value: String(clientsCount || 0),
          icon: Users,
          description: `${clientsCount || 0} cliente${(clientsCount || 0) !== 1 ? 's' : ''} cadastrado${(clientsCount || 0) !== 1 ? 's' : ''}`,
        },
        {
          title: "Quadras Ativas",
          value: String(courtsCount || 0),
          icon: SquareActivity,
          description: `${courtsCount || 0} quadra${(courtsCount || 0) !== 1 ? 's' : ''} disponíve${(courtsCount || 0) !== 1 ? 'is' : 'l'}`,
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
      return data || [];
    },
    enabled: !!arenaId,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Bem-vindo de volta! Aqui está o resumo de hoje.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
          stats?.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
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
                  <div key={booking.id} className="flex items-center justify-between border-b pb-3 last:border-0">
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

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Informações do Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Roles</p>
              <p className="font-medium">{userRoles.join(", ") || "Nenhuma"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Arena ID</p>
              <p className="font-mono text-xs break-all">{arenaId || "N/A"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
