import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useArenaAccess() {
  const { arenaId } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["arena-access", arenaId],
    queryFn: async () => {
      if (!arenaId) return null;

      const { data, error } = await supabase.rpc("check_arena_status", {
        _arena_id: arenaId,
      });

      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!arenaId,
    refetchInterval: 60000, // Recheck every minute
  });

  return {
    arenaStatus: data,
    isLoading,
    podeAcessar: data?.pode_acessar ?? true,
    mensagem: data?.mensagem,
    diasAteVencimento: data?.dias_ate_vencimento,
  };
}
