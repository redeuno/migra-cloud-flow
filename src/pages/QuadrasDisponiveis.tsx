import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { SquareActivity, MapPin, Calendar, Clock } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { AgendamentoDialog } from "@/components/agendamentos/AgendamentoDialog";

export default function QuadrasDisponiveis() {
  const { arenaId } = useAuth();
  const [selectedQuadra, setSelectedQuadra] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Buscar quadras ativas da arena
  const { data: quadras, isLoading } = useQuery({
    queryKey: ["quadras-disponiveis", arenaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quadras")
        .select("*")
        .eq("arena_id", arenaId)
        .eq("status", "ativo")
        .order("numero");

      if (error) throw error;
      return data;
    },
    enabled: !!arenaId,
  });

  const handleAgendar = (quadra: any) => {
    setSelectedQuadra(quadra);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedQuadra(null);
  };

  return (
    <Layout>
      <PerfilAccessGuard allowedRoles={["aluno"]}>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Quadras Disponíveis
            </h1>
            <p className="text-muted-foreground">
              Visualize e agende quadras para day-use
            </p>
          </div>

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : !quadras || quadras.length === 0 ? (
            <EmptyState
              icon={SquareActivity}
              title="Nenhuma quadra disponível"
              description="Não há quadras disponíveis no momento. Tente novamente mais tarde."
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {quadras.map((quadra) => (
                <Card key={quadra.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">
                        Quadra {quadra.numero}
                      </CardTitle>
                      <Badge variant="default">{quadra.tipo_esporte}</Badge>
                    </div>
                    <CardDescription>{quadra.nome}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>
                          Piso: {quadra.tipo_piso || "Não especificado"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <SquareActivity className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {quadra.cobertura ? "Coberta" : "Descoberta"} •{" "}
                          {quadra.iluminacao ? "Com iluminação" : "Sem iluminação"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Valores:</div>
                      <div className="text-sm">
                        <div className="text-muted-foreground">
                          Valor por hora
                        </div>
                        <div className="text-lg font-semibold">
                          R$ {quadra.valor_hora_pico?.toFixed(2) || "0.00"}
                        </div>
                      </div>
                    </div>

                    {quadra.equipamentos_inclusos &&
                      Array.isArray(quadra.equipamentos_inclusos) &&
                      quadra.equipamentos_inclusos.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Incluso:</div>
                          <div className="flex flex-wrap gap-1">
                            {quadra.equipamentos_inclusos.map(
                              (eq: string, idx: number) => (
                                <Badge key={idx} variant="outline">
                                  {eq}
                                </Badge>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      onClick={() => handleAgendar(quadra)}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      Agendar Quadra
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Dialog de Agendamento */}
        <AgendamentoDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      </PerfilAccessGuard>
    </Layout>
  );
}
