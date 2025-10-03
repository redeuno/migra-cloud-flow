import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [movimentacaoDialogOpen, setMovimentacaoDialogOpen] = useState(false);
  const [assinaturaDialogOpen, setAssinaturaDialogOpen] = useState(false);
  const [selectedArenaFilter, setSelectedArenaFilter] = useState<string>("all");

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
  
  // Use filtered arena or user's arena - default to arenaId if loading
  const effectiveArenaId = isSuperAdmin && selectedArenaFilter !== "all" 
    ? selectedArenaFilter 
    : (arenaId || null);

  const { data: resumo } = useQuery({
    queryKey: ["resumo-financeiro", effectiveArenaId, selectedArenaFilter],
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
    enabled: !!(effectiveArenaId || (isSuperAdmin && selectedArenaFilter === "all")),
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
            <p className="text-muted-foreground">
              Gerencie as finanças {isSuperAdmin ? "do sistema" : "da sua arena"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isSuperAdmin && (
              <ArenaSelector 
                value={selectedArenaFilter} 
                onChange={setSelectedArenaFilter} 
              />
            )}
            <Button onClick={() => setMovimentacaoDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Movimentação
            </Button>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                R$ {resumo?.valorPendente.toFixed(2) || "0.00"} pendente
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de Conteúdo */}
        <Tabs defaultValue="contratos" className="space-y-4">
          <TabsList>
            <TabsTrigger value="contratos">Contratos</TabsTrigger>
            <TabsTrigger value="mensalidades">Mensalidades</TabsTrigger>
            <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
            <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
            {isSuperAdmin && (
              <>
                <TabsTrigger value="assinaturas">
                  <Building2 className="mr-2 h-4 w-4" />
                  Assinaturas Arena
                </TabsTrigger>
                <TabsTrigger value="faturas-sistema">Faturas Sistema</TabsTrigger>
              </>
            )}
          </TabsList>

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
                    <AssinaturasArenaTable />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="faturas-sistema" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Faturas do Sistema</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Cobranças das arenas para o sistema Verana
                    </p>
                  </CardHeader>
                  <CardContent>
                    <FaturasSistemaTable />
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
