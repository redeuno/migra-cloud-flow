import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, UserCheck } from "lucide-react";
import { Label } from "@/components/ui/label";

interface RegistrarPresencaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aulaId: string;
}

export function RegistrarPresencaDialog({
  open,
  onOpenChange,
  aulaId,
}: RegistrarPresencaDialogProps) {
  const queryClient = useQueryClient();
  const [presencas, setPresencas] = useState<Record<string, boolean>>({});

  const { data: aula, isLoading } = useQuery({
    queryKey: ["aula-presenca", aulaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aulas")
        .select(`
          *,
          aulas_alunos (
            id,
            usuario_id,
            presenca,
            usuarios (
              nome_completo
            )
          )
        `)
        .eq("id", aulaId)
        .single();

      if (error) throw error;

      // Inicializar presencas com valores atuais
      const presencasIniciais: Record<string, boolean> = {};
      data.aulas_alunos?.forEach((inscricao: any) => {
        presencasIniciais[inscricao.id] = inscricao.presenca || false;
      });
      setPresencas(presencasIniciais);

      return data;
    },
    enabled: open && !!aulaId,
  });

  const marcarRealizadaMutation = useMutation({
    mutationFn: async () => {
      // Atualizar presenças
      const updates = Object.entries(presencas).map(([inscricaoId, presente]) =>
        supabase
          .from("aulas_alunos")
          .update({ presenca: presente })
          .eq("id", inscricaoId)
      );

      await Promise.all(updates);

      // Marcar aula como realizada
      const { error } = await supabase
        .from("aulas")
        .update({
          realizada: true,
          data_realizacao: new Date().toISOString(),
        })
        .eq("id", aulaId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Presenças registradas e aula marcada como realizada!");
      queryClient.invalidateQueries({ queryKey: ["minhas-aulas-checkin"] });
      queryClient.invalidateQueries({ queryKey: ["aula-presenca", aulaId] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error("Erro ao registrar presenças: " + error.message);
    },
  });

  const togglePresenca = (inscricaoId: string) => {
    setPresencas((prev) => ({
      ...prev,
      [inscricaoId]: !prev[inscricaoId],
    }));
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const alunos = aula?.aulas_alunos || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Registrar Presenças - {aula?.titulo}
          </DialogTitle>
          <DialogDescription>
            Marque os alunos presentes nesta aula
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {alunos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum aluno inscrito nesta aula
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {alunos.map((inscricao: any) => (
                <div
                  key={inscricao.id}
                  className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    id={inscricao.id}
                    checked={presencas[inscricao.id] || false}
                    onCheckedChange={() => togglePresenca(inscricao.id)}
                  />
                  <Label
                    htmlFor={inscricao.id}
                    className="flex-1 cursor-pointer font-medium"
                  >
                    {inscricao.usuarios?.nome_completo || "Aluno sem nome"}
                  </Label>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => marcarRealizadaMutation.mutate()}
              disabled={marcarRealizadaMutation.isPending || alunos.length === 0}
              className="flex-1"
            >
              {marcarRealizadaMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Confirmar e Finalizar Aula
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
