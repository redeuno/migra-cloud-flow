import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal, ExternalLink, DollarSign, Copy, QrCode, CreditCard, FileText, Eye, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { MensalidadeDialog } from "./MensalidadeDialog";

export function MensalidadesTable() {
  const { arenaId } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pixDialogOpen, setPixDialogOpen] = useState(false);
  const [selectedMensalidade, setSelectedMensalidade] = useState<any>(null);
  const [selectedPixData, setSelectedPixData] = useState<any>(null);
  const [formaPagamento, setFormaPagamento] = useState<"BOLETO" | "PIX" | "CREDIT_CARD">("PIX");
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState<any>(null);

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
    mutationFn: async ({ mensalidade, formaPagamento }: { mensalidade: any; formaPagamento: string }) => {
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
          formaPagamento,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Cobrança gerada",
        description: `Cobrança ${variables.formaPagamento} criada com sucesso`,
      });
      queryClient.invalidateQueries({ queryKey: ["mensalidades"] });
      
      // Se for PIX, mostrar QR Code
      if (variables.formaPagamento === "PIX" && data.pixQrCode) {
        setSelectedPixData(data);
        setPixDialogOpen(true);
      } else if (data.bankSlipUrl) {
        window.open(data.bankSlipUrl, "_blank");
      } else if (data.invoiceUrl) {
        window.open(data.invoiceUrl, "_blank");
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

  const copiarTexto = (texto: string, label: string) => {
    navigator.clipboard.writeText(texto);
    toast({
      title: "Copiado!",
      description: `${label} copiado para a área de transferência`,
    });
  };

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

  const handleGerarCobranca = (mensalidade: any) => {
    setSelectedMensalidade(mensalidade);
    // Mostrar o modal de seleção de forma de pagamento inline
    gerarCobrancaMutation.mutate({ mensalidade, formaPagamento });
  };

  const mostrarPixDialog = (mensalidade: any) => {
    setSelectedPixData({
      pixQrCode: mensalidade.qr_code_pix,
      pixCopyPaste: mensalidade.pix_copy_paste,
      invoiceUrl: mensalidade.asaas_invoice_url,
    });
    setPixDialogOpen(true);
  };

  const formatDateSafe = (dateStr: string, formatStr: string) => {
    try {
      const date = parseISO(dateStr);
      if (isNaN(date.getTime())) return "—";
      return format(date, formatStr);
    } catch {
      return "—";
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Carregando...</div>;
  }

  return (
    <>
      <div className="mb-4 flex items-center gap-4">
        <label className="text-sm font-medium">Forma de pagamento padrão:</label>
        <Select value={formaPagamento} onValueChange={(value: any) => setFormaPagamento(value)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PIX">PIX (Instantâneo)</SelectItem>
            <SelectItem value="BOLETO">Boleto Bancário</SelectItem>
            <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Contrato</TableHead>
            <TableHead>Referência</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Pagamento</TableHead>
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
              <TableCell>{formatDateSafe(mensalidade.referencia, "MM/yyyy")}</TableCell>
              <TableCell>{formatDateSafe(mensalidade.data_vencimento, "dd/MM/yyyy")}</TableCell>
              <TableCell>R$ {mensalidade.valor_final?.toFixed(2) || "0.00"}</TableCell>
              <TableCell>{getStatusBadge(mensalidade.status_pagamento, mensalidade.data_vencimento)}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  {/* PIX */}
                  {mensalidade.qr_code_pix && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => mostrarPixDialog(mensalidade)}
                    >
                      <QrCode className="mr-2 h-3 w-3" />
                      Ver QR Code PIX
                    </Button>
                  )}
                  
                  {/* Boleto */}
                  {mensalidade.linha_digitavel && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copiarTexto(mensalidade.linha_digitavel, "Linha digitável")}
                    >
                      <Copy className="mr-2 h-3 w-3" />
                      Copiar Boleto
                    </Button>
                  )}
                  
                  {/* Link de pagamento */}
                  {mensalidade.asaas_invoice_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(mensalidade.asaas_invoice_url, "_blank")}
                    >
                      <ExternalLink className="mr-2 h-3 w-3" />
                      Abrir Link
                    </Button>
                  )}

                  {/* Forma de pagamento usada */}
                  {mensalidade.forma_pagamento && mensalidade.status_pagamento === "pago" && (
                    <Badge variant="outline" className="text-xs">
                      Pago via {mensalidade.forma_pagamento.toUpperCase()}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      setSelectedDetails(mensalidade);
                      setDetailsDialogOpen(true);
                    }}>
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Detalhes
                    </DropdownMenuItem>
                    {mensalidade.asaas_invoice_url && (
                      <DropdownMenuItem onClick={() => window.open(mensalidade.asaas_invoice_url, "_blank")}>
                        <Download className="mr-2 h-4 w-4" />
                        Baixar Boleto
                      </DropdownMenuItem>
                    )}
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
                        {!mensalidade.asaas_payment_id && (
                          <DropdownMenuItem
                            onClick={() => handleGerarCobranca(mensalidade)}
                            disabled={gerarCobrancaMutation.isPending}
                          >
                            <CreditCard className="mr-2 h-4 w-4" />
                            Gerar Cobrança {formaPagamento}
                          </DropdownMenuItem>
                        )}
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Dialog de edição */}
      <MensalidadeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mensalidade={selectedMensalidade}
      />

      {/* Dialog de detalhes */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalhes da Mensalidade</DialogTitle>
            <DialogDescription>
              Informações completas sobre o pagamento
            </DialogDescription>
          </DialogHeader>
          
          {selectedDetails && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Cliente</label>
                  <p className="text-sm">{selectedDetails.contratos?.usuarios?.nome_completo}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">CPF</label>
                  <p className="text-sm">{selectedDetails.contratos?.usuarios?.cpf}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Contrato</label>
                  <p className="text-sm">{selectedDetails.contratos?.numero_contrato}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Referência</label>
                  <p className="text-sm">{formatDateSafe(selectedDetails.referencia, "MM/yyyy")}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Vencimento</label>
                  <p className="text-sm">{formatDateSafe(selectedDetails.data_vencimento, "dd/MM/yyyy")}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="pt-1">{getStatusBadge(selectedDetails.status_pagamento, selectedDetails.data_vencimento)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Valor Base</label>
                  <p className="text-sm">R$ {selectedDetails.valor?.toFixed(2) || "0.00"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Desconto</label>
                  <p className="text-sm">R$ {selectedDetails.desconto?.toFixed(2) || "0.00"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Acréscimo</label>
                  <p className="text-sm">R$ {selectedDetails.acrescimo?.toFixed(2) || "0.00"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Valor Final</label>
                  <p className="text-sm font-bold">R$ {selectedDetails.valor_final?.toFixed(2) || "0.00"}</p>
                </div>
                {selectedDetails.data_pagamento && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Data Pagamento</label>
                      <p className="text-sm">{formatDateSafe(selectedDetails.data_pagamento, "dd/MM/yyyy HH:mm")}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Forma Pagamento</label>
                      <p className="text-sm uppercase">{selectedDetails.forma_pagamento || "—"}</p>
                    </div>
                  </>
                )}
              </div>
              
              {selectedDetails.observacoes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Observações</label>
                  <p className="text-sm mt-1">{selectedDetails.observacoes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para mostrar QR Code PIX */}
      <Dialog open={pixDialogOpen} onOpenChange={setPixDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Pagamento via PIX</DialogTitle>
            <DialogDescription>
              Escaneie o QR Code ou copie o código PIX abaixo
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedPixData?.pixQrCode && (
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <img 
                  src={selectedPixData.pixQrCode} 
                  alt="QR Code PIX" 
                  className="w-64 h-64"
                />
              </div>
            )}
            
            {selectedPixData?.pixCopyPaste && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Código PIX Copia e Cola:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={selectedPixData.pixCopyPaste}
                    readOnly
                    className="flex-1 p-2 text-sm border rounded-md bg-muted"
                  />
                  <Button
                    onClick={() => copiarTexto(selectedPixData.pixCopyPaste, "Código PIX")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {selectedPixData?.invoiceUrl && (
              <Button
                className="w-full"
                onClick={() => window.open(selectedPixData.invoiceUrl, "_blank")}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Abrir Página de Pagamento
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
