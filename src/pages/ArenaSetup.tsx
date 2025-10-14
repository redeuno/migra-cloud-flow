import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

export default function ArenaSetup() {
  const navigate = useNavigate();
  const [selectedArenaId, setSelectedArenaId] = useState<string>("");
  const [selectedPlanoId, setSelectedPlanoId] = useState<string>("");

  // Buscar todas as arenas
  const { data: arenas, isLoading: loadingArenas } = useQuery({
    queryKey: ["arenas-setup"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("arenas")
        .select("*, planos_sistema(nome)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Buscar todos os planos
  const { data: planos, isLoading: loadingPlanos } = useQuery({
    queryKey: ["planos-setup"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planos_sistema")
        .select("*")
        .eq("status", "ativo")
        .order("valor_mensal");
      if (error) throw error;
      return data;
    },
  });

  // Buscar módulos da arena selecionada
  const { data: modulosArena } = useQuery({
    queryKey: ["arena-modulos-count", selectedArenaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("arena_modulos")
        .select("id")
        .eq("arena_id", selectedArenaId);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedArenaId,
  });

  // Mutation para associar plano
  const associarPlanoMutation = useMutation({
    mutationFn: async () => {
      if (!selectedArenaId || !selectedPlanoId) {
        throw new Error("Selecione arena e plano");
      }

      // 1. Atualizar arena com plano
      const { error: updateError } = await supabase
        .from("arenas")
        .update({ plano_sistema_id: selectedPlanoId })
        .eq("id", selectedArenaId);

      if (updateError) throw updateError;

      // 2. Buscar módulos inclusos no plano
      const { data: plano, error: planoError } = await supabase
        .from("planos_sistema")
        .select("modulos_inclusos")
        .eq("id", selectedPlanoId)
        .single();

      if (planoError) throw planoError;

      // 3. Deletar módulos existentes
      await supabase
        .from("arena_modulos")
        .delete()
        .eq("arena_id", selectedArenaId);

      // 4. Inserir novos módulos baseado no plano
      const modulosInclusos = (plano.modulos_inclusos as any[]) || [];

      if (modulosInclusos.length > 0) {
        // Buscar IDs dos módulos pelos slugs
        const { data: modulosSistema, error: modulosError } = await supabase
          .from("modulos_sistema")
          .select("id, slug")
          .in("slug", modulosInclusos as string[])
          .eq("status", "ativo");

        if (modulosError) throw modulosError;

        // Inserir arena_modulos
        const modulosParaInserir = (modulosSistema || []).map((m) => ({
          arena_id: selectedArenaId,
          modulo_id: m.id,
          ativo: true,
        }));

        if (modulosParaInserir.length > 0) {
          const { error: insertError } = await supabase
            .from("arena_modulos")
            .insert(modulosParaInserir);

          if (insertError) throw insertError;
        }
      }
    },
    onSuccess: () => {
      toast.success("Plano associado e módulos configurados com sucesso!");
      setSelectedArenaId("");
      setSelectedPlanoId("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao associar plano");
    },
  });

  const arenasSemPlano = arenas?.filter(a => !a.plano_sistema_id) || [];
  const arenasComPlano = arenas?.filter(a => a.plano_sistema_id) || [];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Setup de Arenas</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie planos e módulos das arenas
          </p>
        </div>

        {/* Associar Plano */}
        <Card>
          <CardHeader>
            <CardTitle>Associar Plano à Arena</CardTitle>
            <CardDescription>
              Selecione uma arena e um plano para configurar os módulos automaticamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Arena</label>
                <Select value={selectedArenaId} onValueChange={setSelectedArenaId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma arena" />
                  </SelectTrigger>
                  <SelectContent>
                    {arenas?.map((arena) => (
                      <SelectItem key={arena.id} value={arena.id}>
                        {arena.nome} {arena.plano_sistema_id && "(Com plano)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Plano</label>
                <Select value={selectedPlanoId} onValueChange={setSelectedPlanoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um plano" />
                  </SelectTrigger>
                  <SelectContent>
                    {planos?.map((plano) => (
                      <SelectItem key={plano.id} value={plano.id}>
                        {plano.nome} - R$ {plano.valor_mensal}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedArenaId && (
              <div className="text-sm text-muted-foreground">
                <p>Módulos atuais: {modulosArena?.length || 0}</p>
              </div>
            )}

            <Button
              onClick={() => associarPlanoMutation.mutate()}
              disabled={!selectedArenaId || !selectedPlanoId || associarPlanoMutation.isPending}
              className="w-full sm:w-auto"
            >
              {associarPlanoMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Associar Plano e Configurar Módulos
            </Button>
          </CardContent>
        </Card>

        {/* Status das Arenas */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Arenas SEM plano */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-destructive" />
                Arenas sem Plano ({arenasSemPlano.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingArenas ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : arenasSemPlano.length === 0 ? (
                <p className="text-sm text-muted-foreground">Todas as arenas têm plano</p>
              ) : (
                <ul className="space-y-2">
                  {arenasSemPlano.map((arena) => (
                    <li key={arena.id} className="text-sm border-b pb-2 last:border-0">
                      <p className="font-medium">{arena.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        Status: {arena.status}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Arenas COM plano */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Arenas com Plano ({arenasComPlano.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingArenas ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : arenasComPlano.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma arena com plano</p>
              ) : (
                <ul className="space-y-2">
                  {arenasComPlano.map((arena) => (
                    <li key={arena.id} className="text-sm border-b pb-2 last:border-0">
                      <p className="font-medium">{arena.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        Plano: {arena.planos_sistema?.nome || "N/A"}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
