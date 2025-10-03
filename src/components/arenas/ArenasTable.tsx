import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { ArenaDialog } from "./ArenaDialog";

interface ArenasTableProps {
  arenas: any[];
}

const statusMap = {
  ativo: { label: "Ativo", variant: "default" as const },
  inativo: { label: "Inativo", variant: "secondary" as const },
  suspenso: { label: "Suspenso", variant: "destructive" as const },
};

export function ArenasTable({ arenas }: ArenasTableProps) {
  const [editingArena, setEditingArena] = useState<any>(null);
  const [deletingArena, setDeletingArena] = useState<any>(null);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (arenaId: string) => {
      const { error } = await supabase
        .from("arenas")
        .delete()
        .eq("id", arenaId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["arenas"] });
      toast.success("Arena excluída com sucesso!");
      setDeletingArena(null);
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir: ${error.message}`);
    },
  });

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>CNPJ</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {arenas.map((arena) => (
            <TableRow key={arena.id}>
              <TableCell className="font-medium">{arena.nome}</TableCell>
              <TableCell>{arena.cnpj}</TableCell>
              <TableCell>{arena.email}</TableCell>
              <TableCell>{arena.telefone}</TableCell>
              <TableCell>
                <Badge variant={statusMap[arena.status as keyof typeof statusMap].variant}>
                  {statusMap[arena.status as keyof typeof statusMap].label}
                </Badge>
              </TableCell>
              <TableCell>
                {new Date(arena.data_vencimento).toLocaleDateString("pt-BR")}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditingArena(arena)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setDeletingArena(arena)}
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

      <ArenaDialog
        open={!!editingArena}
        onOpenChange={(open) => !open && setEditingArena(null)}
        arena={editingArena}
      />

      <AlertDialog open={!!deletingArena} onOpenChange={() => setDeletingArena(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a arena "{deletingArena?.nome}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deletingArena.id)}
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
