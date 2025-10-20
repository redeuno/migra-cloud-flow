import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { UserPlus, Trash2, Calendar, Users } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/EmptyState";
import { VincularAlunoDialog } from "./VincularAlunoDialog";

interface GerenciarAlunosProfessorProps {
  professorId: string;
  professorNome?: string;
}

export function GerenciarAlunosProfessor({ professorId, professorNome }: GerenciarAlunosProfessorProps) {
  const queryClient = useQueryClient();
  const [vincularDialogOpen, setVincularDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vinculoToDelete, setVinculoToDelete] = useState<{ id: string; alunoNome: string } | null>(null);

  // Buscar vínculos ativos
  const { data: vinculos, isLoading } = useQuery({
    queryKey: ["professor-alunos-ativos", professorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professor_alunos")
        .select(`
          id,
          data_vinculo,
          observacoes,
          usuarios!professor_alunos_aluno_id_fkey (
            id,
            nome_completo,
            email,
            telefone,
            status
          )
        `)
        .eq("professor_id", professorId)
        .eq("ativo", true)
        .order("data_vinculo", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!professorId,
  });

  // Mutation para remover vínculo
  const removerVinculoMutation = useMutation({
    mutationFn: async (vinculoId: string) => {
      const { error } = await supabase
        .from("professor_alunos")
        .update({ ativo: false })
        .eq("id", vinculoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professor-alunos-ativos", professorId] });
      toast.success("Vínculo removido com sucesso!");
      setDeleteDialogOpen(false);
      setVinculoToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao remover vínculo");
    },
  });

  const handleRemoverVinculo = (vinculo: any) => {
    setVinculoToDelete({
      id: vinculo.id,
      alunoNome: vinculo.usuarios?.nome_completo || "Aluno",
    });
    setDeleteDialogOpen(true);
  };

  const confirmRemoverVinculo = () => {
    if (vinculoToDelete) {
      removerVinculoMutation.mutate(vinculoToDelete.id);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Alunos Vinculados
              </CardTitle>
              <CardDescription>
                {professorNome ? `Alunos vinculados a ${professorNome}` : "Gerencie os alunos vinculados"}
              </CardDescription>
            </div>
            <Button onClick={() => setVincularDialogOpen(true)} size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Vincular Aluno
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!vinculos || vinculos.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Nenhum aluno vinculado"
              description="Vincule alunos a este professor para que possam participar de suas aulas"
              action={{
                label: "Vincular Primeiro Aluno",
                onClick: () => setVincularDialogOpen(true),
              }}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Vinculado em</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vinculos.map((vinculo) => (
                  <TableRow key={vinculo.id}>
                    <TableCell className="font-medium">
                      {vinculo.usuarios?.nome_completo || "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-0.5">
                        <div>{vinculo.usuarios?.email}</div>
                        {vinculo.usuarios?.telefone && (
                          <div className="text-muted-foreground">
                            {vinculo.usuarios.telefone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={vinculo.usuarios?.status === "ativo" ? "default" : "secondary"}>
                        {vinculo.usuarios?.status || "inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {new Date(vinculo.data_vinculo).toLocaleDateString("pt-BR")}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {vinculo.observacoes || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoverVinculo(vinculo)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <VincularAlunoDialog
        professorId={professorId}
        open={vincularDialogOpen}
        onOpenChange={setVincularDialogOpen}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Vínculo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o vínculo com{" "}
              <strong>{vinculoToDelete?.alunoNome}</strong>? O aluno não poderá mais
              participar das aulas deste professor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoverVinculo}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removerVinculoMutation.isPending ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
