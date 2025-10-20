import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Lock, Square, icons as lucideIcons } from "lucide-react";

interface ModulosArenaManagerProps {
  arenaId?: string;
}

export function ModulosArenaManager({ arenaId: propArenaId }: ModulosArenaManagerProps) {
  const { arenaId: contextArenaId } = useAuth();
  const effectiveArenaId = propArenaId || contextArenaId;
  const queryClient = useQueryClient();

  // Buscar plano atual da arena
  const { data: arena, isLoading: loadingArena } = useQuery({
    queryKey: ["arena-plano", effectiveArenaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("arenas")
        .select("*, planos_sistema(*)")
        .eq("id", effectiveArenaId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!effectiveArenaId,
  });

  // Buscar todos os módulos do sistema
  const { data: modulosSistema, isLoading: loadingModulos } = useQuery({
    queryKey: ["modulos-sistema"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("modulos_sistema")
        .select("*")
        .eq("status", "ativo")
        .order("ordem");
      if (error) throw error;
      return data;
    },
  });

  // Buscar módulos ativos da arena
  const { data: modulosAtivos, isLoading: loadingAtivos } = useQuery({
    queryKey: ["arena-modulos", effectiveArenaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("arena_modulos")
        .select("modulo_id, ativo")
        .eq("arena_id", effectiveArenaId!);
      if (error) throw error;
      return data;
    },
    enabled: !!effectiveArenaId,
  });

  // Mutation para ativar/desativar módulo
  const toggleModulo = useMutation({
    mutationFn: async ({ moduloId, ativo }: { moduloId: string; ativo: boolean }) => {
      // Verificar se já existe antes de criar
      const { data: existing } = await supabase
        .from("arena_modulos")
        .select("id, ativo")
        .eq("arena_id", effectiveArenaId!)
        .eq("modulo_id", moduloId)
        .single();

      if (existing) {
        // Atualizar registro existente
        const { error } = await supabase
          .from("arena_modulos")
          .update({ ativo })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        // Criar novo registro se não existe
        const { error } = await supabase
          .from("arena_modulos")
          .insert({
            arena_id: effectiveArenaId!,
            modulo_id: moduloId,
            ativo,
            data_ativacao: ativo ? new Date().toISOString().split('T')[0] : null,
          });
        
        if (error) {
          // Tratar erro de duplicata especificamente
          if (error.code === '23505') {
            throw new Error("Este módulo já está configurado para esta arena");
          }
          throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["arena-modulos", effectiveArenaId] });
      queryClient.invalidateQueries({ queryKey: ["arena-modulos-ativos", effectiveArenaId] });
      toast.success("Módulo atualizado!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar módulo");
    },
  });

  const isLoading = loadingArena || loadingModulos || loadingAtivos;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Módulos inclusos no plano
  const modulosInclusos = (Array.isArray(arena?.planos_sistema?.modulos_inclusos) 
    ? arena.planos_sistema.modulos_inclusos 
    : []) as string[];
  
  // Mapa de módulos ativos
  const modulosAtivosMapa = new Map(
    modulosAtivos?.map((m) => [m.modulo_id, m.ativo]) || []
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modulosSistema?.map((modulo) => {
          const isInclusoNoPlano = modulosInclusos.includes(modulo.slug);
          const isAtivo = modulosAtivosMapa.get(modulo.id) || false;
          const IconComp = (lucideIcons as any)[modulo.icone as keyof typeof lucideIcons] || Square;
          
          return (
            <Card key={modulo.id} className={!isInclusoNoPlano ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconComp className="h-5 w-5" />
                    <div>
                      <CardTitle className="text-base">{modulo.nome}</CardTitle>
                      {!isInclusoNoPlano && (
                        <Badge variant="outline" className="mt-1">
                          <Lock className="h-3 w-3 mr-1" />
                          Upgrade Necessário
                        </Badge>
                      )}
                    </div>
                  </div>
                  {isInclusoNoPlano && (
                    <Switch
                      checked={isAtivo}
                      onCheckedChange={(checked) =>
                        toggleModulo.mutate({ moduloId: modulo.id, ativo: checked })
                      }
                      disabled={toggleModulo.isPending}
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  {modulo.descricao}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="border-t pt-4">
        <p className="text-sm text-muted-foreground">
          <strong>Plano Atual:</strong> {arena?.planos_sistema?.nome || "N/A"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Para ativar módulos adicionais, entre em contato com o suporte ou faça upgrade do seu plano.
        </p>
      </div>
    </div>
  );
}
