import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { MovimentacaoDialog } from "./MovimentacaoDialog";
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

export function MovimentacoesTable() {
  const { arenaId } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMovimentacao, setSelectedMovimentacao] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [movimentacaoToDelete, setMovimentacaoToDelete] = useState<string | null>(null);

  const { data: movimentacoes, isLoading } = useQuery({
    queryKey: ["movimentacoes", arenaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movimentacoes_financeiras")
        .select("*")
        .eq("arena_id", arenaId!)
        .order("data_movimentacao", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!arenaId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("movimentacoes_financeiras")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movimentacoes"] });
      toast({
        title: "Sucesso",
        description: "Movimentação excluída com sucesso",
      });
      setDeleteDialogOpen(false);
      setMovimentacaoToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (movimentacao: any) => {
    setSelectedMovimentacao(movimentacao);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setMovimentacaoToDelete(id);
    setDeleteDialogOpen(true);
  };

  const getCategoriaLabel = (categoria: string) => {
    const labels: Record<string, string> = {
      agendamento: "Agendamento",
      aula: "Aula",
      equipamento: "Equipamento",
      evento: "Evento",
      manutencao: "Manutenção",
      mensalidade: "Mensalidade",
      outros: "Outros",
      salario: "Salário",
      torneio: "Torneio",
    };
    return labels[categoria] || categoria;
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Carregando...</div>;
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Forma de Pagamento</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movimentacoes?.map((movimentacao) => (
            <TableRow key={movimentacao.id}>
              <TableCell>{format(new Date(movimentacao.data_movimentacao), "dd/MM/yyyy")}</TableCell>
              <TableCell>
                {movimentacao.tipo === "receita" ? (
                  <Badge variant="default" className="gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Receita
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1">
                    <TrendingDown className="h-3 w-3" />
                    Despesa
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {movimentacao.categoria_id ? "Categoria vinculada" : "N/A"}
                </Badge>
              </TableCell>
              <TableCell>{movimentacao.descricao}</TableCell>
              <TableCell>
                {movimentacao.forma_pagamento ? (
                  <span className="capitalize">{movimentacao.forma_pagamento.replace("_", " ")}</span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className={movimentacao.tipo === "receita" ? "text-green-600" : "text-red-600"}>
                {movimentacao.tipo === "receita" ? "+" : "-"} R$ {movimentacao.valor.toFixed(2)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(movimentacao)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(movimentacao.id)}
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

      <MovimentacaoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        movimentacao={selectedMovimentacao}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta movimentação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => movimentacaoToDelete && deleteMutation.mutate(movimentacaoToDelete)}
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
