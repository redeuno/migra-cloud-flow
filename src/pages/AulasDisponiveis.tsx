import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { PerfilAccessGuard } from "@/components/PerfilAccessGuard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GraduationCap, Users, Calendar, Clock, Search } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { notificarInscricaoAula } from "@/lib/utils/notificarInscricaoAula";

export default function AulasDisponiveis() {
  const { arenaId, user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string>("all");

  // Buscar ID do usuário (aluno)
  const { data: usuarioData } = useQuery({
    queryKey: ["usuario-id", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("usuarios")
        .select("id")
        .eq("auth_id", user?.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Buscar aulas disponíveis
  const { data: aulas, isLoading } = useQuery({
    queryKey: ["aulas-disponiveis", arenaId],
    queryFn: async () => {
      const hoje = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("aulas")
        .select(`
          *,
          professores (
            id,
            usuarios (
              nome_completo
            )
          ),
          quadras (
            numero,
            nome
          ),
          aulas_alunos (
            id,
            usuario_id
          )
        `)
        .eq("arena_id", arenaId)
        .gte("data_aula", hoje)
        .order("data_aula")
        .order("hora_inicio");

      if (error) throw error;
      return data;
    },
    enabled: !!arenaId,
  });

  // Mutation para inscrever-se em aula
  const inscreverMutation = useMutation({
    mutationFn: async (aulaId: string) => {
      if (!usuarioData?.id) throw new Error("Usuário não encontrado");
      if (!arenaId) throw new Error("Arena não identificada");

      // Buscar valor da aula
      const { data: aula, error: aulaError } = await supabase
        .from("aulas")
        .select("valor_por_aluno, max_alunos, aulas_alunos(id)")
        .eq("id", aulaId)
        .single();

      if (aulaError) throw aulaError;

      // Validar vagas disponíveis
      const inscritos = aula.aulas_alunos?.length || 0;
      if (inscritos >= aula.max_alunos) {
        throw new Error("Não há mais vagas disponíveis para esta aula");
      }

      // Inserir inscrição
      const { error } = await supabase.from("aulas_alunos").insert({
        aula_id: aulaId,
        usuario_id: usuarioData.id,
        valor_pago: aula.valor_por_aluno,
        status_pagamento: "pendente",
      });

      if (error) throw error;

      // Enviar notificações
      await notificarInscricaoAula({
        aulaId,
        alunoId: usuarioData.id,
        arenaId,
      });

      return aulaId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aulas-disponiveis"] });
      toast.success("Inscrição realizada com sucesso! Você receberá notificações sobre a aula.");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao se inscrever na aula");
    },
  });

  // Filtrar aulas
  const aulasFiltered = aulas?.filter((aula) => {
    const matchSearch =
      aula.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aula.professores?.usuarios?.nome_completo
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchTipo = tipoFilter === "all" || aula.tipo_aula === tipoFilter;

    return matchSearch && matchTipo;
  });

  // Verificar se aluno já está inscrito
  const isInscrito = (aula: any) => {
    return aula.aulas_alunos?.some(
      (inscricao: any) => inscricao.usuario_id === usuarioData?.id
    );
  };

  // Calcular vagas disponíveis
  const vagasDisponiveis = (aula: any) => {
    const inscritos = aula.aulas_alunos?.length || 0;
    return aula.max_alunos - inscritos;
  };

  return (
    <Layout>
      <PerfilAccessGuard allowedRoles={["aluno"]}>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Aulas Disponíveis
            </h1>
            <p className="text-muted-foreground">
              Explore e inscreva-se nas aulas da arena
            </p>
          </div>

          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por título ou professor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={tipoFilter} onValueChange={setTipoFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo de aula" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="dupla">Dupla</SelectItem>
                    <SelectItem value="grupo">Grupo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Aulas */}
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-80 w-full" />
              <Skeleton className="h-80 w-full" />
              <Skeleton className="h-80 w-full" />
            </div>
          ) : !aulasFiltered || aulasFiltered.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="Nenhuma aula disponível"
              description="Não há aulas disponíveis no momento com os filtros selecionados."
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {aulasFiltered.map((aula) => {
                const jaInscrito = isInscrito(aula);
                const vagas = vagasDisponiveis(aula);
                const semVagas = vagas <= 0;

                return (
                  <Card key={aula.id} className="flex flex-col">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-xl">
                          {aula.titulo}
                        </CardTitle>
                        <Badge
                          variant={
                            aula.tipo_aula === "individual"
                              ? "default"
                              : aula.tipo_aula === "grupo"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {aula.tipo_aula}
                        </Badge>
                      </div>
                      <CardDescription>
                        Professor:{" "}
                        {aula.professores?.usuarios?.nome_completo || "N/A"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                      {aula.descricao && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {aula.descricao}
                        </p>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {new Date(aula.data_aula).toLocaleDateString(
                              "pt-BR"
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {aula.hora_inicio} - {aula.hora_fim}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {vagas} vaga{vagas !== 1 ? "s" : ""} disponível
                            {vagas !== 1 ? "is" : ""}
                          </span>
                        </div>
                      </div>

                      {aula.nivel && (
                        <Badge variant="outline">Nível: {aula.nivel}</Badge>
                      )}

                      <div className="pt-2">
                        <div className="text-sm text-muted-foreground">
                          Valor por aluno
                        </div>
                        <div className="text-2xl font-bold">
                          R$ {aula.valor_por_aluno?.toFixed(2) || "0.00"}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full"
                        disabled={jaInscrito || semVagas || inscreverMutation.isPending}
                        onClick={() => inscreverMutation.mutate(aula.id)}
                      >
                        {inscreverMutation.isPending
                          ? "Inscrevendo..."
                          : jaInscrito
                          ? "✓ Já inscrito"
                          : semVagas
                          ? "Sem vagas"
                          : "Inscrever-se"}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </PerfilAccessGuard>
    </Layout>
  );
}
