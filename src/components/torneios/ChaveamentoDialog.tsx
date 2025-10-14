import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChaveamentoVisual } from "./ChaveamentoVisual";
import { Loader2 } from "lucide-react";

interface ChaveamentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  torneioId: string;
}

export function ChaveamentoDialog({ open, onOpenChange, torneioId }: ChaveamentoDialogProps) {
  const queryClient = useQueryClient();
  const [gerando, setGerando] = useState(false);

  // Buscar torneio
  const { data: torneio } = useQuery({
    queryKey: ["torneio", torneioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("torneios")
        .select("*")
        .eq("id", torneioId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!torneioId,
  });

  // Buscar inscrições
  const { data: inscricoes } = useQuery({
    queryKey: ["inscricoes", torneioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("torneios_inscricoes")
        .select(`
          *,
          usuario:usuario_id(id, nome_completo),
          parceiro:parceiro_id(id, nome_completo)
        `)
        .eq("torneio_id", torneioId)
        .eq("status_pagamento", "pago");
      
      if (error) throw error;
      return data;
    },
    enabled: !!torneioId,
  });

  // Buscar jogos existentes
  const { data: jogos, isLoading: loadingJogos } = useQuery({
    queryKey: ["jogos", torneioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("torneios_jogos")
        .select("*")
        .eq("torneio_id", torneioId)
        .order("numero_jogo", { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!torneioId,
  });

  // Gerar chaveamento
  const gerarChaveamento = useMutation({
    mutationFn: async () => {
      if (!inscricoes || inscricoes.length < 2) {
        throw new Error("É necessário pelo menos 2 inscrições pagas para gerar o chaveamento");
      }

      const tipo = torneio?.tipo_chaveamento;
      const duplas = inscricoes.map(insc => ({
        jogador1_id: insc.usuario_id,
        jogador2_id: insc.parceiro_id,
      }));

      // Determinar número de jogos da primeira fase
      const numDuplas = duplas.length;
      const proximaPotencia = Math.pow(2, Math.ceil(Math.log2(numDuplas)));
      const numJogos = proximaPotencia / 2;

      const jogosParaInserir = [];
      
      if (tipo === "eliminacao_simples") {
        // Embaralhar duplas para sorteio
        const duplasEmbaralhadas = [...duplas].sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < numJogos; i++) {
          const dupla1 = duplasEmbaralhadas[i * 2];
          const dupla2 = duplasEmbaralhadas[i * 2 + 1];
          
          jogosParaInserir.push({
            torneio_id: torneioId,
            numero_jogo: i + 1,
            fase: "oitavas",
            dupla1_jogador1_id: dupla1?.jogador1_id || null,
            dupla1_jogador2_id: dupla1?.jogador2_id || null,
            dupla2_jogador1_id: dupla2?.jogador1_id || null,
            dupla2_jogador2_id: dupla2?.jogador2_id || null,
          });
        }
      }

      const { error } = await supabase
        .from("torneios_jogos")
        .insert(jogosParaInserir);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Chaveamento gerado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["jogos", torneioId] });
      setGerando(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao gerar chaveamento");
      setGerando(false);
    },
  });

  const handleGerarChaveamento = () => {
    setGerando(true);
    gerarChaveamento.mutate();
  };

  const temJogos = jogos && jogos.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chaveamento - {torneio?.nome}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!temJogos && (
            <div className="text-center py-8 space-y-4">
              <p className="text-muted-foreground">
                Nenhum chaveamento gerado ainda.
              </p>
              <p className="text-sm text-muted-foreground">
                Inscrições pagas: {inscricoes?.length || 0}
              </p>
              <Button 
                onClick={handleGerarChaveamento}
                disabled={gerando || !inscricoes || inscricoes.length < 2}
              >
                {gerando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Gerar Chaveamento
              </Button>
            </div>
          )}

          {loadingJogos && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {temJogos && (
            <ChaveamentoVisual 
              jogos={jogos} 
              torneioId={torneioId}
              tipoChaveamento={torneio?.tipo_chaveamento || "eliminacao_simples"}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
