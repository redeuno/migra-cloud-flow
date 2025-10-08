import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Download, AlertCircle } from "lucide-react";
import { ArenasTable } from "@/components/arenas/ArenasTable";
import { ArenaDialog } from "@/components/arenas/ArenaDialog";
import { EmptyState } from "@/components/EmptyState";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useExportData } from "@/hooks/useExportData";
import { addDays, isBefore } from "date-fns";

export default function Arenas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [planoFilter, setPlanoFilter] = useState<string>("todos");
  const { exportToCSV } = useExportData();

  const { data: arenas, isLoading } = useQuery({
    queryKey: ["arenas", searchTerm, statusFilter, planoFilter],
    queryFn: async () => {
      let query = supabase
        .from("arenas")
        .select(`
          *,
          assinaturas_arena (
            valor_mensal,
            data_inicio,
            data_fim,
            status
          ),
          faturas_sistema (
            data_vencimento,
            status_pagamento
          )
        `)
        .order("nome");

      if (searchTerm) {
        query = query.or(`nome.ilike.%${searchTerm}%,cnpj.ilike.%${searchTerm}%`);
      }

      if (statusFilter !== "todos") {
        query = query.eq("status", statusFilter as "ativo" | "suspenso" | "bloqueado" | "inativo");
      }

      const { data, error } = await query;
      if (error) throw error;

      // Filtrar por plano
      let filteredData = data;
      if (planoFilter !== "todos") {
        filteredData = data?.filter((arena: any) => {
          const valorMensal = arena.assinaturas_arena?.[0]?.valor_mensal;
          return valorMensal === parseInt(planoFilter);
        });
      }

      return filteredData;
    },
  });

  // Contar arenas inadimplentes
  const arenasInadimplentes = arenas?.filter((arena: any) => {
    const faturaPendente = arena.faturas_sistema?.find(
      (f: any) => f.status_pagamento === "pendente" && 
      isBefore(new Date(f.data_vencimento), new Date())
    );
    return !!faturaPendente;
  }).length || 0;

  // Contar arenas com vencimento próximo (3 dias)
  const arenasVencendoEmBreve = arenas?.filter((arena: any) => {
    const proximaFatura = arena.faturas_sistema?.find(
      (f: any) => f.status_pagamento === "pendente" && 
      isBefore(new Date(f.data_vencimento), addDays(new Date(), 3))
    );
    return !!proximaFatura && !isBefore(new Date(proximaFatura.data_vencimento), new Date());
  }).length || 0;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Arenas</h1>
            <p className="text-muted-foreground">
              Gerencie todas as arenas do sistema
            </p>
            {arenasInadimplentes > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {arenasInadimplentes} inadimplente{arenasInadimplentes > 1 ? "s" : ""}
                </Badge>
                {arenasVencendoEmBreve > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {arenasVencendoEmBreve} vencendo em 3 dias
                  </Badge>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => arenas && exportToCSV(arenas, "arenas")}>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Arena
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Arenas</CardTitle>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou CNPJ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos status</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="suspenso">Suspenso</SelectItem>
                </SelectContent>
              </Select>
              <Select value={planoFilter} onValueChange={setPlanoFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos planos</SelectItem>
                  <SelectItem value="99">R$ 99</SelectItem>
                  <SelectItem value="199">R$ 199</SelectItem>
                  <SelectItem value="299">R$ 299</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : arenas && arenas.length > 0 ? (
              <ArenasTable arenas={arenas} />
            ) : (
              <EmptyState
                icon={Plus}
                title="Nenhuma arena cadastrada"
                description="Comece criando sua primeira arena"
                action={{
                  label: "Nova Arena",
                  onClick: () => setDialogOpen(true)
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <ArenaDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </Layout>
  );
}
