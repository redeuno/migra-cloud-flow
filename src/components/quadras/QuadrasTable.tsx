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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { MoreHorizontal, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { QuadraDialog } from "./QuadraDialog";

interface QuadrasTableProps {
  quadras: any[];
}

const statusMap = {
  ativa: { label: "Ativa", variant: "default" as const },
  inativa: { label: "Inativa", variant: "secondary" as const },
  manutencao: { label: "Manutenção", variant: "destructive" as const },
};

const esporteMap: Record<string, string> = {
  padel: "Padel",
  tenis: "Tênis",
  beach_tennis: "Beach Tennis",
  futevolei: "Futevôlei",
};

export function QuadrasTable({ quadras }: QuadrasTableProps) {
  const queryClient = useQueryClient();
  const [editingQuadra, setEditingQuadra] = useState<any>(null);
  const [deletingQuadra, setDeletingQuadra] = useState<any>(null);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("quadras").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quadras"] });
      toast.success("Quadra excluída com sucesso!");
      setDeletingQuadra(null);
    },
    onError: (error) => {
      toast.error("Erro ao excluir quadra: " + error.message);
    },
  });

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Esporte</TableHead>
              <TableHead>Valor Normal</TableHead>
              <TableHead>Valor Pico</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quadras.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Nenhuma quadra cadastrada
                </TableCell>
              </TableRow>
            ) : (
              quadras.map((quadra) => (
                <TableRow key={quadra.id}>
                  <TableCell className="font-medium">{quadra.numero}</TableCell>
                  <TableCell>{quadra.nome}</TableCell>
                  <TableCell>{esporteMap[quadra.tipo_esporte]}</TableCell>
                  <TableCell>R$ {Number(quadra.valor_hora_normal).toFixed(2)}</TableCell>
                  <TableCell>R$ {Number(quadra.valor_hora_pico).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={statusMap[quadra.status as keyof typeof statusMap].variant}>
                      {statusMap[quadra.status as keyof typeof statusMap].label}
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
                        <DropdownMenuItem onClick={() => setEditingQuadra(quadra)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeletingQuadra(quadra)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <QuadraDialog
        open={!!editingQuadra}
        onOpenChange={(open) => !open && setEditingQuadra(null)}
        quadra={editingQuadra}
      />

      <AlertDialog open={!!deletingQuadra} onOpenChange={(open) => !open && setDeletingQuadra(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Excluir Quadra
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a quadra <strong>{deletingQuadra?.nome}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deletingQuadra.id)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
