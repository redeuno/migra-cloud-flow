import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Send, Mail, MessageCircle } from "lucide-react";

interface EnviarLinkPagamentoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mensalidade: any;
  clienteId: string;
}

export function EnviarLinkPagamento({
  open,
  onOpenChange,
  mensalidade,
  clienteId,
}: EnviarLinkPagamentoProps) {
  const { arenaId } = useAuth();
  const [enviarWhatsApp, setEnviarWhatsApp] = useState(true);
  const [enviarEmail, setEnviarEmail] = useState(false);
  const [mensagemPersonalizada, setMensagemPersonalizada] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Buscar dados do cliente
  const { data: cliente } = useQuery({
    queryKey: ["cliente", clienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", clienteId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!clienteId,
  });

  // Buscar configurações da arena
  const { data: config } = useQuery({
    queryKey: ["config-arena", arenaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("configuracoes_arena")
        .select("*")
        .eq("arena_id", arenaId)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!arenaId,
  });

  const enviarLinkMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("enviar-link-pagamento", {
        body: {
          mensalidade_id: mensalidade.id,
          cliente_id: clienteId,
          enviar_whatsapp: enviarWhatsApp,
          enviar_email: enviarEmail,
          mensagem_personalizada: mensagemPersonalizada,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Link de pagamento enviado com sucesso!");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao enviar link de pagamento");
    },
    onSettled: () => {
      setEnviando(false);
    },
  });

  const handleEnviar = () => {
    if (!enviarWhatsApp && !enviarEmail) {
      toast.error("Selecione pelo menos um canal de envio");
      return;
    }

    if (enviarWhatsApp && !cliente?.whatsapp && !cliente?.telefone) {
      toast.error("Cliente não possui WhatsApp/telefone cadastrado");
      return;
    }

    if (enviarEmail && !cliente?.email) {
      toast.error("Cliente não possui email cadastrado");
      return;
    }

    setEnviando(true);
    enviarLinkMutation.mutate();
  };

  const linkPagamento = mensalidade?.asaas_invoice_url || "#";
  const valorFormatado = mensalidade?.valor_final || mensalidade?.valor || 0;

  // Template de mensagem padrão
  const mensagemPadrao = config?.template_lembrete_pagamento
    ?.replace("{{nome}}", cliente?.nome_completo || "")
    .replace("{{valor}}", `R$ ${valorFormatado}`)
    .replace(
      "{{data_vencimento}}",
      new Date(mensalidade?.data_vencimento).toLocaleDateString()
    )
    .replace("{{link_pagamento}}", linkPagamento);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Enviar Link de Pagamento</DialogTitle>
          <DialogDescription>
            Envie o link de pagamento para o cliente via WhatsApp ou Email
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações do Pagamento */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <p className="text-sm">
              <span className="font-medium">Cliente:</span> {cliente?.nome_completo}
            </p>
            <p className="text-sm">
              <span className="font-medium">Valor:</span> R$ {valorFormatado}
            </p>
            <p className="text-sm">
              <span className="font-medium">Vencimento:</span>{" "}
              {new Date(mensalidade?.data_vencimento).toLocaleDateString()}
            </p>
          </div>

          {/* Canais de Envio */}
          <div className="space-y-3">
            <Label>Canais de Envio</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="whatsapp"
                checked={enviarWhatsApp}
                onCheckedChange={(checked) => setEnviarWhatsApp(checked as boolean)}
                disabled={!config?.evolution_api_enabled || !cliente?.whatsapp}
              />
              <Label
                htmlFor="whatsapp"
                className="flex items-center gap-2 cursor-pointer"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
                {!config?.evolution_api_enabled && (
                  <span className="text-xs text-muted-foreground">
                    (Evolution API não configurada)
                  </span>
                )}
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="email"
                checked={enviarEmail}
                onCheckedChange={(checked) => setEnviarEmail(checked as boolean)}
                disabled={!config?.notificacoes_email_enabled || !cliente?.email}
              />
              <Label
                htmlFor="email"
                className="flex items-center gap-2 cursor-pointer"
              >
                <Mail className="h-4 w-4" />
                Email
                {!config?.notificacoes_email_enabled && (
                  <span className="text-xs text-muted-foreground">
                    (Email não configurado)
                  </span>
                )}
              </Label>
            </div>
          </div>

          {/* Mensagem Personalizada */}
          <div className="space-y-2">
            <Label htmlFor="mensagem">Mensagem (opcional)</Label>
            <Textarea
              id="mensagem"
              placeholder={mensagemPadrao || "Digite uma mensagem personalizada..."}
              value={mensagemPersonalizada}
              onChange={(e) => setMensagemPersonalizada(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Se deixar em branco, será enviada a mensagem padrão
            </p>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={enviando}
            >
              Cancelar
            </Button>
            <Button onClick={handleEnviar} disabled={enviando}>
              <Send className="h-4 w-4 mr-2" />
              {enviando ? "Enviando..." : "Enviar Link"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
