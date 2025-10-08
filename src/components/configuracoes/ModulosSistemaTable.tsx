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
import { ModuloDialog } from "./ModuloDialog";
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

export function ModulosSistemaTable() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedModulo, setSelectedModulo] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [moduloToDelete, setModuloToDelete] = useState<any>(null);

  const { data: modulos, isLoading } = useQuery({
    queryKey: ["modulos-sistema-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("modulos_sistema")
        .select("*")
        .order("ordem");

      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("modulos_sistema")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modulos-sistema-all"] });
      toast.success("Módulo excluído com sucesso!");
      setDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir módulo");
    },
  });

  const handleEdit = (modulo: any) => {
    setSelectedModulo(modulo);
    setDialogOpen(true);
  };

  const handleDeleteClick = (modulo: any) => {
    setModuloToDelete(modulo);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (moduloToDelete) {
      deleteMutation.mutate(moduloToDelete.id);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  if (!modulos || modulos.length === 0) {
    return (
      <EmptyState
        icon={MoreHorizontal}
        title="Nenhum módulo cadastrado"
        description="Crie o primeiro módulo do sistema para começar."
        action={{
          label: "Criar Módulo",
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
              <TableHead>Ordem</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Ícone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {modulos.map((modulo) => (
              <TableRow key={modulo.id}>
                <TableCell>{modulo.ordem}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{modulo.nome}</p>
                    {modulo.descricao && (
                      <p className="text-sm text-muted-foreground">{modulo.descricao}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <code className="text-sm bg-muted px-2 py-1 rounded">{modulo.slug}</code>
                </TableCell>
                <TableCell>{modulo.icone || "-"}</TableCell>
                <TableCell>
                  <Badge variant={modulo.status === "ativo" ? "default" : "secondary"}>
                    {modulo.status}
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
                      <DropdownMenuItem onClick={() => handleEdit(modulo)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(modulo)}
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

      <ModuloDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSelectedModulo(null);
        }}
        modulo={selectedModulo}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o módulo "{moduloToDelete?.nome}"? Esta ação não pode
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
