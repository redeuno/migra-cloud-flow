import { useState } from "react";
import { Layout } from "@/components/Layout";
import { PerfilAccessGuard } from "@/components/PerfilAccessGuard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MeusCheckins } from "@/components/checkins/MeusCheckins";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AgendamentoDialog } from "@/components/agendamentos/AgendamentoDialog";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";

export default function MeusAgendamentos() {
  const { data: usuario } = useQuery({
    queryKey: ["usuario-atual"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("usuarios")
        .select("id, nome_completo")
        .eq("auth_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: agendamentos, isLoading } = useQuery({
    queryKey: ["meus-agendamentos", usuario?.id],
    queryFn: async () => {
      if (!usuario?.id) return [];

      const { data, error } = await supabase
        .from("agendamentos")
        .select(`
          id,
          data_agendamento,
          hora_inicio,
          hora_fim,
          status,
          valor_total,
          status_pagamento,
          checkin_realizado,
          quadras (
            nome,
            numero,
            tipo_esporte
          ),
          arenas (
            nome
          )
        `)
        .eq("cliente_id", usuario.id)
        .order("data_agendamento", { ascending: false })
        .order("hora_inicio", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    enabled: !!usuario?.id,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("agendamentos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meus-agendamentos", usuario?.id] });
      toast.success("Agendamento cancelado/excluído com sucesso");
    },
    onError: (error: any) => {
      toast.error(error.message || "Não foi possível excluir este agendamento");
    },
  });
  const handleNew = () => { setEditingId(null); setDialogOpen(true); };
  const handleEdit = (id: string) => { setEditingId(id); setDialogOpen(true); };
  const handleDelete = (id: string) => {
    if (window.confirm("Confirma a exclusão deste agendamento?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <Layout>
      <PerfilAccessGuard allowedRoles={["aluno", "professor"]}>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Meus Agendamentos
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Visualize e gerencie seus agendamentos e check-ins
              </p>
            </div>
            <Button onClick={handleNew} className="sm:shrink-0">
              <Plus className="mr-2 h-4 w-4" /> Novo Agendamento
            </Button>
          </div>

          <Tabs defaultValue="agendamentos" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 h-auto">
              <TabsTrigger value="agendamentos">Agendamentos</TabsTrigger>
              <TabsTrigger value="checkins">Check-ins</TabsTrigger>
            </TabsList>

            <TabsContent value="agendamentos" className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : agendamentos && agendamentos.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {agendamentos.map((agendamento) => (
                    <Card key={agendamento.id}>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center justify-between">
                          <span>
                            Quadra {agendamento.quadras?.numero} -{" "}
                            {agendamento.quadras?.nome}
                          </span>
                          <Badge
                            variant={
                              agendamento.status === "confirmado"
                                ? "default"
                                : agendamento.status === "cancelado"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {agendamento.status}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {format(
                              new Date(agendamento.data_agendamento),
                              "dd/MM/yyyy",
                              { locale: ptBR }
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {agendamento.hora_inicio.substring(0, 5)} -{" "}
                            {agendamento.hora_fim.substring(0, 5)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{agendamento.arenas?.nome}</span>
                        </div>
                        <div className="flex items-center justify-between pt-2 mt-2 border-t">
                          <span className="text-muted-foreground">Pagamento:</span>
                          <Badge
                            variant={
                              agendamento.status_pagamento === "pago"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {agendamento.status_pagamento}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Valor:</span>
                          <span className="font-medium">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(agendamento.valor_total)}
                          </span>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-3 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(agendamento.id)}
                            disabled={
                              agendamento.status === "cancelado" ||
                              new Date(agendamento.data_agendamento) < new Date(new Date().toDateString())
                            }
                          >
                            <Pencil className="mr-1 h-4 w-4" /> Editar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(agendamento.id)}
                            disabled={
                              agendamento.status === "cancelado" ||
                              new Date(agendamento.data_agendamento) < new Date(new Date().toDateString()) ||
                              deleteMutation.isPending
                            }
                          >
                            <Trash2 className="mr-1 h-4 w-4" /> Excluir
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Alert>
                  <Calendar className="h-4 w-4" />
                  <AlertDescription>
                    Você ainda não tem agendamentos.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="checkins" className="space-y-4">
              <MeusCheckins />
            </TabsContent>
            </Tabs>

            <AgendamentoDialog
              open={dialogOpen}
              onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) {
                  queryClient.invalidateQueries({ queryKey: ["meus-agendamentos", usuario?.id] });
                }
              }}
              agendamentoId={editingId ?? undefined}
            />
          </div>
        </PerfilAccessGuard>
      </Layout>
  );
}
