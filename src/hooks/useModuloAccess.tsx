import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ModuloAccessConfig {
  moduloSlug: string;
  requiredRoles?: ("super_admin" | "arena_admin" | "funcionario" | "professor" | "aluno")[];
}

export function useModuloAccess({ moduloSlug, requiredRoles }: ModuloAccessConfig) {
  const { arenaId, hasRole, userRoles } = useAuth();

  // Verificar se usuário tem role necessária
  const hasRequiredRole = requiredRoles
    ? requiredRoles.some((role) => hasRole(role)) || hasRole("super_admin")
    : true;

  // Buscar se módulo está ativo
  const { data: moduloAtivo, isLoading } = useQuery({
    queryKey: ["modulo-access", arenaId, moduloSlug],
    queryFn: async () => {
      if (!arenaId) return false;

      const { data, error } = await supabase
        .from("arena_modulos")
        .select(`
          ativo,
          modulos_sistema (
            slug,
            status
          )
        `)
        .eq("arena_id", arenaId)
        .eq("modulos_sistema.slug", moduloSlug)
        .eq("ativo", true)
        .single();

      if (error) return false;
      return data?.ativo && data?.modulos_sistema?.status === "ativo";
    },
    enabled: !!arenaId && hasRequiredRole,
  });

  // Super admin sempre tem acesso
  const isSuperAdmin = hasRole("super_admin");

  return {
    hasAccess: isSuperAdmin || (hasRequiredRole && moduloAtivo),
    isLoading,
    hasRequiredRole,
    moduloAtivo,
  };
}
