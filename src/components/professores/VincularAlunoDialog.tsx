import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface VincularAlunoDialogProps {
  professorId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VincularAlunoDialog({
  professorId,
  open,
  onOpenChange,
}: VincularAlunoDialogProps) {
  const { arenaId } = useAuth();
  const queryClient = useQueryClient();
  const [selectedAluno, setSelectedAluno] = useState<string>("");
  const [observacoes, setObservacoes] = useState("");

  // Buscar alunos disponíveis (que não estão vinculados ao professor)
  const { data: alunosDisponiveis, isLoading } = useQuery({
    queryKey: ["alunos-disponiveis", professorId, arenaId],
    queryFn: async () => {
      if (!professorId) return [];

      // Buscar todos os alunos
      const { data: todosAlunos, error: alunosError } = await supabase
        .from("usuarios")
        .select("id, nome_completo, email")
        .eq("arena_id", arenaId)
        .eq("tipo_usuario", "aluno")
        .eq("status", "ativo")
        .order("nome_completo");

      if (alunosError) throw alunosError;

      // Buscar alunos já vinculados
      const { data: vinculados, error: vinculosError } = await supabase
        .from("professor_alunos")
        .select("aluno_id")
        .eq("professor_id", professorId)
        .eq("ativo", true);

      if (vinculosError) throw vinculosError;

      const vinculadosIds = new Set(vinculados?.map((v) => v.aluno_id) || []);

      // Filtrar apenas alunos não vinculados
      return todosAlunos?.filter((aluno) => !vinculadosIds.has(aluno.id)) || [];
    },
    enabled: !!professorId && !!arenaId && open,
  });

  // Mutation para criar vínculo
  const vincularMutation = useMutation({
    mutationFn: async () => {
      if (!professorId || !selectedAluno) {
        throw new Error("Selecione um aluno");
      }

      const { error } = await supabase.from("professor_alunos").insert({
        professor_id: professorId,
        aluno_id: selectedAluno,
        arena_id: arenaId,
        observacoes: observacoes || null,
        ativo: true,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professor-alunos"] });
      queryClient.invalidateQueries({ queryKey: ["alunos-disponiveis"] });
      toast.success("Aluno vinculado com sucesso!");
      handleClose();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao vincular aluno");
    },
  });

  const handleClose = () => {
    setSelectedAluno("");
    setObservacoes("");
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    vincularMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Vincular Aluno ao Professor</DialogTitle>
            <DialogDescription>
              Selecione o aluno que deseja vincular a este professor
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="aluno">Aluno *</Label>
              <Select
                value={selectedAluno}
                onValueChange={setSelectedAluno}
                required
              >
                <SelectTrigger id="aluno">
                  <SelectValue placeholder="Selecione um aluno" />
                </SelectTrigger>
                <SelectContent>
                  {isLoading ? (
                    <SelectItem value="loading" disabled>
                      Carregando...
                    </SelectItem>
                  ) : !alunosDisponiveis || alunosDisponiveis.length === 0 ? (
                    <SelectItem value="empty" disabled>
                      Nenhum aluno disponível
                    </SelectItem>
                  ) : (
                    alunosDisponiveis.map((aluno) => (
                      <SelectItem key={aluno.id} value={aluno.id}>
                        {aluno.nome_completo} ({aluno.email})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                placeholder="Observações sobre este vínculo..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!selectedAluno || vincularMutation.isPending}
            >
              {vincularMutation.isPending ? "Vinculando..." : "Vincular"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
