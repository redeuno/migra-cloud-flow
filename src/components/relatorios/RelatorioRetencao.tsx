import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingDown, TrendingUp, Users, Activity } from "lucide-react";

export function RelatorioRetencao() {
  const { data: metricas, isLoading } = useQuery({
    queryKey: ["relatorio-retencao"],
    queryFn: async () => {
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("arena_id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id || "")
        .single();

      if (!userRoles?.arena_id) return null;

      // Buscar todos os contratos
      const { data: contratos, error: contratosError } = await supabase
        .from("contratos")
        .select(`
          id,
          status,
          data_inicio,
          data_fim,
          data_cancelamento,
          usuario_id,
          usuarios (
            nome_completo
          )
        `)
        .eq("arena_id", userRoles.arena_id);

      if (contratosError) throw contratosError;

      // Análise de retenção
      const contratosAtivos = contratos.filter((c) => c.status === "ativo");
      const contratosCancelados = contratos.filter((c) => c.status === "cancelado");
      const contratosSuspensos = contratos.filter((c) => c.status === "suspenso");

      // Calcular tempo médio de permanência dos cancelados
      const temposMedios = contratosCancelados.map((c) => {
        const inicio = new Date(c.data_inicio);
        const fim = c.data_cancelamento ? new Date(c.data_cancelamento) : new Date();
        const meses = Math.floor((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24 * 30));
        return meses;
      });

      const tempoMedioPermanencia =
        temposMedios.length > 0
          ? temposMedios.reduce((sum, t) => sum + t, 0) / temposMedios.length
          : 0;

      // Taxa de churn (cancelamentos nos últimos 30 dias)
      const trintaDiasAtras = new Date();
      trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

      const cancelamentosRecentes = contratosCancelados.filter((c) => {
        if (!c.data_cancelamento) return false;
        return new Date(c.data_cancelamento) >= trintaDiasAtras;
      });

      const taxaChurn = contratos.length > 0 
        ? (cancelamentosRecentes.length / contratos.length) * 100 
        : 0;

      // Taxa de retenção
      const taxaRetencao = 100 - taxaChurn;

      // Buscar agendamentos dos últimos 90 dias por cliente
      const noventaDiasAtras = new Date();
      noventaDiasAtras.setDate(noventaDiasAtras.getDate() - 90);

      const { data: agendamentos } = await supabase
        .from("agendamentos")
        .select("cliente_id, data_agendamento")
        .eq("arena_id", userRoles.arena_id)
        .gte("data_agendamento", noventaDiasAtras.toISOString().split("T")[0]);

      // Calcular frequência por cliente
      const frequenciaPorCliente = new Map();
      agendamentos?.forEach((ag) => {
        if (!ag.cliente_id) return;
        const count = frequenciaPorCliente.get(ag.cliente_id) || 0;
        frequenciaPorCliente.set(ag.cliente_id, count + 1);
      });

      const clientesAtivos = frequenciaPorCliente.size;
      const mediaAgendamentosCliente = clientesAtivos > 0
        ? Array.from(frequenciaPorCliente.values()).reduce((sum, v) => sum + v, 0) / clientesAtivos
        : 0;

      // Clientes em risco (sem agendamento nos últimos 30 dias)
      const { data: clientesRisco } = await supabase
        .from("usuarios")
        .select(`
          id,
          nome_completo,
          created_at,
          agendamentos!inner (
            id,
            data_agendamento
          )
        `)
        .eq("arena_id", userRoles.arena_id)
        .lt("agendamentos.data_agendamento", trintaDiasAtras.toISOString().split("T")[0])
        .limit(10);

      return {
        contratosAtivos: contratosAtivos.length,
        contratosCancelados: contratosCancelados.length,
        contratosSuspensos: contratosSuspensos.length,
        tempoMedioPermanencia,
        taxaChurn,
        taxaRetencao,
        clientesAtivos,
        mediaAgendamentosCliente,
        clientesRisco: clientesRisco || [],
      };
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Retenção</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metricas?.taxaRetencao.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Churn</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {metricas?.taxaChurn.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas?.clientesAtivos || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio (meses)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricas?.tempoMedioPermanencia.toFixed(1)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status dos Contratos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Ativos</span>
                <span className="text-2xl font-bold text-green-600">
                  {metricas?.contratosAtivos}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Cancelados</span>
                <span className="text-2xl font-bold text-red-600">
                  {metricas?.contratosCancelados}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Suspensos</span>
                <span className="text-2xl font-bold text-yellow-600">
                  {metricas?.contratosSuspensos}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Engajamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  Média de Agendamentos por Cliente (90 dias)
                </p>
                <p className="text-3xl font-bold">
                  {metricas?.mediaAgendamentosCliente.toFixed(1)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clientes em Risco (sem agendamento há 30+ dias)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Último Agendamento</TableHead>
                <TableHead>Dias Inativo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metricas?.clientesRisco.map((cliente: any) => {
                const ultimoAgendamento = cliente.agendamentos?.[0];
                const diasInativo = ultimoAgendamento
                  ? Math.floor(
                      (new Date().getTime() -
                        new Date(ultimoAgendamento.data_agendamento).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                  : 0;

                return (
                  <TableRow key={cliente.id}>
                    <TableCell className="font-medium">{cliente.nome_completo}</TableCell>
                    <TableCell>
                      {ultimoAgendamento
                        ? new Date(ultimoAgendamento.data_agendamento).toLocaleDateString("pt-BR")
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <span className="text-red-600 font-medium">{diasInativo} dias</span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
