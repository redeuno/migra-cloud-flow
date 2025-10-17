import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, CheckCircle, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RegistrarPresencaDialog } from "@/components/aulas/RegistrarPresencaDialog";

export function CheckinsProfessor() {
  const [selectedAula, setSelectedAula] = useState<string | null>(null);
  const [presencaDialogOpen, setPresencaDialogOpen] = useState(false);

  const { data: professor } = useQuery({
    queryKey: ["professor-atual"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: usuario } = await supabase
        .from("usuarios")
        .select("id")
        .eq("auth_id", user.id)
        .single();

      if (!usuario) throw new Error("Usuário não encontrado");

      const { data, error } = await supabase
        .from("professores")
        .select("id, arena_id")
        .eq("usuario_id", usuario.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: arenaConfig } = useQuery({
    queryKey: ["arena-config", professor?.arena_id],
    queryFn: async () => {
      if (!professor?.arena_id) return null;

      const { data, error } = await supabase
        .from("arenas")
        .select("janela_checkin_minutos_antes, janela_checkin_minutos_depois")
        .eq("id", professor.arena_id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!professor?.arena_id,
  });

  const { data: aulas, isLoading } = useQuery({
    queryKey: ["minhas-aulas-checkin", professor?.id],
    queryFn: async () => {
      if (!professor?.id) return [];

      const hoje = new Date();
      const trintaDiasDepois = new Date();
      trintaDiasDepois.setDate(hoje.getDate() + 30);

      const { data, error } = await supabase
        .from("aulas")
        .select(`
          id,
          titulo,
          data_aula,
          hora_inicio,
          hora_fim,
          tipo_aula,
          status,
          realizada,
          presencas,
          max_alunos,
          quadras (
            nome,
            numero
          ),
          aulas_alunos (
            id,
            usuario_id,
            presenca
          )
        `)
        .eq("professor_id", professor.id)
        .gte("data_aula", new Date().toISOString().split("T")[0])
        .lte("data_aula", trintaDiasDepois.toISOString().split("T")[0])
        .order("data_aula", { ascending: true })
        .order("hora_inicio", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!professor?.id,
  });

  const handleIniciarAula = (aulaId: string) => {
    setSelectedAula(aulaId);
    setPresencaDialogOpen(true);
  };

  const podeCheckin = (aula: any) => {
    if (aula.realizada) return false;

    const agora = new Date();
    agora.setHours(0, 0, 0, 0);
    
    const dataAula = new Date(aula.data_aula);
    dataAula.setHours(0, 0, 0, 0);
    
    // Permitir iniciar apenas no dia da aula
    return agora.getTime() === dataAula.getTime();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const aulasRealizadas = aulas?.filter((a) => a.realizada) || [];
  const aulasPendentes = aulas?.filter((a) => !a.realizada) || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Check-ins das Minhas Aulas</h2>
        <p className="text-muted-foreground">
          Gerencie os check-ins das suas aulas
        </p>
      </div>

      {aulasPendentes.length === 0 && aulasRealizadas.length === 0 && (
        <Alert>
          <BookOpen className="h-4 w-4" />
          <AlertDescription>
            Você não tem aulas agendadas nos próximos 30 dias.
          </AlertDescription>
        </Alert>
      )}

      {aulasPendentes.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Aulas Pendentes</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {aulasPendentes.map((aula) => {
              const alunosInscritos = (aula.aulas_alunos as any[]) || [];
              const totalAlunos = alunosInscritos.length;

              return (
                <Card key={aula.id}>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>{aula.titulo}</span>
                      <Badge variant={podeCheckin(aula) ? "default" : "secondary"}>
                        {podeCheckin(aula) ? "Disponível" : "Fora do horário"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {format(new Date(aula.data_aula), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {aula.hora_inicio.substring(0, 5)} - {aula.hora_fim.substring(0, 5)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {totalAlunos}/{aula.max_alunos} alunos
                        </span>
                      </div>
                      {aula.quadras && (
                        <div className="text-xs text-muted-foreground">
                          Quadra {aula.quadras.numero} - {aula.quadras.nome}
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() => handleIniciarAula(aula.id)}
                      disabled={!podeCheckin(aula)}
                      className="w-full"
                      variant={podeCheckin(aula) ? "default" : "secondary"}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Iniciar Aula
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {aulasRealizadas.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Aulas Realizadas</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {aulasRealizadas.map((aula) => {
              const alunosInscritos = (aula.aulas_alunos as any[]) || [];
              const presentes = alunosInscritos.filter((a: any) => a.presenca);
              const totalAlunos = alunosInscritos.length;

              return (
                <Card
                  key={aula.id}
                  className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20"
                >
                  <CardHeader>
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>{aula.titulo}</span>
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Confirmado
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {format(new Date(aula.data_aula), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {aula.hora_inicio.substring(0, 5)} - {aula.hora_fim.substring(0, 5)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {totalAlunos}/{aula.max_alunos} alunos
                      </span>
                    </div>
                    <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                      {totalAlunos > 0 ? (
                        <div>
                          <strong>Presenças:</strong> {presentes.length}/{totalAlunos}
                        </div>
                      ) : (
                        <div>Nenhum aluno inscrito</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {selectedAula && (
        <RegistrarPresencaDialog
          open={presencaDialogOpen}
          onOpenChange={setPresencaDialogOpen}
          aulaId={selectedAula}
        />
      )}
    </div>
  );
}
