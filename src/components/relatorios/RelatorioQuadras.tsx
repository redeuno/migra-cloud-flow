import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, DollarSign, TrendingUp, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export function RelatorioQuadras() {
  const { data: quadras, isLoading } = useQuery({
    queryKey: ["relatorio-quadras"],
    queryFn: async () => {
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("arena_id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id || "")
        .single();

      if (!userRoles?.arena_id) return [];

      const { data, error } = await supabase
        .from("quadras")
        .select(`
          id,
          nome,
          numero,
          tipo_esporte,
          status,
          agendamentos (
            id,
            valor_total,
            status,
            hora_inicio,
            hora_fim,
            data_agendamento
          )
        `)
        .eq("arena_id", userRoles.arena_id);

      if (error) throw error;

      return data.map((quadra) => {
        const agendamentos = quadra.agendamentos || [];
        const agendamentosConfirmados = agendamentos.filter((a) => a.status === "confirmado");
        
        const receitaTotal = agendamentosConfirmados.reduce(
          (sum, a) => sum + (a.valor_total || 0),
          0
        );

        // Calcular taxa de ocupação (assumindo 12 horas disponíveis por dia)
        const horasTotaisDisponiveis = 12 * 30; // 12h/dia * 30 dias
        const horasOcupadas = agendamentosConfirmados.reduce((sum, a) => {
          const inicio = new Date(`2000-01-01T${a.hora_inicio}`);
          const fim = new Date(`2000-01-01T${a.hora_fim}`);
          const horas = (fim.getTime() - inicio.getTime()) / (1000 * 60 * 60);
          return sum + horas;
        }, 0);

        const taxaOcupacao = (horasOcupadas / horasTotaisDisponiveis) * 100;

        return {
          id: quadra.id,
          nome: quadra.nome,
          numero: quadra.numero,
          tipo: quadra.tipo_esporte,
          status: quadra.status,
          totalAgendamentos: agendamentos.length,
          agendamentosConfirmados: agendamentosConfirmados.length,
          receitaTotal,
          taxaOcupacao: Math.min(taxaOcupacao, 100),
          horasOcupadas,
        };
      });
    },
  });

  const totais = quadras?.reduce(
    (acc, quad) => ({
      agendamentos: acc.agendamentos + quad.totalAgendamentos,
      receita: acc.receita + quad.receitaTotal,
      horasOcupadas: acc.horasOcupadas + quad.horasOcupadas,
    }),
    { agendamentos: 0, receita: 0, horasOcupadas: 0 }
  );

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

  const mediaOcupacao = quadras?.length
    ? quadras.reduce((sum, q) => sum + q.taxaOcupacao, 0) / quadras.length
    : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quadras</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quadras?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totais?.agendamentos || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totais?.receita || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ocupação Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mediaOcupacao.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Desempenho por Quadra</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quadra</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Agendamentos</TableHead>
                <TableHead className="text-center">Horas Ocupadas</TableHead>
                <TableHead>Taxa Ocupação</TableHead>
                <TableHead className="text-right">Receita</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quadras?.map((quadra) => (
                <TableRow key={quadra.id}>
                  <TableCell>
                    <div className="font-medium">
                      Quadra {quadra.numero} - {quadra.nome}
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{quadra.tipo.replace("_", " ")}</TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        quadra.status === "ativa"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {quadra.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">{quadra.agendamentosConfirmados}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {quadra.horasOcupadas.toFixed(1)}h
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{quadra.taxaOcupacao.toFixed(1)}%</span>
                      </div>
                      <Progress value={quadra.taxaOcupacao} className="h-2" />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(quadra.receitaTotal)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
