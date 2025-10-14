import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, DollarSign, TrendingUp, TrendingDown, AlertCircle, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ContratosTable } from "@/components/financeiro/ContratosTable";
import { MensalidadesTable } from "@/components/financeiro/MensalidadesTable";
import { MovimentacoesTable } from "@/components/financeiro/MovimentacoesTable";
import { RelatoriosFinanceiros } from "@/components/financeiro/RelatoriosFinanceiros";
import { MovimentacaoDialog } from "@/components/financeiro/MovimentacaoDialog";
import { AssinaturasArenaTable } from "@/components/financeiro/AssinaturasArenaTable";
import { AssinaturaArenaDialog } from "@/components/financeiro/AssinaturaArenaDialog";
import { FaturasSistemaTable } from "@/components/financeiro/FaturasSistemaTable";
import { ArenaSelector } from "@/components/financeiro/ArenaSelector";

export default function Financeiro() {
  const { arenaId, user } = useAuth();
  const [searchParams] = useSearchParams();
  const [movimentacaoDialogOpen, setMovimentacaoDialogOpen] = useState(false);
  const [assinaturaDialogOpen, setAssinaturaDialogOpen] = useState(false);
  const [selectedArenaFilter, setSelectedArenaFilter] = useState<string>("all");
  const [selectedAssinaturaFilter, setSelectedAssinaturaFilter] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("contratos");

  // Ler query params na inicialização
  useEffect(() => {
    const arenaParam = searchParams.get("arena");
    const tabParam = searchParams.get("tab");
    const assinaturaParam = searchParams.get("assinatura");
    
    if (arenaParam) {
      setSelectedArenaFilter(arenaParam);
    }
    if (tabParam) {
      setActiveTab(tabParam);
    }
    if (assinaturaParam) {
      setSelectedAssinaturaFilter(assinaturaParam);
      setActiveTab("faturas");
    }
  }, [searchParams]);

  // Verificar se é Super Admin
  const { data: userRoles } = useQuery({
    queryKey: ["user-roles", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const isSuperAdmin = userRoles?.some((r) => r.role === "super_admin") ?? false;
  
  // Garantir aba inicial correta conforme o perfil
  useEffect(() => {
    // Quando o papel carregar, ajuste a aba padrão
    if (isSuperAdmin) {
      // Para super admin, evitar abas que não existem (ex.: "contratos")
      if (["contratos", "mensalidades", "movimentacoes", "relatorios"].includes(activeTab)) {
        setActiveTab("assinaturas");
      }
    } else {
      // Para usuários comuns, evitar abas exclusivas do super admin
      if (["assinaturas", "faturas"].includes(activeTab)) {
        setActiveTab("contratos");
      }
    }
  }, [isSuperAdmin]);
  
  // Use filtered arena or user's arena - default to arenaId if loading
  const effectiveArenaId = isSuperAdmin && selectedArenaFilter !== "all" 
    ? selectedArenaFilter 
    : (arenaId || null);

  // Query para resumo do Super Admin
  const { data: resumoSuperAdmin } = useQuery({
    queryKey: ["resumo-super-admin", selectedArenaFilter],
    queryFn: async () => {
      if (!isSuperAdmin || selectedArenaFilter === "all") return null;

      // Buscar assinaturas ativas
      const { data: assinaturas } = await supabase
        .from("assinaturas_arena")
        .select("valor_mensal")
        .eq("arena_id", selectedArenaFilter)
        .eq("status", "ativo");

      // Buscar faturas pendentes
      const { data: faturasPendentes } = await supabase
        .from("faturas_sistema")
        .select("valor")
        .eq("arena_id", selectedArenaFilter)
        .eq("status_pagamento", "pendente");

      const assinaturasAtivas = assinaturas?.length || 0;
      const valorPendente = faturasPendentes?.reduce((acc, f) => acc + Number(f.valor), 0) || 0;
      const receitaMensal = assinaturas?.reduce((acc, a) => acc + Number(a.valor_mensal), 0) || 0;

      return { assinaturasAtivas, valorPendente, receitaMensal };
    },
    enabled: isSuperAdmin && selectedArenaFilter !== "all",
  });

  const { data: resumo } = useQuery({
    queryKey: ["resumo-financeiro", effectiveArenaId, selectedArenaFilter, isSuperAdmin],
    queryFn: async () => {
      const hoje = new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

      // Buscar movimentações do mês
      let movimentacoesQuery = supabase
        .from("movimentacoes_financeiras")
        .select("tipo, valor");
      
      if (selectedArenaFilter !== "all" && effectiveArenaId) {
        movimentacoesQuery = movimentacoesQuery.eq("arena_id", effectiveArenaId);
      }
      
      const { data: movimentacoes } = await movimentacoesQuery
        .gte("data_movimentacao", inicioMes.toISOString().split("T")[0])
        .lte("data_movimentacao", fimMes.toISOString().split("T")[0]);

      const receitas = movimentacoes?.filter((m) => m.tipo === "receita").reduce((sum, m) => sum + m.valor, 0) || 0;
      const despesas = movimentacoes?.filter((m) => m.tipo === "despesa").reduce((sum, m) => sum + m.valor, 0) || 0;

      // Buscar contratos ativos
      let contratosQuery = supabase
        .from("contratos")
        .select("*", { count: "exact", head: true })
        .eq("status", "ativo");
      
      if (selectedArenaFilter !== "all" && effectiveArenaId) {
        contratosQuery = contratosQuery.eq("arena_id", effectiveArenaId);
      }
      
      const { count: contratosAtivos } = await contratosQuery;

      // Buscar mensalidades pendentes
      let mensalidadesQuery = supabase
        .from("mensalidades")
        .select(`
          valor_final,
          contratos!mensalidades_contrato_id_fkey (
            arena_id
          )
        `)
        .eq("status_pagamento", "pendente");
      
      if (selectedArenaFilter !== "all" && effectiveArenaId) {
        mensalidadesQuery = mensalidadesQuery.eq("contratos.arena_id", effectiveArenaId);
      }
      
      const { data: mensalidadesPendentes } = await mensalidadesQuery;

      const valorPendente = mensalidadesPendentes?.reduce((sum, m) => sum + m.valor_final, 0) || 0;

      return {
        receitas,
        despesas,
        saldo: receitas - despesas,
        contratosAtivos: contratosAtivos || 0,
        valorPendente,
      };
    },
    enabled: !!(effectiveArenaId || isSuperAdmin),
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Financeiro</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gerencie as finanças {isSuperAdmin ? "do sistema" : "da sua arena"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {isSuperAdmin && (
              <ArenaSelector 
                value={selectedArenaFilter} 
                onChange={setSelectedArenaFilter} 
              />
            )}
            {!isSuperAdmin && (
              <Button onClick={() => setMovimentacaoDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Movimentação
              </Button>
            )}
          </div>
        </div>

        {/* Cards de Resumo para Super Admin */}
        {isSuperAdmin && selectedArenaFilter !== "all" && resumoSuperAdmin && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Assinaturas Ativas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{resumoSuperAdmin.assinaturasAtivas}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Faturas Pendentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">
                  R$ {resumoSuperAdmin.valorPendente.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Receita Mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-500">
                  R$ {resumoSuperAdmin.receitaMensal.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Cards de Resumo */}
        {(!isSuperAdmin) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receitas do Mês</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  R$ {resumo?.receitas.toFixed(2) || "0.00"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Despesas do Mês</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  R$ {resumo?.despesas.toFixed(2) || "0.00"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${(resumo?.saldo || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                  R$ {resumo?.saldo.toFixed(2) || "0.00"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contratos Ativos</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{resumo?.contratosAtivos || 0}</div>
                <p className="text-xs text-muted-foreground">
                  R$ {resumo?.valorPendente?.toFixed(2) || "0.00"} pendente
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Super Admin
          selectedArenaFilter !== "all" && resumoSuperAdmin ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Assinaturas Ativas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{resumoSuperAdmin.assinaturasAtivas}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Faturas Pendentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">
                    R$ {resumoSuperAdmin.valorPendente.toFixed(2)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Receita Mensal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-500">
                    R$ {resumoSuperAdmin.receitaMensal.toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            // Resumo Global (todas as arenas) quando filtro = all
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Receitas (Global)</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    R$ {resumo?.receitas?.toFixed(2) || "0.00"}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Despesas (Global)</CardTitle>
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    R$ {resumo?.despesas?.toFixed(2) || "0.00"}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Saldo (Global)</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${(resumo?.saldo || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                    R$ {resumo?.saldo?.toFixed(2) || "0.00"}
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        )}


        {/* Tabs de Conteúdo */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full h-auto gap-1" style={{ gridTemplateColumns: isSuperAdmin ? 'repeat(2, 1fr)' : 'repeat(2, 1fr) repeat(2, 1fr)' }}>
            {!isSuperAdmin && (
              <>
                <TabsTrigger value="contratos">Contratos</TabsTrigger>
                <TabsTrigger value="mensalidades">Mensalidades</TabsTrigger>
                <TabsTrigger value="movimentacoes" className="hidden sm:flex">Movimentações</TabsTrigger>
                <TabsTrigger value="relatorios" className="hidden sm:flex">Relatórios</TabsTrigger>
                <TabsTrigger value="movimentacoes" className="sm:hidden">Movim.</TabsTrigger>
                <TabsTrigger value="relatorios" className="sm:hidden">Relat.</TabsTrigger>
              </>
            )}
            {isSuperAdmin && (
              <>
                <TabsTrigger value="assinaturas">
                  <Building2 className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Assinaturas Arena</span>
                  <span className="sm:hidden">Assinaturas</span>
                </TabsTrigger>
                <TabsTrigger value="faturas">
                  <span className="hidden sm:inline">Faturas Sistema</span>
                  <span className="sm:hidden">Faturas</span>
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {!isSuperAdmin && (
            <>
              <TabsContent value="contratos" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Contratos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ContratosTable />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="mensalidades" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Mensalidades</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MensalidadesTable />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="movimentacoes" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Movimentações Financeiras</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MovimentacoesTable />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="relatorios" className="space-y-4">
                <RelatoriosFinanceiros />
              </TabsContent>
            </>
          )}

          {isSuperAdmin && (
            <>
              <TabsContent value="assinaturas" className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Assinaturas das Arenas</CardTitle>
                    <Button onClick={() => setAssinaturaDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Nova Assinatura
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <AssinaturasArenaTable arenaFilter={selectedArenaFilter} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="faturas" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Faturas do Sistema</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Cobranças das arenas para o sistema Verana
                    </p>
                  </CardHeader>
                  <CardContent>
                    <FaturasSistemaTable 
                      arenaFilter={selectedArenaFilter} 
                      assinaturaFilter={selectedAssinaturaFilter || undefined}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>

      <MovimentacaoDialog
        open={movimentacaoDialogOpen}
        onOpenChange={setMovimentacaoDialogOpen}
      />

      <AssinaturaArenaDialog
        open={assinaturaDialogOpen}
        onOpenChange={setAssinaturaDialogOpen}
      />
    </Layout>
  );
}