import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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
import { MoreHorizontal, Pencil, Trash2, Eye, DollarSign } from "lucide-react";
import { ContratoDialog } from "./ContratoDialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

export function ContratosTable() {
  const { arenaId } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedContrato, setSelectedContrato] = useState<any>(null);

  const { data: contratos, isLoading } = useQuery({
    queryKey: ["contratos", arenaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contratos")
        .select(`
          *,
          usuarios!contratos_usuario_id_fkey(id, nome_completo, email)
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
      const { error } = await supabase.from("contratos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
      toast.success("Contrato excluído com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir contrato");
    },
  });

  const handleEdit = (contrato: any) => {
    setSelectedContrato(contrato);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este contrato?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      ativo: "default",
      suspenso: "secondary",
      cancelado: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor Mensal</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Início</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contratos?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  Nenhum contrato encontrado
                </TableCell>
              </TableRow>
            ) : (
              contratos?.map((contrato) => (
                <TableRow key={contrato.id}>
                  <TableCell className="font-mono text-sm">
                    {contrato.numero_contrato || "N/A"}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{contrato.usuarios.nome_completo}</p>
                      <p className="text-sm text-muted-foreground">{contrato.usuarios.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{contrato.tipo_contrato}</TableCell>
                  <TableCell>R$ {Number(contrato.valor_mensal).toFixed(2)}</TableCell>
                  <TableCell>Dia {contrato.dia_vencimento}</TableCell>
                  <TableCell>
                    {format(new Date(contrato.data_inicio), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>{getStatusBadge(contrato.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(contrato)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate("/financeiro?tab=mensalidades")}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Mensalidades
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate("/financeiro?tab=mensalidades")}>
                          <DollarSign className="mr-2 h-4 w-4" />
                          Gerar Cobrança
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(contrato.id)}
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

      <ContratoDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSelectedContrato(null);
        }}
        contrato={selectedContrato}
      />
    </>
  );
}
