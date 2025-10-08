import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CreditCard, Receipt, Send, Calendar, MessageSquare } from "lucide-react";
import { useState } from "react";

export default function MeuFinanceiro() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("pendentes");
  
  // Links diretos do Asaas (Sandbox)
  const ASAAS_CHECKOUT_LINK = "https://sandbox.asaas.com/c/damx27mcxowumc0k";
  const ASAAS_SUBSCRIPTION_LINK = "https://sandbox.asaas.com/c/24rc47o7jxuw17g9";

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
  const { data: contratos } = useQuery({
    queryKey: ["meus-contratos", usuario?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contratos")
        .select("*, arenas(nome)")
        .eq("usuario_id", usuario?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!usuario?.id,
  });

  // Buscar mensalidades
  const { data: mensalidades } = useQuery({
    queryKey: ["minhas-mensalidades", usuario?.id],
    queryFn: async () => {
      const contratoIds = contratos?.map(c => c.id) || [];
      if (contratoIds.length === 0) return [];

      const { data, error } = await supabase
        .from("mensalidades")
        .select("*, contratos(tipo_contrato, arenas(nome))")
        .in("contrato_id", contratoIds)
        .order("data_vencimento", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!contratos,
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      pendente: { variant: "outline", label: "Pendente" },
      pago: { variant: "default", label: "Pago" },
      vencido: { variant: "destructive", label: "Vencido" },
      ativo: { variant: "default", label: "Ativo" },
      cancelado: { variant: "destructive", label: "Cancelado" },
    };
    const config = variants[status] || { variant: "outline", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handlePagarAgora = (link: string) => {
    window.open(link, "_blank");
  };

  const handleEnviarWhatsApp = (mensalidade: any, tipo: 'avulso' | 'recorrente' = 'avulso') => {
    const link = tipo === 'recorrente' ? ASAAS_SUBSCRIPTION_LINK : ASAAS_CHECKOUT_LINK;
    const tipoTexto = tipo === 'recorrente' ? 'assinatura recorrente' : 'pagamento avulso';
    const mensagem = `Olá! Aqui está o link para ${tipoTexto} da mensalidade de ${format(new Date(mensalidade.referencia), 'MMMM/yyyy', { locale: ptBR })}: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(mensagem)}`, '_blank');
    toast({
      title: "WhatsApp aberto",
      description: "Compartilhe o link de pagamento",
    });
  };

  const mensalidadesPendentes = mensalidades?.filter(m => m.status_pagamento === "pendente") || [];
  const mensalidadesPagas = mensalidades?.filter(m => m.status_pagamento === "pago") || [];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meu Financeiro</h1>
          <p className="text-muted-foreground">
            Gerencie seus contratos, mensalidades e pagamentos
          </p>
        </div>

        {/* Arena info */}
        {usuario?.arenas && (
          <Card>
            <CardHeader>
              <CardTitle>Minha Arena</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-lg">{usuario.arenas.nome}</p>
            </CardContent>
          </Card>
        )}

        {/* Summary cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card 
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => setActiveTab("contratos")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contratos Ativos</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contratos?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Clique para ver</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => setActiveTab("pendentes")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mensalidadesPendentes.length}</div>
              <p className="text-xs text-muted-foreground">Clique para pagar</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => setActiveTab("historico")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagas</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mensalidadesPagas.length}</div>
              <p className="text-xs text-muted-foreground">Ver histórico</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
            <TabsTrigger value="contratos">Contratos</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="pendentes" className="space-y-4 mt-4">
            {mensalidadesPendentes.length === 0 ? (
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
                      <div>
                        <CardTitle className="text-base">
                          {mens.contratos?.tipo_contrato?.replace("_", " ").toUpperCase()}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Arena: {mens.contratos?.arenas?.nome}
                        </p>
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

                    <div className="flex flex-col gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handlePagarAgora(ASAAS_CHECKOUT_LINK)}
                        className="w-full"
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        Pagar à vista
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handlePagarAgora(ASAAS_SUBSCRIPTION_LINK)}
                        className="w-full"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        Assinar recorrente
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEnviarWhatsApp(mens, 'avulso')}
                        className="w-full"
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Enviar por WhatsApp
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="contratos" className="space-y-4 mt-4">
            {contratos?.length === 0 ? (
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
                      <div>
                        <CardTitle className="text-base">
                          {contrato.tipo_contrato.replace("_", " ").toUpperCase()}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {contrato.numero_contrato} - {contrato.arenas?.nome}
                        </p>
                      </div>
                      {getStatusBadge(contrato.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Valor Mensal:</span>
                        <span className="font-bold">
                          R$ {Number(contrato.valor_mensal).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Dia Vencimento:</span>
                        <span className="font-medium">Dia {contrato.dia_vencimento}</span>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-2 w-full"
                      onClick={() => window.open(ASAAS_SUBSCRIPTION_LINK, "_blank")}
                    >
                      Assinar Recorrente
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="historico" className="space-y-4 mt-4">
            {mensalidadesPagas.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Nenhum pagamento realizado
                </CardContent>
              </Card>
            ) : (
              mensalidadesPagas.map((mens) => (
                <Card key={mens.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">
                          {mens.contratos?.tipo_contrato?.replace("_", " ").toUpperCase()}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Pago em {mens.data_pagamento ? format(new Date(mens.data_pagamento), "dd/MM/yyyy", { locale: ptBR }) : "N/A"}
                        </p>
                      </div>
                      {getStatusBadge(mens.status_pagamento)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Valor Pago:</span>
                      <span className="font-bold">R$ {Number(mens.valor_final).toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
