import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, ExternalLink, DollarSign, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { MensalidadeDialog } from "./MensalidadeDialog";

export function MensalidadesTable() {
  const { arenaId } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMensalidade, setSelectedMensalidade] = useState<any>(null);

  const { data: mensalidades, isLoading } = useQuery({
    queryKey: ["mensalidades", arenaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mensalidades")
        .select(`
          *,
          contratos!mensalidades_contrato_id_fkey (
            id,
            numero_contrato,
            usuarios!contratos_usuario_id_fkey (
              id,
              nome_completo,
              email,
              cpf
            )
          )
        `)
        .order("data_vencimento", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!arenaId,
  });

  const gerarCobrancaMutation = useMutation({
    mutationFn: async (mensalidade: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data, error } = await supabase.functions.invoke("asaas-cobranca", {
        body: {
          contratoId: mensalidade.contrato_id,
          mensalidadeId: mensalidade.id,
          valor: mensalidade.valor_final,
          vencimento: mensalidade.data_vencimento,
          clienteNome: mensalidade.contratos.usuarios.nome_completo,
          clienteEmail: mensalidade.contratos.usuarios.email,
          clienteCpf: mensalidade.contratos.usuarios.cpf,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Cobrança gerada",
        description: "Cobrança criada no Asaas com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["mensalidades"] });
      if (data.bankSlipUrl) {
        window.open(data.bankSlipUrl, "_blank");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao gerar cobrança",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const marcarComoPagoMutation = useMutation({
    mutationFn: async ({ id, formaPagamento }: { id: string; formaPagamento: "dinheiro" | "pix" | "boleto" | "cartao_credito" | "cartao_debito" }) => {
      const { error } = await supabase
        .from("mensalidades")
        .update({
          status_pagamento: "pago",
          data_pagamento: new Date().toISOString(),
          forma_pagamento: formaPagamento,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Mensalidade marcada como paga",
      });
      queryClient.invalidateQueries({ queryKey: ["mensalidades"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string, dataVencimento: string) => {
    const hoje = new Date();
    const vencimento = new Date(dataVencimento);

    if (status === "pago") {
      return <Badge variant="default">Pago</Badge>;
    } else if (status === "cancelado") {
      return <Badge variant="outline">Cancelado</Badge>;
    } else if (vencimento < hoje) {
      return <Badge variant="destructive">Vencido</Badge>;
    } else {
      return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  const handleEdit = (mensalidade: any) => {
    setSelectedMensalidade(mensalidade);
    setDialogOpen(true);
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Carregando...</div>;
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Contrato</TableHead>
            <TableHead>Referência</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mensalidades?.map((mensalidade) => (
            <TableRow key={mensalidade.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{mensalidade.contratos?.usuarios?.nome_completo}</div>
                  <div className="text-sm text-muted-foreground">{mensalidade.contratos?.usuarios?.email}</div>
                </div>
              </TableCell>
              <TableCell>{mensalidade.contratos?.numero_contrato}</TableCell>
              <TableCell>{format(new Date(mensalidade.referencia), "MM/yyyy")}</TableCell>
              <TableCell>{format(new Date(mensalidade.data_vencimento), "dd/MM/yyyy")}</TableCell>
              <TableCell>R$ {mensalidade.valor_final.toFixed(2)}</TableCell>
              <TableCell>{getStatusBadge(mensalidade.status_pagamento, mensalidade.data_vencimento)}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(mensalidade)}>
                      Editar
                    </DropdownMenuItem>
                    {mensalidade.status_pagamento === "pendente" && (
                      <>
                        <DropdownMenuItem
                          onClick={() => marcarComoPagoMutation.mutate({ id: mensalidade.id, formaPagamento: "dinheiro" })}
                        >
                          <DollarSign className="mr-2 h-4 w-4" />
                          Marcar como Pago
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => gerarCobrancaMutation.mutate(mensalidade)}
                          disabled={gerarCobrancaMutation.isPending}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Gerar Cobrança Asaas
                        </DropdownMenuItem>
                      </>
                    )}
                    {mensalidade.observacoes?.includes("bankSlipUrl") && (
                      <DropdownMenuItem
                        onClick={() => {
                          const url = mensalidade.observacoes.split(" | ")[1];
                          if (url) window.open(url, "_blank");
                        }}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Ver Boleto
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <MensalidadeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mensalidade={selectedMensalidade}
      />
    </>
  );
}
