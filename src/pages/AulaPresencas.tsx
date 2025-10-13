import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, Clock, Users, MapPin } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AulaPresencaDialog } from "@/components/aulas/AulaPresencaDialog";
import { useState } from "react";

export default function AulaPresencas() {
  const { aulaId } = useParams<{ aulaId: string }>();
  const navigate = useNavigate();
  const [presencaDialogOpen, setPresencaDialogOpen] = useState(true);

  const { data: aula, isLoading } = useQuery({
    queryKey: ["aula-detalhes", aulaId],
    queryFn: async () => {
      if (!aulaId) return null;

      const { data, error } = await supabase
        .from("aulas")
        .select(`
          *,
          professores!aulas_professor_id_fkey(
            usuarios(nome_completo, email, whatsapp)
          ),
          quadras(nome, numero),
          aulas_alunos(
            *,
            usuarios!aulas_alunos_usuario_id_fkey(nome_completo, email, whatsapp)
          )
        `)
        .eq("id", aulaId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!aulaId,
  });

  const handleClose = () => {
    setPresencaDialogOpen(false);
    navigate("/aulas");
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!aula) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Aula não encontrada</p>
        <Button className="mt-4" onClick={() => navigate("/aulas")}>
          Voltar para Aulas
        </Button>
      </div>
    );
  }

  const inscritos = aula.aulas_alunos?.length || 0;
  const presentes = aula.aulas_alunos?.filter((a: any) => a.presenca).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/aulas")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gerenciar Presenças</h1>
          <p className="text-muted-foreground">{aula.titulo}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data da Aula</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {format(new Date(aula.data_aula), "dd/MM", { locale: ptBR })}
            </div>
            <p className="text-xs text-muted-foreground">
              {format(new Date(aula.data_aula), "EEEE", { locale: ptBR })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horário</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {aula.hora_inicio.substring(0, 5)}
            </div>
            <p className="text-xs text-muted-foreground">
              até {aula.hora_fim.substring(0, 5)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alunos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inscritos}/{aula.max_alunos}
            </div>
            <p className="text-xs text-muted-foreground">
              {presentes} presente{presentes !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Local</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {aula.quadras?.numero || "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {aula.quadras?.nome || "Quadra"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Aula</CardTitle>
          <CardDescription>Detalhes completos sobre a aula</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Professor</label>
              <p className="text-sm">{aula.professores?.usuarios?.nome_completo}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Tipo</label>
              <div className="pt-1">
                <Badge variant="outline">{aula.tipo_aula}</Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nível</label>
              <p className="text-sm">{aula.nivel || "—"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div className="pt-1">
                <Badge>{aula.status || "agendada"}</Badge>
              </div>
            </div>
          </div>

          {aula.descricao && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Descrição</label>
              <p className="text-sm mt-1">{aula.descricao}</p>
            </div>
          )}

          {aula.objetivos && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Objetivos</label>
              <p className="text-sm mt-1">{aula.objetivos}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Presença */}
      <AulaPresencaDialog
        open={presencaDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleClose();
          setPresencaDialogOpen(open);
        }}
        aulaId={aulaId || ""}
      />
    </div>
  );
}
