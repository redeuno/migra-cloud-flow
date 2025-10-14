import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Notificacao {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  link: string | null;
  created_at: string;
  metadata: any;
}

export function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // Buscar ID do usuário
  const { data: usuario } = useQuery({
    queryKey: ["usuario-id", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("usuarios")
        .select("id")
        .eq("auth_id", user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Buscar notificações
  const { data: notificacoes = [] } = useQuery({
    queryKey: ["notificacoes", usuario?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notificacoes")
        .select("*")
        .eq("usuario_id", usuario?.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as Notificacao[];
    },
    enabled: !!usuario?.id,
  });

  // Realtime subscription
  useEffect(() => {
    if (!usuario?.id) return;

    const channel = supabase
      .channel("notificacoes-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notificacoes",
          filter: `usuario_id=eq.${usuario.id}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [usuario?.id, queryClient]);

  // Marcar como lida
  const marcarLidaMutation = useMutation({
    mutationFn: async (notificacaoId: string) => {
      const { error } = await supabase
        .from("notificacoes")
        .update({ lida: true, lida_em: new Date().toISOString() })
        .eq("id", notificacaoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
    },
  });

  // Marcar todas como lidas
  const marcarTodasLidasMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notificacoes")
        .update({ lida: true, lida_em: new Date().toISOString() })
        .eq("usuario_id", usuario?.id)
        .eq("lida", false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
    },
  });

  const handleNotificationClick = (notificacao: Notificacao) => {
    if (!notificacao.lida) {
      marcarLidaMutation.mutate(notificacao.id);
    }
    if (notificacao.link) {
      navigate(notificacao.link);
      setOpen(false);
    }
  };

  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  const getIconeNotificacao = (tipo: string) => {
    const icones: Record<string, string> = {
      agendamento_novo: "📅",
      agendamento_cancelado: "❌",
      checkin_realizado: "✅",
      pagamento_recebido: "💰",
      pagamento_vencido: "⚠️",
      mensalidade_proxima: "📆",
      contrato_expirando: "⏰",
      aula_confirmada: "📚",
      torneio_inscricao: "🏆",
      sistema_alerta: "🔔",
      financeiro_alerta: "💳",
    };
    return icones[tipo] || "🔔";
  };

  if (!usuario) return null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {naoLidas > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {naoLidas > 9 ? "9+" : naoLidas}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 sm:w-96">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificações</span>
          {naoLidas > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => marcarTodasLidasMutation.mutate()}
              className="h-auto p-1 text-xs"
            >
              Marcar todas como lidas
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <ScrollArea className="h-[400px]">
          {notificacoes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mb-2 opacity-50" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            notificacoes.map((notificacao) => (
              <DropdownMenuItem
                key={notificacao.id}
                className={cn(
                  "flex flex-col items-start gap-1 p-3 cursor-pointer",
                  !notificacao.lida && "bg-accent/50"
                )}
                onClick={() => handleNotificationClick(notificacao)}
              >
                <div className="flex items-start gap-2 w-full">
                  <span className="text-xl flex-shrink-0">
                    {getIconeNotificacao(notificacao.tipo)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm truncate">
                        {notificacao.titulo}
                      </p>
                      {!notificacao.lida && (
                        <div className="h-2 w-2 bg-primary rounded-full flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notificacao.mensagem}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notificacao.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
