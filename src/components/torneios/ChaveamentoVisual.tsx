import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Jogo {
  id: string;
  numero_jogo: number;
  fase: string;
  dupla1_jogador1_id?: string;
  dupla1_jogador2_id?: string;
  dupla2_jogador1_id?: string;
  dupla2_jogador2_id?: string;
  placar_dupla1?: number;
  placar_dupla2?: number;
  vencedor?: number;
  quadra_id?: string;
  data_jogo?: string;
  hora_inicio?: string;
}

interface ChaveamentoVisualProps {
  jogos: Jogo[];
  torneioId: string;
  tipoChaveamento: string;
}

export function ChaveamentoVisual({ jogos, torneioId, tipoChaveamento }: ChaveamentoVisualProps) {
  const queryClient = useQueryClient();
  const [jogoSelecionado, setJogoSelecionado] = useState<Jogo | null>(null);
  const [placar1, setPlacar1] = useState("");
  const [placar2, setPlacar2] = useState("");

  // Buscar usuários
  const { data: usuarios } = useQuery({
    queryKey: ["usuarios-torneio"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("usuarios")
        .select("id, nome_completo");
      
      if (error) throw error;
      return data;
    },
  });

  // Buscar quadras
  const { data: quadras } = useQuery({
    queryKey: ["quadras-torneio"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quadras")
        .select("id, numero, nome");
      
      if (error) throw error;
      return data;
    },
  });

  const getNomeUsuario = (id?: string) => {
    if (!id || !usuarios) return "A definir";
    const usuario = usuarios.find(u => u.id === id);
    return usuario?.nome_completo || "A definir";
  };

  const getQuadraInfo = (id?: string) => {
    if (!id || !quadras) return null;
    return quadras.find(q => q.id === id);
  };

  const atualizarPlacar = useMutation({
    mutationFn: async ({ jogoId, placar1, placar2 }: { jogoId: string; placar1: number; placar2: number }) => {
      const vencedor = placar1 > placar2 ? 1 : 2;
      
      const { error } = await supabase
        .from("torneios_jogos")
        .update({
          placar_dupla1: placar1,
          placar_dupla2: placar2,
          vencedor,
        })
        .eq("id", jogoId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Placar atualizado!");
      queryClient.invalidateQueries({ queryKey: ["jogos", torneioId] });
      setJogoSelecionado(null);
      setPlacar1("");
      setPlacar2("");
    },
    onError: () => {
      toast.error("Erro ao atualizar placar");
    },
  });

  const handleSubmitPlacar = () => {
    if (!jogoSelecionado || !placar1 || !placar2) return;
    
    atualizarPlacar.mutate({
      jogoId: jogoSelecionado.id,
      placar1: parseInt(placar1),
      placar2: parseInt(placar2),
    });
  };

  // Agrupar jogos por fase
  const jogosPorFase = jogos.reduce((acc, jogo) => {
    if (!acc[jogo.fase]) acc[jogo.fase] = [];
    acc[jogo.fase].push(jogo);
    return acc;
  }, {} as Record<string, Jogo[]>);

  const fases = ["oitavas", "quartas", "semifinal", "final"];
  const fasesDisponiveis = fases.filter(fase => jogosPorFase[fase]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Chaveamento: {tipoChaveamento === "eliminacao_simples" ? "Eliminatória Simples" : "Eliminatória Dupla"}
        </h3>
        <Badge variant="outline">{jogos.length} jogos</Badge>
      </div>

      <div className="space-y-8">
        {fasesDisponiveis.map(fase => (
          <div key={fase} className="space-y-3">
            <h4 className="font-semibold capitalize">{fase}</h4>
            <div className="grid gap-3 md:grid-cols-2">
              {jogosPorFase[fase].map(jogo => {
                const quadra = getQuadraInfo(jogo.quadra_id);
                
                return (
                  <Card key={jogo.id} className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {getNomeUsuario(jogo.dupla1_jogador1_id)}
                          </span>
                          {jogo.dupla1_jogador2_id && (
                            <span className="text-xs text-muted-foreground">
                              / {getNomeUsuario(jogo.dupla1_jogador2_id)}
                            </span>
                          )}
                          {jogo.vencedor === 1 && (
                            <Badge variant="default" className="ml-auto">Vencedor</Badge>
                          )}
                        </div>
                        {jogo.placar_dupla1 !== null && jogo.placar_dupla1 !== undefined && (
                          <div className="text-2xl font-bold">{jogo.placar_dupla1}</div>
                        )}
                      </div>
                    </div>

                    <div className="border-t pt-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {getNomeUsuario(jogo.dupla2_jogador1_id)}
                            </span>
                            {jogo.dupla2_jogador2_id && (
                              <span className="text-xs text-muted-foreground">
                                / {getNomeUsuario(jogo.dupla2_jogador2_id)}
                              </span>
                            )}
                            {jogo.vencedor === 2 && (
                              <Badge variant="default" className="ml-auto">Vencedor</Badge>
                            )}
                          </div>
                          {jogo.placar_dupla2 !== null && jogo.placar_dupla2 !== undefined && (
                            <div className="text-2xl font-bold">{jogo.placar_dupla2}</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setJogoSelecionado(jogo);
                              setPlacar1(jogo.placar_dupla1?.toString() || "");
                              setPlacar2(jogo.placar_dupla2?.toString() || "");
                            }}
                          >
                            {jogo.vencedor ? "Editar Placar" : "Definir Placar"}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Atualizar Placar - Jogo #{jogo.numero_jogo}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>
                                {getNomeUsuario(jogo.dupla1_jogador1_id)}
                                {jogo.dupla1_jogador2_id && ` / ${getNomeUsuario(jogo.dupla1_jogador2_id)}`}
                              </Label>
                              <Input
                                type="number"
                                value={placar1}
                                onChange={(e) => setPlacar1(e.target.value)}
                                placeholder="Placar"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>
                                {getNomeUsuario(jogo.dupla2_jogador1_id)}
                                {jogo.dupla2_jogador2_id && ` / ${getNomeUsuario(jogo.dupla2_jogador2_id)}`}
                              </Label>
                              <Input
                                type="number"
                                value={placar2}
                                onChange={(e) => setPlacar2(e.target.value)}
                                placeholder="Placar"
                              />
                            </div>
                            <Button onClick={handleSubmitPlacar} className="w-full">
                              Salvar Placar
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {quadra && (
                        <Badge variant="secondary">
                          Quadra {quadra.numero}
                        </Badge>
                      )}
                      {jogo.data_jogo && (
                        <Badge variant="outline">
                          {new Date(jogo.data_jogo).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
