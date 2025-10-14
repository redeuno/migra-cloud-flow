import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Buscar ID do usuário
  const { data: usuario } = useQuery({
    queryKey: ["usuario-id", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("usuarios")
        .select("id")
        .eq("auth_id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Configurar realtime para notificações com toast
  useEffect(() => {
    if (!usuario?.id) return;

    const channel = supabase
      .channel(`notificacoes-${usuario.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notificacoes",
          filter: `usuario_id=eq.${usuario.id}`,
        },
        (payload) => {
          const notificacao = payload.new as any;
          
          // Mostrar toast com a notificação
          toast.info(notificacao.titulo, {
            description: notificacao.mensagem,
            duration: 5000,
            action: notificacao.link ? {
              label: "Ver",
              onClick: () => window.location.href = notificacao.link,
            } : undefined,
          });

          // Invalidar queries para atualizar o badge
          queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [usuario?.id, queryClient]);

  return { usuario };
}
