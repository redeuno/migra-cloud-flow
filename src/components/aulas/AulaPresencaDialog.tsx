import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AulaPresencaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aulaId: string;
}

export function AulaPresencaDialog({ open, onOpenChange, aulaId }: AulaPresencaDialogProps) {
  const queryClient = useQueryClient();
  const [presencas, setPresencas] = useState<Record<string, boolean>>({});

  const { data: aula, isLoading } = useQuery({
    queryKey: ["aula-presenca", aulaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aulas")
        .select(`
          *,
          professores!aulas_professor_id_fkey(usuarios(nome_completo)),
          aulas_alunos(
            id,
            presenca,
            usuarios!aulas_alunos_usuario_id_fkey(nome_completo, email)
          )
        `)
        .eq("id", aulaId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: open && !!aulaId,
  });

  // Inicializar presencas quando carregar a aula
  useEffect(() => {
    if (aula?.aulas_alunos) {
      const initialPresencas: Record<string, boolean> = {};
      aula.aulas_alunos.forEach((inscricao: any) => {
        initialPresencas[inscricao.id] = inscricao.presenca || false;
      });
      setPresencas(initialPresencas);
    }
  }, [aula]);

  const updatePresencaMutation = useMutation({
    mutationFn: async () => {
      // Atualizar cada inscrição com sua presença
      const updates = Object.entries(presencas).map(([inscricaoId, presente]) =>
        supabase
          .from("aulas_alunos")
          .update({ presenca: presente })
          .eq("id", inscricaoId)
      );

      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aula-presenca"] });
      queryClient.invalidateQueries({ queryKey: ["aulas"] });
      toast({ title: "Presenças atualizadas com sucesso!" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Erro ao atualizar presenças", variant: "destructive" });
    },
  });

  const finalizarAulaMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("aulas")
        .update({
          status: "realizada",
          realizada: true,
          data_realizacao: new Date().toISOString(),
        })
        .eq("id", aulaId);

      if (error) throw error;
    },
    onSuccess: () => {
      updatePresencaMutation.mutate();
    },
  });

  const handleTogglePresenca = (inscricaoId: string) => {
    setPresencas((prev) => ({
      ...prev,
      [inscricaoId]: !prev[inscricaoId],
    }));
  };

  const handleSalvar = () => {
    updatePresencaMutation.mutate();
  };

  const handleFinalizar = () => {
    finalizarAulaMutation.mutate();
  };

  const totalPresentes = Object.values(presencas).filter(Boolean).length;
  const totalInscritos = aula?.aulas_alunos?.length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gerenciar Presença</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Informações da Aula */}
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <h3 className="font-semibold">{aula?.titulo}</h3>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span>
                  📅 {format(new Date(aula?.data_aula || ""), "dd/MM/yyyy", { locale: ptBR })}
                </span>
                <span>
                  🕐 {aula?.hora_inicio.substring(0, 5)} - {aula?.hora_fim.substring(0, 5)}
                </span>
                <span>
                  👨‍🏫 {aula?.professores?.usuarios?.nome_completo}
                </span>
              </div>
              <div className="flex items-center gap-4 pt-2">
                <Badge variant="outline">
                  <Users className="mr-1 h-3 w-3" />
                  {totalInscritos} inscritos
                </Badge>
                <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/30">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  {totalPresentes} presentes
                </Badge>
                <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-500/30">
                  <XCircle className="mr-1 h-3 w-3" />
                  {totalInscritos - totalPresentes} ausentes
                </Badge>
              </div>
            </div>

            {/* Lista de Alunos */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {aula?.aulas_alunos && aula.aulas_alunos.length > 0 ? (
                aula.aulas_alunos.map((inscricao: any) => (
                  <div
                    key={inscricao.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={presencas[inscricao.id] || false}
                        onCheckedChange={() => handleTogglePresenca(inscricao.id)}
                      />
                      <div>
                        <p className="font-medium">{inscricao.usuarios?.nome_completo}</p>
                        <p className="text-xs text-muted-foreground">{inscricao.usuarios?.email}</p>
                      </div>
                    </div>
                    {presencas[inscricao.id] ? (
                      <Badge className="bg-green-500/20 text-green-700 border-green-500/30">
                        Presente
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-500/30">
                        Ausente
                      </Badge>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum aluno inscrito nesta aula</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleSalvar}>
                Salvar Presenças
              </Button>
              {aula?.status !== "realizada" && (
                <Button type="button" variant="default" onClick={handleFinalizar}>
                  Finalizar Aula
                </Button>
              )}
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
