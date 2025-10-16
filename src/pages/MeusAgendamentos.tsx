import { useState } from "react";
import { Layout } from "@/components/Layout";
import { PerfilAccessGuard } from "@/components/PerfilAccessGuard";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function MeusAgendamentos() {
  const { user, arenaId } = useAuth();
  const [filtro, setFiltro] = useState<"proximos" | "passados">("proximos");

  // Buscar ID do usuário no sistema
  const { data: usuarioData } = useQuery({
    queryKey: ["usuario-id", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("usuarios")
        .select("id")
        .eq("auth_id", user?.id)
        .single();

      return data;
    },
    enabled: !!user?.id,
  });

  const usuarioId = usuarioData?.id;

  // Buscar agendamentos do usuário
  const { data: agendamentos, isLoading } = useQuery({
    queryKey: ["meus-agendamentos", usuarioId, arenaId, filtro],
    queryFn: async () => {
      if (!usuarioId || !arenaId) return [];

      const hoje = new Date().toISOString().split("T")[0];

      const query = supabase
        .from("agendamentos")
        .select(`
          id,
          data_agendamento,
          hora_inicio,
          hora_fim,
          status,
          status_pagamento,
          valor_total,
          checkin_realizado,
          quadras(id, nome, numero),
          modalidade
        `)
        .eq("cliente_id", usuarioId)
        .eq("arena_id", arenaId)
        .order("data_agendamento", { ascending: filtro === "proximos" })
        .order("hora_inicio", { ascending: true });

      if (filtro === "proximos") {
        query.gte("data_agendamento", hoje);
      } else {
        query.lt("data_agendamento", hoje);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: !!usuarioId && !!arenaId,
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      confirmado: { variant: "default", label: "Confirmado" },
      pendente: { variant: "secondary", label: "Pendente" },
      cancelado: { variant: "destructive", label: "Cancelado" },
      concluido: { variant: "outline", label: "Concluído" },
    };

    const config = statusMap[status] || { variant: "outline" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPagamentoBadge = (status: string) => {
    const statusMap: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pago: { variant: "default", label: "Pago" },
      pendente: { variant: "secondary", label: "Pendente" },
      cancelado: { variant: "destructive", label: "Cancelado" },
    };

    const config = statusMap[status] || { variant: "outline" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Layout>
      <PerfilAccessGuard allowedRoles={["aluno"]}>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Meus Agendamentos</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Visualize e gerencie seus agendamentos
            </p>
          </div>

          <Tabs value={filtro} onValueChange={(v) => setFiltro(v as "proximos" | "passados")}>
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="proximos">Próximos</TabsTrigger>
              <TabsTrigger value="passados">Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value={filtro} className="space-y-4">
              {isLoading ? (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-6 w-32" />
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-24" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : !agendamentos || agendamentos.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="Nenhum agendamento encontrado"
                  description={
                    filtro === "proximos"
                      ? "Você não tem agendamentos futuros no momento."
                      : "Você não tem agendamentos passados."
                  }
                  className="py-12"
                />
              ) : (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {agendamentos.map((agendamento: any) => (
                    <Card key={agendamento.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between text-base">
                          <span>{agendamento.quadras?.nome || `Quadra ${agendamento.quadras?.numero}`}</span>
                          {agendamento.checkin_realizado && (
                            <Badge variant="outline" className="ml-2">
                              ✓ Check-in
                            </Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{format(new Date(agendamento.data_agendamento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {agendamento.hora_inicio.slice(0, 5)} - {agendamento.hora_fim.slice(0, 5)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="capitalize">{agendamento.modalidade || "Beach Tennis"}</span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-sm font-medium">
                            R$ {Number(agendamento.valor_total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                          <div className="flex gap-2">
                            {getStatusBadge(agendamento.status)}
                            {getPagamentoBadge(agendamento.status_pagamento)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </PerfilAccessGuard>
    </Layout>
  );
}
