import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, AlertTriangle, Wrench } from "lucide-react";
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
import { BloqueioDialog } from "./BloqueioDialog";

interface Bloqueio {
  id: string;
  quadra_id: string;
  tipo: string;
  data_inicio: string;
  data_fim: string;
  motivo: string;
  created_at: string;
}

interface BloqueiosTableProps {
  bloqueios: Bloqueio[];
  quadras: { id: string; numero: number; nome: string }[];
}

export function BloqueiosTable({ bloqueios, quadras }: BloqueiosTableProps) {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("bloqueios_quadra")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bloqueios-quadra"] });
      toast.success("Bloqueio removido com sucesso!");
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao remover bloqueio");
    },
  });

  const getQuadraNome = (quadraId: string) => {
    const quadra = quadras.find((q) => q.id === quadraId);
    return quadra ? `Quadra ${quadra.numero} - ${quadra.nome}` : "N/A";
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quadra</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bloqueios.map((bloqueio) => (
              <TableRow key={bloqueio.id}>
                <TableCell className="font-medium">
                  {getQuadraNome(bloqueio.quadra_id)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={bloqueio.tipo === "manutencao" ? "default" : "destructive"}
                  >
                    {bloqueio.tipo === "manutencao" ? (
                      <>
                        <Wrench className="mr-1 h-3 w-3" />
                        Manutenção
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Bloqueio
                      </>
                    )}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="text-sm">
                      {format(new Date(bloqueio.data_inicio), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      até {format(new Date(bloqueio.data_fim), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="max-w-xs truncate" title={bloqueio.motivo}>
                  {bloqueio.motivo}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditId(bloqueio.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(bloqueio.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este bloqueio? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {editId && (
        <BloqueioDialog
          open={!!editId}
          onOpenChange={(open) => !open && setEditId(null)}
          bloqueioId={editId}
        />
      )}
    </>
  );
}
