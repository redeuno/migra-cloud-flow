import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Users, UserCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { AulaDialog } from "@/components/aulas/AulaDialog";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GerenciarInscricoesDialog } from "@/components/aulas/GerenciarInscricoesDialog";

export default function MinhasAulasProfessor() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAulaId, setSelectedAulaId] = useState<string>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [aulaToDelete, setAulaToDelete] = useState<string>();
  const [inscricoesDialogOpen, setInscricoesDialogOpen] = useState(false);
  const [aulaParaGerenciar, setAulaParaGerenciar] = useState<{
    id: string;
    titulo: string;
  } | null>(null);

  // Buscar ID do professor
  const { data: professor } = useQuery({
    queryKey: ["professor-atual", user?.id],
    queryFn: async () => {
      const { data: userData } = await supabase
        .from("usuarios")
        .select("id")
        .eq("auth_id", user?.id)
        .single();

      if (!userData) return null;

      const { data, error } = await supabase
        .from("professores")
        .select("id, arena_id")
        .eq("usuario_id", userData.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Buscar aulas do professor
  const { data: aulas, isLoading } = useQuery({
    queryKey: ["minhas-aulas-professor", professor?.id],
    queryFn: async () => {
      if (!professor?.id) return [];

      const { data, error } = await supabase
        .from("aulas")
        .select(`
          *,
          quadras(nome, numero),
          aulas_alunos(id),
          agendamentos!aulas_agendamento_id_fkey(
            id,
            status,
            checkin_realizado,
            data_checkin
          )
        `)
        .eq("professor_id", professor.id)
        .order("data_aula", { ascending: false })
        .order("hora_inicio", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!professor?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (aulaId: string) => {
      const { error } = await supabase.from("aulas").delete().eq("id", aulaId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["minhas-aulas-professor"] });
      toast.success("Aula excluída com sucesso");
      setDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir aula", {
        description: error.message,
      });
    },
  });

  const handleNew = () => {
    setSelectedAulaId(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (aulaId: string) => {
    setSelectedAulaId(aulaId);
    setDialogOpen(true);
  };

  const handleDelete = (aulaId: string) => {
    setAulaToDelete(aulaId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (aulaToDelete) {
      deleteMutation.mutate(aulaToDelete);
    }
  };

  const handleGerenciarInscricoes = (aula: any) => {
    setAulaParaGerenciar({
      id: aula.id,
      titulo: aula.titulo,
    });
    setInscricoesDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      agendada: "bg-blue-500/20 text-blue-700 border-blue-500/30",
      confirmada: "bg-green-500/20 text-green-700 border-green-500/30",
      em_andamento: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
      realizada: "bg-gray-500/20 text-gray-700 border-gray-500/30",
      cancelada: "bg-red-500/20 text-red-700 border-red-500/30",
    };
    return colors[status as keyof typeof colors] || "";
  };

  const hoje = new Date().toISOString().split("T")[0];
  const aulasProximas = aulas?.filter(a => a.data_aula >= hoje) || [];
  const aulasPassadas = aulas?.filter(a => a.data_aula < hoje) || [];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Minhas Aulas</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gerencie suas aulas e horários
            </p>
          </div>
          <Button onClick={handleNew} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Nova Aula
          </Button>
        </div>

        <Tabs defaultValue="proximas" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 h-auto">
            <TabsTrigger value="proximas">Próximas</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="proximas" className="space-y-4">
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-48 w-full" />
                ))}
              </div>
            ) : aulasProximas.length === 0 ? (
              <Card>
                <CardContent className="p-8">
                  <EmptyState
                    icon={Users}
                    title="Nenhuma aula agendada"
                    description="Você não tem aulas próximas agendadas"
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {aulasProximas.map((aula) => {
                  const inscritos = (aula.aulas_alunos as any[])?.length || 0;
                  const podeEditar = aula.data_aula >= hoje && 
                                    aula.status !== "cancelada" && 
                                    aula.status !== "realizada";

                  return (
                    <Card key={aula.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between text-base">
                          <span>{aula.titulo}</span>
                          <Badge variant="outline" className={getStatusColor(aula.status || "agendada")}>
                            {aula.status || "agendada"}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Data:</span>
                            <span className="font-medium">
                              {format(new Date(aula.data_aula), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Horário:</span>
                            <span className="font-medium">
                              {aula.hora_inicio.substring(0, 5)} - {aula.hora_fim.substring(0, 5)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Quadra:</span>
                            <span className="font-medium">
                              {aula.quadras ? `${aula.quadras.numero} - ${aula.quadras.nome}` : "—"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Tipo:</span>
                            <Badge variant="outline">{aula.tipo_aula}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Alunos:</span>
                            <span className="font-medium flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {inscritos}/{aula.max_alunos}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Valor/aluno:</span>
                            <span className="font-medium">
                              R$ {Number(aula.valor_por_aluno).toFixed(2)}
                            </span>
                          </div>
                          {aula.agendamentos?.checkin_realizado && (
                            <div className="flex justify-between pt-2 border-t">
                              <span className="text-muted-foreground">Check-in:</span>
                              <Badge variant="default" className="bg-green-600">
                                Confirmado
                              </Badge>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 pt-2 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGerenciarInscricoes(aula)}
                          >
                            <UserCircle className="mr-2 h-4 w-4" />
                            Alunos
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(aula.id)}
                            disabled={!podeEditar}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(aula.id)}
                            disabled={!podeEditar}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="historico" className="space-y-4">
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-48 w-full" />
                ))}
              </div>
            ) : aulasPassadas.length === 0 ? (
              <Card>
                <CardContent className="p-8">
                  <EmptyState
                    icon={Users}
                    title="Sem histórico"
                    description="Você ainda não tem aulas realizadas"
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {aulasPassadas.map((aula) => {
                  const inscritos = (aula.aulas_alunos as any[])?.length || 0;

                  return (
                    <Card key={aula.id} className="opacity-75">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between text-base">
                          <span>{aula.titulo}</span>
                          <Badge variant="outline" className={getStatusColor(aula.status || "realizada")}>
                            {aula.status || "realizada"}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Data:</span>
                          <span>{format(new Date(aula.data_aula), "dd/MM/yyyy", { locale: ptBR })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Horário:</span>
                          <span>
                            {aula.hora_inicio.substring(0, 5)} - {aula.hora_fim.substring(0, 5)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Alunos:</span>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {inscritos}/{aula.max_alunos}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AulaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        aulaId={selectedAulaId}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta aula? Esta ação não pode ser desfeita e
              removerá todas as inscrições associadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {aulaParaGerenciar && (
        <GerenciarInscricoesDialog
          open={inscricoesDialogOpen}
          onOpenChange={setInscricoesDialogOpen}
          aulaId={aulaParaGerenciar.id}
          aulaTitulo={aulaParaGerenciar.titulo}
        />
      )}
    </Layout>
  );
}
