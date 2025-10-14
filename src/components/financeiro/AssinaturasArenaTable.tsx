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
import { MoreHorizontal, Pencil, Eye, DollarSign, Building2 } from "lucide-react";
import { AssinaturaArenaDialog } from "./AssinaturaArenaDialog";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface AssinaturasArenaTableProps {
  arenaFilter?: string;
}

export function AssinaturasArenaTable({ arenaFilter }: AssinaturasArenaTableProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAssinatura, setSelectedAssinatura] = useState<any>(null);

  const { data: assinaturas, isLoading } = useQuery({
    queryKey: ["assinaturas-arena", arenaFilter],
    queryFn: async () => {
      let query = supabase
        .from("assinaturas_arena")
        .select(`
          *,
          arenas(id, nome, email, cnpj),
          planos_sistema(id, nome, valor_mensal)
        `)
        .order("created_at", { ascending: false });

      if (arenaFilter && arenaFilter !== "all") {
        query = query.eq("arena_id", arenaFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const gerarFaturaMutation = useMutation({
    mutationFn: async (assinatura: any) => {
      const { data, error } = await supabase.functions.invoke("gerar-fatura-sistema", {
        body: { assinatura_id: assinatura.id },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Fatura gerada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["faturas-sistema"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao gerar fatura");
    },
  });

  const handleEdit = (assinatura: any) => {
    setSelectedAssinatura(assinatura);
    setDialogOpen(true);
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
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[100px]">Número</TableHead>
                <TableHead className="min-w-[140px]">Arena</TableHead>
                <TableHead className="hidden md:table-cell min-w-[100px]">Plano</TableHead>
                <TableHead className="min-w-[100px]">Valor</TableHead>
                <TableHead className="hidden sm:table-cell min-w-[90px]">Venc.</TableHead>
                <TableHead className="hidden sm:table-cell min-w-[90px]">Início</TableHead>
                <TableHead className="min-w-[80px]">Status</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assinaturas?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <EmptyState
                      icon={Building2}
                      title="Nenhuma assinatura encontrada"
                      description="As arenas ainda não possuem assinaturas ativas. Crie a primeira assinatura para começar."
                      action={{
                        label: "Criar Assinatura",
                        onClick: () => setDialogOpen(true),
                      }}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                assinaturas?.map((assinatura) => (
                  <TableRow key={assinatura.id}>
                    <TableCell className="font-mono text-sm">
                      {assinatura.numero_assinatura || "N/A"}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{assinatura.arenas?.nome || "Arena não encontrada"}</p>
                        <p className="text-sm text-muted-foreground">{assinatura.arenas?.email || "-"}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{assinatura.planos_sistema?.nome || "N/A"}</TableCell>
                    <TableCell>R$ {Number(assinatura.valor_mensal).toFixed(2)}</TableCell>
                    <TableCell className="hidden sm:table-cell">Dia {assinatura.dia_vencimento}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {format(new Date(assinatura.data_inicio), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>{getStatusBadge(assinatura.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(assinatura)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            navigate(`/financeiro?tab=faturas&assinatura=${assinatura.id}`);
                            toast.success("Filtrando faturas da assinatura");
                          }}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Faturas
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => gerarFaturaMutation.mutate(assinatura)}
                          >
                            <DollarSign className="mr-2 h-4 w-4" />
                            Gerar Fatura Manualmente
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
      </div>

      <AssinaturaArenaDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSelectedAssinatura(null);
        }}
        assinatura={selectedAssinatura}
      />
    </>
  );
}
