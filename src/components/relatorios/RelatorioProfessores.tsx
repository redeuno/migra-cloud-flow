import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, BookOpen, DollarSign, Star } from "lucide-react";

export function RelatorioProfessores() {
  const { data: professores, isLoading } = useQuery({
    queryKey: ["relatorio-professores"],
    queryFn: async () => {
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("arena_id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id || "")
        .single();

      if (!userRoles?.arena_id) return [];

      const { data, error } = await supabase
        .from("professores")
        .select(`
          id,
          usuario_id,
          avaliacao_media,
          total_avaliacoes,
          percentual_comissao_padrao,
          usuarios (
            nome_completo,
            email
          ),
          aulas (
            id,
            status,
            valor_por_aluno,
            presencas
          )
        `)
        .eq("arena_id", userRoles.arena_id)
        .eq("status", "ativo");

      if (error) throw error;

      return data.map((prof) => {
        const aulas = prof.aulas || [];
        const aulasRealizadas = aulas.filter((a) => a.status === "realizada").length;
        const totalAlunos = aulas.reduce((sum, a) => {
          const presencas = (a.presencas as any[]) || [];
          return sum + presencas.length;
        }, 0);
        const receitaGerada = aulas.reduce((sum, a) => {
          const presencas = (a.presencas as any[]) || [];
          return sum + presencas.length * (a.valor_por_aluno || 0);
        }, 0);

        return {
          id: prof.id,
          nome: (prof.usuarios as any)?.nome_completo || "N/A",
          email: (prof.usuarios as any)?.email || "N/A",
          avaliacaoMedia: prof.avaliacao_media || 0,
          totalAvaliacoes: prof.total_avaliacoes || 0,
          aulasRealizadas,
          totalAlunos,
          receitaGerada,
          comissao: (receitaGerada * (prof.percentual_comissao_padrao || 0)) / 100,
        };
      });
    },
  });

  const totais = professores?.reduce(
    (acc, prof) => ({
      aulas: acc.aulas + prof.aulasRealizadas,
      alunos: acc.alunos + prof.totalAlunos,
      receita: acc.receita + prof.receitaGerada,
      comissoes: acc.comissoes + prof.comissao,
    }),
    { aulas: 0, alunos: 0, receita: 0, comissoes: 0 }
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

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Aulas</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totais?.aulas || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alunos</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totais?.alunos || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Gerada</CardTitle>
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
            <CardTitle className="text-sm font-medium">Comissões</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totais?.comissoes || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Desempenho por Professor</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Professor</TableHead>
                <TableHead className="text-center">Avaliação</TableHead>
                <TableHead className="text-center">Aulas</TableHead>
                <TableHead className="text-center">Alunos</TableHead>
                <TableHead className="text-right">Receita</TableHead>
                <TableHead className="text-right">Comissão</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {professores?.map((prof) => (
                <TableRow key={prof.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{prof.nome}</div>
                      <div className="text-sm text-muted-foreground">{prof.email}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{prof.avaliacaoMedia.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">({prof.totalAvaliacoes})</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{prof.aulasRealizadas}</TableCell>
                  <TableCell className="text-center">{prof.totalAlunos}</TableCell>
                  <TableCell className="text-right">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(prof.receitaGerada)}
                  </TableCell>
                  <TableCell className="text-right">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(prof.comissao)}
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
