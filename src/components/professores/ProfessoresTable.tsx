import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Trash2, Star } from "lucide-react";
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
import { useState } from "react";

interface ProfessoresTableProps {
  onEdit: (professor: any) => void;
}

export function ProfessoresTable({ onEdit }: ProfessoresTableProps) {
  const { arenaId } = useAuth();
  const queryClient = useQueryClient();
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });

  const { data: professores, isLoading } = useQuery({
    queryKey: ["professores", arenaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professores")
        .select(`
          *,
          usuarios!inner (
            nome_completo,
            email,
            telefone,
            status
          )
        `)
        .eq("arena_id", arenaId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!arenaId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Buscar usuario_id
      const { data: professor } = await supabase
        .from("professores")
        .select("usuario_id")
        .eq("id", id)
        .single();

      if (!professor) throw new Error("Professor não encontrado");

      // Deletar professor (cascade vai lidar com relacionamentos)
      const { error: profError } = await supabase
        .from("professores")
        .delete()
        .eq("id", id);

      if (profError) throw profError;

      // Deletar usuário
      const { error: userError } = await supabase
        .from("usuarios")
        .delete()
        .eq("id", professor.usuario_id);

      if (userError) throw userError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professores"] });
      toast.success("Professor excluído com sucesso!");
      setDeleteDialog({ open: false, id: null });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir professor");
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Carregando professores...</div>;
  }

  if (!professores?.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum professor cadastrado
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      ativo: "default",
      inativo: "secondary",
      suspenso: "destructive",
    };
    return (
      <Badge variant={variants[status] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead className="text-center">Avaliação</TableHead>
              <TableHead>Especialidades</TableHead>
              <TableHead className="text-right">Valor/Hora</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {professores.map((prof) => {
              const especialidades = Array.isArray(prof.especialidades)
                ? prof.especialidades
                : [];
              return (
                <TableRow key={prof.id}>
                  <TableCell className="font-medium">
                    {prof.usuarios?.nome_completo}
                  </TableCell>
                  <TableCell>{prof.usuarios?.email}</TableCell>
                  <TableCell>{prof.usuarios?.telefone}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">
                        {prof.avaliacao_media?.toFixed(1) || "0.0"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({prof.total_avaliacoes || 0})
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {especialidades.length > 0 ? (
                        especialidades.slice(0, 2).map((esp: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {esp}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                      {especialidades.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{especialidades.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    R$ {prof.valor_hora_aula?.toFixed(2) || "0.00"}
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(prof.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(prof)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteDialog({ open: true, id: prof.id })}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, id: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este professor? Esta ação não pode ser desfeita e
              todos os dados relacionados (aulas, comissões) serão afetados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialog.id && deleteMutation.mutate(deleteDialog.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
