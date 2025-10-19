import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserPlus, Trash2 } from "lucide-react";
import { VincularAlunoDialog } from "./VincularAlunoDialog";
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

export function VinculosProfessorAlunoManager() {
  const { arenaId } = useAuth();
  const queryClient = useQueryClient();
  const [selectedProfessor, setSelectedProfessor] = useState<string | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [vinculoToDelete, setVinculoToDelete] = useState<string | null>(null);

  // Buscar professores
  const { data: professores, isLoading: loadingProfessores } = useQuery({
    queryKey: ["professores-vinculos", arenaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professores")
        .select(`
          id,
          usuarios (
            nome_completo,
            email
          )
        `)
        .eq("arena_id", arenaId)
        .eq("status", "ativo")
        .order("usuarios(nome_completo)");

      if (error) throw error;
      return data;
    },
    enabled: !!arenaId,
  });

  // Buscar alunos vinculados ao professor selecionado
  const { data: vinculos, isLoading: loadingVinculos } = useQuery({
    queryKey: ["professor-alunos", selectedProfessor],
    queryFn: async () => {
      if (!selectedProfessor) return [];

      const { data, error } = await supabase
        .from("professor_alunos")
        .select(`
          id,
          data_vinculo,
          observacoes,
          usuarios (
            id,
            nome_completo,
            email,
            telefone
          )
        `)
        .eq("professor_id", selectedProfessor)
        .eq("ativo", true)
        .order("data_vinculo", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!selectedProfessor,
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
      queryClient.invalidateQueries({ queryKey: ["professor-alunos"] });
      toast.success("Vínculo removido com sucesso!");
      setVinculoToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao remover vínculo");
    },
  });

  const handleRemoverVinculo = (vinculoId: string) => {
    setVinculoToDelete(vinculoId);
  };

  const confirmRemover = () => {
    if (vinculoToDelete) {
      removerVinculoMutation.mutate(vinculoToDelete);
    }
  };

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Coluna 1: Lista de Professores */}
        <Card>
          <CardHeader>
            <CardTitle>Professores</CardTitle>
            <CardDescription>
              Selecione um professor para gerenciar seus alunos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingProfessores ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="space-y-2">
                {professores?.map((professor) => (
                  <Button
                    key={professor.id}
                    variant={
                      selectedProfessor === professor.id
                        ? "default"
                        : "outline"
                    }
                    className="w-full justify-start"
                    onClick={() => setSelectedProfessor(professor.id)}
                  >
                    <div className="text-left">
                      <div className="font-medium">
                        {professor.usuarios?.nome_completo || "N/A"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {professor.usuarios?.email}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Coluna 2: Alunos Vinculados */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Alunos Vinculados</CardTitle>
                <CardDescription>
                  {selectedProfessor
                    ? "Gerencie os alunos do professor selecionado"
                    : "Selecione um professor"}
                </CardDescription>
              </div>
              {selectedProfessor && (
                <Button onClick={() => setDialogOpen(true)} size="sm">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Adicionar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedProfessor ? (
              <div className="text-center py-8 text-muted-foreground">
                Selecione um professor para ver seus alunos
              </div>
            ) : loadingVinculos ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : !vinculos || vinculos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum aluno vinculado
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Vinculado em</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vinculos.map((vinculo) => (
                    <TableRow key={vinculo.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {vinculo.usuarios?.nome_completo}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {vinculo.usuarios?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(vinculo.data_vinculo).toLocaleDateString(
                          "pt-BR"
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoverVinculo(vinculo.id)}
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
      </div>

      {/* Dialog para adicionar vínculo */}
      <VincularAlunoDialog
        professorId={selectedProfessor}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      {/* Alert Dialog para confirmar remoção */}
      <AlertDialog
        open={!!vinculoToDelete}
        onOpenChange={(open) => !open && setVinculoToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Vínculo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este vínculo? O aluno não terá
              mais acesso às aulas deste professor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemover}>
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
