import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Star, MessageSquare, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function AvaliacoesProfessoresTable() {
  const [professorFiltro, setProfessorFiltro] = useState<string>("todos");

  // Buscar professores
  const { data: professores } = useQuery({
    queryKey: ["professores-lista"],
    queryFn: async () => {
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("arena_id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id || "")
        .single();

      if (!userRoles?.arena_id) return [];

      const { data, error } = await supabase
        .from("professores")
        .select("id, avaliacao_media, total_avaliacoes, usuarios(nome_completo)")
        .eq("arena_id", userRoles.arena_id)
        .eq("status", "ativo");

      if (error) throw error;
      return data;
    },
  });

  // Buscar avaliações detalhadas
  const { data: avaliacoes, isLoading } = useQuery({
    queryKey: ["avaliacoes-professores", professorFiltro],
    queryFn: async () => {
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("arena_id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id || "")
        .single();

      if (!userRoles?.arena_id) return [];

      // Buscar aulas com avaliações
      let query = supabase
        .from("aulas")
        .select(`
          id,
          titulo,
          data_aula,
          professores!aulas_professor_id_fkey(
            id,
            usuarios(nome_completo)
          ),
          aulas_alunos!inner(
            id,
            avaliacao,
            comentario_avaliacao,
            created_at,
            usuarios(nome_completo, email)
          )
        `)
        .eq("arena_id", userRoles.arena_id)
        .not("aulas_alunos.avaliacao", "is", null)
        .order("data_aula", { ascending: false });

      if (professorFiltro !== "todos") {
        query = query.eq("professor_id", professorFiltro);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Achatar dados para lista de avaliações
      const avaliacoesFlat = data?.flatMap((aula: any) =>
        aula.aulas_alunos.map((inscricao: any) => ({
          aulaId: aula.id,
          aulaTitulo: aula.titulo,
          aulaData: aula.data_aula,
          professorNome: aula.professores?.usuarios?.nome_completo || "N/A",
          professorId: aula.professores?.id,
          avaliacao: inscricao.avaliacao,
          comentario: inscricao.comentario_avaliacao,
          alunoNome: inscricao.usuarios?.nome_completo || "N/A",
          alunoEmail: inscricao.usuarios?.email || "",
          dataAvaliacao: inscricao.created_at,
        }))
      );

      return avaliacoesFlat || [];
    },
  });

  // Calcular estatísticas
  const stats = avaliacoes?.reduce(
    (acc, av) => {
      acc.total++;
      acc.soma += av.avaliacao;
      if (av.avaliacao >= 4) acc.positivas++;
      if (av.avaliacao <= 2) acc.negativas++;
      if (av.comentario) acc.comComentario++;
      return acc;
    },
    { total: 0, soma: 0, positivas: 0, negativas: 0, comComentario: 0 }
  );

  const mediaGeral = stats ? (stats.soma / stats.total).toFixed(1) : "0.0";

  const renderStars = (nota: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i <= nota ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
            }`}
          />
        ))}
      </div>
    );
  };

  const getBadgeColor = (nota: number) => {
    if (nota >= 4) return "bg-green-500/20 text-green-700 border-green-500/30";
    if (nota === 3) return "bg-yellow-500/20 text-yellow-700 border-yellow-500/30";
    return "bg-red-500/20 text-red-700 border-red-500/30";
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas Gerais */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média Geral</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mediaGeral}</div>
            <p className="text-xs text-muted-foreground">{stats?.total || 0} avaliações</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positivas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.positivas || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.total ? ((stats.positivas / stats.total) * 100).toFixed(0) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Negativas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.negativas || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.total ? ((stats.negativas / stats.total) * 100).toFixed(0) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Com Comentário</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.comComentario || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.total ? ((stats.comComentario / stats.total) * 100).toFixed(0) : 0}% do total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtrar Avaliações</CardTitle>
          <CardDescription>Selecione um professor para ver suas avaliações</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={professorFiltro} onValueChange={setProfessorFiltro}>
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="Selecione um professor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Professores</SelectItem>
              {professores?.map((prof: any) => (
                <SelectItem key={prof.id} value={prof.id}>
                  {prof.usuarios?.nome_completo} ({prof.total_avaliacoes || 0} avaliações)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Tabela de Avaliações */}
      <Card>
        <CardHeader>
          <CardTitle>Avaliações Detalhadas</CardTitle>
          <CardDescription>
            {avaliacoes?.length || 0} avaliações encontradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Professor</TableHead>
                <TableHead>Aula</TableHead>
                <TableHead>Aluno</TableHead>
                <TableHead className="text-center">Avaliação</TableHead>
                <TableHead>Comentário</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {avaliacoes && avaliacoes.length > 0 ? (
                avaliacoes.map((av, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <div className="font-medium">{av.professorNome}</div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{av.aulaTitulo}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(av.aulaData), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{av.alunoNome}</div>
                        <div className="text-xs text-muted-foreground">{av.alunoEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-center gap-2">
                        {renderStars(av.avaliacao)}
                        <Badge variant="outline" className={getBadgeColor(av.avaliacao)}>
                          {av.avaliacao}/5
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {av.comentario ? (
                        <div className="text-sm italic text-muted-foreground">
                          "{av.comentario}"
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sem comentário</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(av.dataAvaliacao), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhuma avaliação encontrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
