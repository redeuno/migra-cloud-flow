import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, MessageSquare, TrendingUp, Award } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export function MinhasAvaliacoes() {
  const { data: professorData } = useQuery({
    queryKey: ["professor-avaliacoes-data"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: usuario } = await supabase
        .from("usuarios")
        .select("id")
        .eq("auth_id", user.id)
        .single();

      if (!usuario) throw new Error("Usuário não encontrado");

      const { data: professor } = await supabase
        .from("professores")
        .select("id, avaliacao_media, total_avaliacoes")
        .eq("usuario_id", usuario.id)
        .single();

      if (!professor) throw new Error("Professor não encontrado");

      return professor;
    },
  });

  const { data: avaliacoes, isLoading } = useQuery({
    queryKey: ["minhas-avaliacoes", professorData?.id],
    queryFn: async () => {
      if (!professorData?.id) return [];

      const { data, error } = await supabase
        .from("aulas")
        .select(`
          id,
          titulo,
          data_aula,
          aulas_alunos!inner (
            avaliacao,
            comentario_avaliacao,
            usuarios (
              nome_completo
            )
          )
        `)
        .eq("professor_id", professorData.id)
        .not("aulas_alunos.avaliacao", "is", null)
        .order("data_aula", { ascending: false })
        .limit(20);

      if (error) throw error;

      return data.flatMap((aula: any) =>
        (aula.aulas_alunos || []).map((aa: any) => ({
          aulaId: aula.id,
          aulaTitulo: aula.titulo,
          dataAula: aula.data_aula,
          avaliacao: aa.avaliacao,
          comentario: aa.comentario_avaliacao,
          alunoNome: aa.usuarios?.nome_completo || "Aluno",
        }))
      );
    },
    enabled: !!professorData?.id,
  });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating
            ? "fill-yellow-400 text-yellow-400"
            : "fill-muted text-muted"
        }`}
      />
    ));
  };

  const stats = avaliacoes?.reduce(
    (acc, av) => {
      acc.total++;
      if (av.avaliacao >= 4) acc.positivas++;
      if (av.avaliacao <= 2) acc.negativas++;
      if (av.comentario) acc.comComentarios++;
      acc.somaNotas += av.avaliacao;
      return acc;
    },
    { total: 0, positivas: 0, negativas: 0, comComentarios: 0, somaNotas: 0 }
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média Geral</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">
                {professorData?.avaliacao_media?.toFixed(1) || "0.0"}
              </div>
              <div className="flex">{renderStars(Math.round(professorData?.avaliacao_media || 0))}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {professorData?.total_avaliacoes || 0} avaliações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliações Positivas</CardTitle>
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
            <CardTitle className="text-sm font-medium">Com Comentários</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.comComentarios || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.total ? ((stats.comComentarios / stats.total) * 100).toFixed(0) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Avaliações</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">Últimas 20 aulas</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Avaliações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {!avaliacoes || avaliacoes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Star className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>Você ainda não recebeu avaliações</p>
            </div>
          ) : (
            <div className="space-y-4">
              {avaliacoes.map((av: any, idx: number) => (
                <div
                  key={`${av.aulaId}-${idx}`}
                  className="border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{av.alunoNome}</span>
                        <Badge variant="outline" className="text-xs">
                          {format(new Date(av.dataAula), "dd/MM/yyyy", { locale: ptBR })}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{av.aulaTitulo}</p>
                    </div>
                    <div className="flex gap-0.5">
                      {renderStars(av.avaliacao)}
                    </div>
                  </div>
                  {av.comentario && (
                    <div className="bg-muted/50 rounded-md p-3 mt-2">
                      <p className="text-sm italic">"{av.comentario}"</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
