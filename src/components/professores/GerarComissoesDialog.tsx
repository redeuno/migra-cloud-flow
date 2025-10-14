import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { startOfMonth, format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2 } from "lucide-react";

interface GerarComissoesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GerarComissoesDialog({ open, onOpenChange }: GerarComissoesDialogProps) {
  const { arenaId } = useAuth();
  const queryClient = useQueryClient();
  const [mesReferencia, setMesReferencia] = useState(
    format(startOfMonth(new Date()), "yyyy-MM-dd")
  );

  // Buscar professores
  const { data: professores } = useQuery({
    queryKey: ["professores-comissoes", arenaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professores")
        .select("id, usuario_id, percentual_comissao_padrao, usuarios(nome_completo)")
        .eq("arena_id", arenaId)
        .eq("status", "ativo");
      if (error) throw error;
      return data;
    },
    enabled: open && !!arenaId,
  });

  const gerarComissoesMutation = useMutation({
    mutationFn: async () => {
      if (!professores) return;

      const referencia = startOfMonth(new Date(mesReferencia));
      const inicioMes = format(referencia, "yyyy-MM-dd");
      const fimMes = format(startOfMonth(subMonths(referencia, -1)), "yyyy-MM-dd");

      const comissoes = [];

      for (const professor of professores) {
        // Buscar aulas do professor no mês
        const { data: aulas, error: aulasError } = await supabase
          .from("aulas")
          .select("id, valor_por_aluno, presencas")
          .eq("professor_id", professor.id)
          .eq("arena_id", arenaId)
          .gte("data_aula", inicioMes)
          .lt("data_aula", fimMes)
          .eq("realizada", true);

        if (aulasError) throw aulasError;

        if (!aulas || aulas.length === 0) continue;

        // Calcular valor total das aulas
        const valorTotal = aulas.reduce((sum, aula) => {
          const presencas = (aula.presencas as any[]) || [];
          const valorAula = presencas.length * Number(aula.valor_por_aluno);
          return sum + valorAula;
        }, 0);

        const percentual = Number(professor.percentual_comissao_padrao || 30);
        const valorComissao = (valorTotal * percentual) / 100;

        comissoes.push({
          professor_id: professor.id,
          arena_id: arenaId,
          referencia: inicioMes,
          valor_aulas: valorTotal,
          percentual_comissao: percentual,
          valor_comissao: valorComissao,
          status: "pendente",
        });
      }

      if (comissoes.length === 0) {
        throw new Error("Nenhuma aula encontrada para gerar comissões");
      }

      const { error } = await supabase
        .from("comissoes_professores")
        .insert(comissoes);

      if (error) throw error;

      return comissoes.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["comissoes"] });
      toast.success(`${count} comissão(ões) gerada(s) com sucesso!`);
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao gerar comissões");
    },
  });

  // Opções de mês (últimos 6 meses)
  const mesesOpcoes = Array.from({ length: 6 }, (_, i) => {
    const data = startOfMonth(subMonths(new Date(), i));
    return {
      value: format(data, "yyyy-MM-dd"),
      label: format(data, "MMMM 'de' yyyy", { locale: ptBR }),
    };
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerar Comissões</DialogTitle>
          <DialogDescription>
            Selecione o mês de referência para calcular as comissões dos professores
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Mês de Referência</Label>
            <Select value={mesReferencia} onValueChange={setMesReferencia}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {mesesOpcoes.map((mes) => (
                  <SelectItem key={mes.value} value={mes.value}>
                    {mes.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {professores && professores.length > 0 && (
            <div className="rounded-md border p-3 text-sm">
              <p className="font-medium mb-1">Professores ativos: {professores.length}</p>
              <p className="text-muted-foreground text-xs">
                Serão calculadas comissões para todos os professores com aulas realizadas no período
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => gerarComissoesMutation.mutate()}
              disabled={gerarComissoesMutation.isPending}
            >
              {gerarComissoesMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Gerar Comissões
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
