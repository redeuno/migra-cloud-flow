import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { toast } from "sonner";

interface AvaliarAulaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inscricaoId: string;
  aulaTitulo: string;
  professorNome: string;
  avaliacaoAtual?: number | null;
  comentarioAtual?: string | null;
}

export function AvaliarAulaDialog({
  open,
  onOpenChange,
  inscricaoId,
  aulaTitulo,
  professorNome,
  avaliacaoAtual,
  comentarioAtual,
}: AvaliarAulaDialogProps) {
  const queryClient = useQueryClient();
  const [nota, setNota] = useState<number>(avaliacaoAtual || 0);
  const [hoverNota, setHoverNota] = useState<number>(0);
  const [comentario, setComentario] = useState<string>(comentarioAtual || "");

  const avaliarMutation = useMutation({
    mutationFn: async () => {
      if (nota === 0) {
        throw new Error("Por favor, selecione uma nota de 1 a 5 estrelas");
      }

      const { error } = await supabase
        .from("aulas_alunos")
        .update({
          avaliacao: nota,
          comentario_avaliacao: comentario.trim() || null,
        })
        .eq("id", inscricaoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["minhas-aulas"] });
      toast.success("Avaliação enviada com sucesso!");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error("Erro ao enviar avaliação", {
        description: error.message,
      });
    },
  });

  const handleSubmit = () => {
    avaliarMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Avaliar Aula</DialogTitle>
          <DialogDescription>
            Como foi sua experiência com esta aula?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Informações da Aula */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-1">
            <p className="font-semibold">{aulaTitulo}</p>
            <p className="text-sm text-muted-foreground">Professor: {professorNome}</p>
          </div>

          {/* Seleção de Estrelas */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Nota da Aula *</label>
            <div className="flex gap-2 justify-center py-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNota(star)}
                  onMouseEnter={() => setHoverNota(star)}
                  onMouseLeave={() => setHoverNota(0)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`h-10 w-10 ${
                      star <= (hoverNota || nota)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
            {nota > 0 && (
              <p className="text-center text-sm text-muted-foreground">
                {nota === 1 && "Muito Ruim"}
                {nota === 2 && "Ruim"}
                {nota === 3 && "Regular"}
                {nota === 4 && "Bom"}
                {nota === 5 && "Excelente"}
              </p>
            )}
          </div>

          {/* Comentário Opcional */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Comentário <span className="text-muted-foreground">(opcional)</span>
            </label>
            <Textarea
              placeholder="Compartilhe sua experiência com esta aula..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {comentario.length}/500 caracteres
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={avaliarMutation.isPending || nota === 0}
          >
            {avaliarMutation.isPending ? "Enviando..." : "Enviar Avaliação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
