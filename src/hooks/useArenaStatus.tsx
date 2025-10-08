import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useArenaStatus() {
  const navigate = useNavigate();
  const { user, hasRole, userRoles } = useAuth();

  const { data: arena } = useQuery({
    queryKey: ["arena-status", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Super admin não é afetado
      if (hasRole("super_admin")) return null;

      // Buscar arena do usuário
      const { data: userData } = await supabase
        .from("usuarios")
        .select("arena_id")
        .eq("auth_id", user.id)
        .single();

      if (!userData?.arena_id) return null;

      const { data: arenaData } = await supabase
        .from("arenas")
        .select("status, data_vencimento")
        .eq("id", userData.arena_id)
        .single();

      return arenaData;
    },
    enabled: !!user?.id && !hasRole("super_admin"),
    refetchInterval: 30000, // Revalidar a cada 30 segundos
  });

  useEffect(() => {
    // Se arena está suspensa e usuário é arena_admin, redirecionar
    if (arena?.status === "suspenso" && hasRole("arena_admin")) {
      navigate("/arena-suspensa");
    }
  }, [arena, hasRole, navigate]);

  return { arena, isSuspended: arena?.status === "suspenso" };
}
