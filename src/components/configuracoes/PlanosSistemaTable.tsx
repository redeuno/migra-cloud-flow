import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { PlanoDialog } from "./PlanoDialog";
import { EmptyState } from "@/components/EmptyState";
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

export function PlanosSistemaTable() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlano, setSelectedPlano] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planoToDelete, setPlanoToDelete] = useState<any>(null);

  const { data: planos, isLoading } = useQuery({
    queryKey: ["planos-sistema-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planos_sistema")
        .select("*")
        .order("valor_mensal");

      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("planos_sistema")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planos-sistema-all"] });
      toast.success("Plano excluído com sucesso!");
      setDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir plano");
    },
  });

  const handleEdit = (plano: any) => {
    setSelectedPlano(plano);
    setDialogOpen(true);
  };

  const handleDeleteClick = (plano: any) => {
    setPlanoToDelete(plano);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (planoToDelete) {
      deleteMutation.mutate(planoToDelete.id);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  if (!planos || planos.length === 0) {
    return (
      <EmptyState
        icon={MoreHorizontal}
        title="Nenhum plano cadastrado"
        description="Crie o primeiro plano do sistema para começar."
        action={{
          label: "Criar Plano",
          onClick: () => setDialogOpen(true),
        }}
      />
    );
  }

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Valor Mensal</TableHead>
              <TableHead>Máx. Quadras</TableHead>
              <TableHead>Máx. Usuários</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {planos.map((plano) => (
              <TableRow key={plano.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{plano.nome}</p>
                    {plano.descricao && (
                      <p className="text-sm text-muted-foreground">{plano.descricao}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>R$ {Number(plano.valor_mensal).toFixed(2)}</TableCell>
                <TableCell>{plano.max_quadras}</TableCell>
                <TableCell>{plano.max_usuarios}</TableCell>
                <TableCell>
                  <Badge variant={plano.status === "ativo" ? "default" : "secondary"}>
                    {plano.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(plano)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(plano)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PlanoDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSelectedPlano(null);
        }}
        plano={selectedPlano}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o plano "{planoToDelete?.nome}"? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
