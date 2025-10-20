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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { UserX, Phone, Mail, CheckCircle2, XCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface GerenciarInscricoesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aulaId: string;
  aulaTitulo: string;
}

export function GerenciarInscricoesDialog({
  open,
  onOpenChange,
  aulaId,
  aulaTitulo,
}: GerenciarInscricoesDialogProps) {
  const queryClient = useQueryClient();
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [inscricaoToRemove, setInscricaoToRemove] = useState<string>();

  const { data: inscricoes, isLoading } = useQuery({
    queryKey: ["aula-inscricoes", aulaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aulas_alunos")
        .select(`
          *,
          usuarios(
            id,
            nome_completo,
            email,
            telefone
          )
        `)
        .eq("aula_id", aulaId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: open && !!aulaId,
  });

  const removeMutation = useMutation({
    mutationFn: async (inscricaoId: string) => {
      const { error } = await supabase
        .from("aulas_alunos")
        .delete()
        .eq("id", inscricaoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aula-inscricoes"] });
      queryClient.invalidateQueries({ queryKey: ["minhas-aulas-professor"] });
      toast.success("Inscrição removida com sucesso");
      setRemoveDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error("Erro ao remover inscrição", {
        description: error.message,
      });
    },
  });

  const handleRemove = (inscricaoId: string) => {
    setInscricaoToRemove(inscricaoId);
    setRemoveDialogOpen(true);
  };

  const confirmRemove = () => {
    if (inscricaoToRemove) {
      removeMutation.mutate(inscricaoToRemove);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Alunos Inscritos</DialogTitle>
            <DialogDescription>
              {aulaTitulo} - {inscricoes?.length || 0} aluno(s) inscrito(s)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : !inscricoes || inscricoes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum aluno inscrito nesta aula</p>
              </div>
            ) : (
              <div className="space-y-3">
                {inscricoes.map((inscricao) => (
                  <div
                    key={inscricao.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-semibold">
                          {inscricao.usuarios?.nome_completo}
                        </h4>
                        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                          {inscricao.usuarios?.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3" />
                              {inscricao.usuarios.email}
                            </div>
                          )}
                          {inscricao.usuarios?.telefone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3" />
                              {inscricao.usuarios.telefone}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(inscricao.id)}
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant={
                          inscricao.status_pagamento === "pago"
                            ? "default"
                            : inscricao.status_pagamento === "pendente"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {inscricao.status_pagamento}
                      </Badge>

                      {inscricao.presenca !== null && (
                        <Badge
                          variant="outline"
                          className={
                            inscricao.presenca
                              ? "bg-green-500/20 text-green-700"
                              : "bg-red-500/20 text-red-700"
                          }
                        >
                          {inscricao.presenca ? (
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {inscricao.presenca ? "Presente" : "Ausente"}
                        </Badge>
                      )}

                      {inscricao.valor_pago && (
                        <Badge variant="outline">
                          R$ {Number(inscricao.valor_pago).toFixed(2)}
                        </Badge>
                      )}
                    </div>

                    {inscricao.avaliacao && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Avaliação: </span>
                        <span className="font-medium">
                          {inscricao.avaliacao} ⭐
                        </span>
                        {inscricao.comentario_avaliacao && (
                          <p className="text-muted-foreground mt-1 italic">
                            "{inscricao.comentario_avaliacao}"
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Inscrição</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este aluno da aula? Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemove}>
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
