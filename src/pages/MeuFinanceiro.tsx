import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { CreditCard, FileText, History, Building2, ExternalLink, Copy, QrCode, Loader2, Share2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

export default function MeuFinanceiro() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedArena, setSelectedArena] = useState<string>("all");
  const [formaPagamento, setFormaPagamento] = useState<"PIX" | "BOLETO" | "CREDIT_CARD">("PIX");
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPaymentData, setSelectedPaymentData] = useState<any>(null);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);

  // Buscar usuário e suas arenas
  const { data: usuario } = useQuery({
    queryKey: ["usuario-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("usuarios")
        .select("*, arenas(*)")
        .eq("auth_id", user?.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Buscar contratos
  const { data: contratos, isLoading: loadingContratos } = useQuery({
    queryKey: ["meus-contratos", usuario?.id, selectedArena],
    queryFn: async () => {
      let query = supabase
        .from("contratos")
        .select("*, arenas(nome)")
        .eq("usuario_id", usuario?.id);

      if (selectedArena !== "all") {
        query = query.eq("arena_id", selectedArena);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!usuario?.id,
  });

  // Buscar mensalidades
  const { data: mensalidades, isLoading: loadingMensalidades } = useQuery({
    queryKey: ["minhas-mensalidades", usuario?.id, selectedArena],
    queryFn: async () => {
      const contratoIds = contratos?.map(c => c.id) || [];
      if (contratoIds.length === 0) return [];

      let query = supabase
        .from("mensalidades")
        .select("*, contratos(tipo_contrato, arenas(nome))")
        .in("contrato_id", contratoIds);

      const { data, error } = await query.order("data_vencimento", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!contratos,
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      ativo: { variant: "default", label: "Ativo" },
      cancelado: { variant: "destructive", label: "Cancelado" },
      suspenso: { variant: "secondary", label: "Suspenso" },
      pendente: { variant: "secondary", label: "Pendente" },
      pago: { variant: "default", label: "Pago" },
      vencido: { variant: "destructive", label: "Vencido" },
      cancelada: { variant: "outline", label: "Cancelada" },
    };
    const config = variants[status] || { variant: "outline", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Mutation para gerar cobrança
  const gerarCobrancaMutation = useMutation({
    mutationFn: async ({ mensalidade }: { mensalidade: any }) => {
      const contrato = contratos?.find(c => c.id === mensalidade.contrato_id);
      if (!contrato) throw new Error("Contrato não encontrado");

      const { data, error } = await supabase.functions.invoke("asaas-cobranca", {
        body: {
          contratoId: mensalidade.contrato_id,
          mensalidadeId: mensalidade.id,
          valor: mensalidade.valor_final,
          vencimento: mensalidade.data_vencimento,
          clienteNome: usuario?.nome_completo,
          clienteEmail: usuario?.email,
          clienteCpf: usuario?.cpf,
          formaPagamento,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Cobrança gerada!",
        description: `Pagamento via ${formaPagamento} criado com sucesso`,
      });
      queryClient.invalidateQueries({ queryKey: ["minhas-mensalidades"] });
      
      // Mostrar modal com todas as opções
      setSelectedPaymentData({
        ...data,
        mensalidadeId: variables.mensalidade.id,
        valor: variables.mensalidade.valor_final,
        formaPagamento,
      });
      setPaymentDialogOpen(true);
    },
    onError: (error: any) => {
      console.error("Erro ao gerar cobrança:", error);
      
      // Tentar extrair mensagem de erro detalhada
      let errorMessage = "Não foi possível gerar o pagamento. Tente novamente.";
      
      if (error?.message) {
        try {
          const errorData = JSON.parse(error.message);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Erro ao gerar pagamento",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copiado!` });
  };

  const handleGerarCobranca = (mensalidade: any) => {
    gerarCobrancaMutation.mutate({ mensalidade });
  };

  // Enviar link por WhatsApp
  const enviarWhatsAppMutation = useMutation({
    mutationFn: async ({ mensalidadeId, link }: { mensalidadeId: string; link: string }) => {
      const { data, error } = await supabase.functions.invoke("enviar-link-pagamento", {
        body: {
          mensalidade_id: mensalidadeId,
          cliente_id: usuario?.id,
          enviar_whatsapp: true,
          enviar_email: false,
          mensagem_customizada: `Olá! Seu link de pagamento está disponível: ${link}`,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Link enviado!",
        description: "O link de pagamento foi enviado para seu WhatsApp",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar",
        description: error.message || "Não foi possível enviar o link",
        variant: "destructive",
      });
    },
  });

  const handleEnviarWhatsApp = () => {
    if (!selectedPaymentData?.invoiceUrl || !selectedPaymentData?.mensalidadeId) {
      toast({
        title: "Erro",
        description: "Link de pagamento não disponível",
        variant: "destructive",
      });
      return;
    }

    setSendingWhatsApp(true);
    enviarWhatsAppMutation.mutate(
      {
        mensalidadeId: selectedPaymentData.mensalidadeId,
        link: selectedPaymentData.invoiceUrl,
      },
      {
        onSettled: () => setSendingWhatsApp(false),
      }
    );
  };

  const handleVerPagamento = (mensalidade: any) => {
    setSelectedPaymentData({
      pixQrCode: mensalidade.qr_code_pix,
      pixCopyPaste: mensalidade.pix_copy_paste,
      invoiceUrl: mensalidade.asaas_invoice_url,
      linhaDigitavel: mensalidade.linha_digitavel,
      mensalidadeId: mensalidade.id,
      valor: mensalidade.valor_final,
      formaPagamento: mensalidade.forma_pagamento,
    });
    setPaymentDialogOpen(true);
  };

  const mensalidadesPendentes = mensalidades?.filter(m => m.status_pagamento === "pendente") || [];
  const mensalidadesPagas = mensalidades?.filter(m => m.status_pagamento === "pago") || [];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Meu Financeiro</h1>
            <p className="text-muted-foreground">
              Gerencie seus contratos, mensalidades e pagamentos
            </p>
          </div>
        </div>

        {/* Arena do usuário */}
        {usuario?.arenas && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Minha Arena
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-lg">{usuario.arenas.nome}</p>
                  <p className="text-sm text-muted-foreground">{usuario.arenas.email}</p>
                </div>
                <Badge variant="default">Ativo</Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cards de resumo */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contratos Ativos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {contratos?.filter(c => c.status === "ativo").length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mensalidades Pendentes</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mensalidadesPendentes.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total: R${" "}
                {mensalidadesPendentes
                  .reduce((sum, m) => sum + Number(m.valor_final || 0), 0)
                  .toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagamentos Realizados</CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mensalidadesPagas.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pendentes" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pendentes">
              Pendentes ({mensalidadesPendentes.length})
            </TabsTrigger>
            <TabsTrigger value="contratos">Contratos</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="pendentes" className="space-y-4">
            <div className="mb-4 flex items-center gap-4">
              <label className="text-sm font-medium">Forma de pagamento:</label>
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

            {loadingMensalidades ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : mensalidadesPendentes.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Nenhuma mensalidade pendente
                </CardContent>
              </Card>
            ) : (
              mensalidadesPendentes.map((mens) => (
                <Card key={mens.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base">
                          {mens.contratos?.tipo_contrato?.replace("_", " ").toUpperCase()}
                        </CardTitle>
                        <CardDescription>
                          Arena: {mens.contratos?.arenas?.nome}
                        </CardDescription>
                      </div>
                      {getStatusBadge(mens.status_pagamento)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Vencimento:</span>
                        <span className="font-medium">
                          {format(new Date(mens.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Valor:</span>
                        <span className="font-bold text-lg">
                          R$ {Number(mens.valor_final).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-4 border-t">
                      {!mens.asaas_invoice_url ? (
                        <Button
                          variant="default"
                          className="w-full"
                          onClick={() => handleGerarCobranca(mens)}
                          disabled={gerarCobrancaMutation.isPending}
                        >
                          {gerarCobrancaMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Gerando...
                            </>
                          ) : (
                            <>
                              <CreditCard className="mr-2 h-4 w-4" />
                              Gerar Pagamento {formaPagamento}
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          className="w-full"
                          onClick={() => handleVerPagamento(mens)}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Ver Opções de Pagamento
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="contratos" className="space-y-4">
            {loadingContratos ? (
              <div className="space-y-3">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : contratos?.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Nenhum contrato encontrado
                </CardContent>
              </Card>
            ) : (
              contratos?.map((contrato) => (
                <Card key={contrato.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base">
                          {contrato.tipo_contrato.replace("_", " ").toUpperCase()}
                        </CardTitle>
                        <CardDescription>
                          {contrato.numero_contrato} - {contrato.arenas?.nome}
                        </CardDescription>
                      </div>
                      {getStatusBadge(contrato.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Valor Mensal:</span>
                        <span className="font-semibold">R$ {Number(contrato.valor_mensal).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Início:</span>
                        <span>{format(new Date(contrato.data_inicio), "dd/MM/yyyy", { locale: ptBR })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Vencimento:</span>
                        <span>Dia {contrato.dia_vencimento}</span>
                      </div>
                      {contrato.descricao && (
                        <div className="pt-2 border-t">
                          <p className="text-muted-foreground text-xs">{contrato.descricao}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="historico" className="space-y-4">
            {loadingMensalidades ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : mensalidadesPagas.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Nenhum pagamento realizado ainda
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Pagamentos</CardTitle>
                  <CardDescription>Suas mensalidades pagas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mensalidadesPagas.map((mens) => (
                      <div key={mens.id} className="flex items-center justify-between py-3 border-b last:border-0">
                        <div>
                          <p className="font-medium">
                            {format(new Date(mens.data_pagamento!), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {mens.contratos?.arenas?.nome} - {mens.forma_pagamento}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">R$ {Number(mens.valor_final).toFixed(2)}</p>
                          {getStatusBadge(mens.status_pagamento)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Modal Unificado de Pagamento */}
        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Opções de Pagamento</DialogTitle>
              <DialogDescription>
                {selectedPaymentData?.valor && (
                  <span className="text-lg font-semibold text-foreground">
                    Valor: R$ {Number(selectedPaymentData.valor).toFixed(2)}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Link Principal Asaas (todas as formas) */}
              {selectedPaymentData?.invoiceUrl && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">🔗 Link de Pagamento Completo</h3>
                  <p className="text-sm text-muted-foreground">
                    Acesse o link para pagar via PIX, Boleto ou Cartão de Crédito
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      className="w-full"
                      onClick={() => window.open(selectedPaymentData.invoiceUrl, "_blank")}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Abrir Link
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleEnviarWhatsApp}
                      disabled={sendingWhatsApp || enviarWhatsAppMutation.isPending}
                    >
                      {sendingWhatsApp || enviarWhatsAppMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Share2 className="mr-2 h-4 w-4" />
                          Enviar WhatsApp
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              <Separator />

              {/* PIX - QR Code e Copia e Cola */}
              {selectedPaymentData?.pixQrCode && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <QrCode className="h-4 w-4" />
                    PIX - Pagamento Instantâneo
                  </h3>
                  
                  <div className="flex justify-center p-4 bg-white dark:bg-gray-100 rounded-lg border">
                    <img 
                      src={selectedPaymentData.pixQrCode} 
                      alt="QR Code PIX" 
                      className="w-48 h-48 sm:w-64 sm:h-64"
                    />
                  </div>
                  
                  {selectedPaymentData?.pixCopyPaste && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Código PIX Copia e Cola:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={selectedPaymentData.pixCopyPaste}
                          readOnly
                          className="flex-1 p-2 text-xs border rounded-md bg-muted font-mono"
                        />
                        <Button
                          size="sm"
                          onClick={() => copyToClipboard(selectedPaymentData.pixCopyPaste, "Código PIX")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Boleto - Linha Digitável */}
              {selectedPaymentData?.linhaDigitavel && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Boleto Bancário
                    </h3>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Linha Digitável:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={selectedPaymentData.linhaDigitavel}
                          readOnly
                          className="flex-1 p-2 text-xs border rounded-md bg-muted font-mono"
                        />
                        <Button
                          size="sm"
                          onClick={() => copyToClipboard(selectedPaymentData.linhaDigitavel, "Linha Digitável")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Cartão de Crédito */}
              {selectedPaymentData?.invoiceUrl && selectedPaymentData?.formaPagamento === "CREDIT_CARD" && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Cartão de Crédito
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Clique no link acima para pagar com cartão de crédito no ambiente seguro do Asaas
                    </p>
                  </div>
                </>
              )}

              {/* Info adicional */}
              <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
                ℹ️ O link principal permite escolher qualquer forma de pagamento (PIX, Boleto ou Cartão)
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
