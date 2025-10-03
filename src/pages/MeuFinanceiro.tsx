import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, FileText, History, Building2, ExternalLink, Copy } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

export default function MeuFinanceiro() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedArena, setSelectedArena] = useState<string>("all");

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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copiado!` });
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

                    {mens.asaas_invoice_url && (
                      <div className="space-y-2 pt-4 border-t">
                        <Button
                          variant="default"
                          className="w-full"
                          onClick={() => window.open(mens.asaas_invoice_url!, "_blank")}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Acessar Fatura Asaas
                        </Button>

                        {mens.pix_copy_paste && (
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => copyToClipboard(mens.pix_copy_paste!, "PIX Copia e Cola")}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copiar PIX
                          </Button>
                        )}

                        {mens.linha_digitavel && (
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => copyToClipboard(mens.linha_digitavel!, "Linha Digitável")}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copiar Boleto
                          </Button>
                        )}
                      </div>
                    )}
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
      </div>
    </Layout>
  );
}
