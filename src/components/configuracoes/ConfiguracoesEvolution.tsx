import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Save, TestTube } from "lucide-react";

interface ConfiguracoesEvolutionProps {
  arenaId?: string;
}

export function ConfiguracoesEvolution({ arenaId: propArenaId }: ConfiguracoesEvolutionProps) {
  const { arenaId: contextArenaId } = useAuth();
  const effectiveArenaId = propArenaId || contextArenaId;
  const queryClient = useQueryClient();
  const [testando, setTestando] = useState(false);

  // Buscar configurações existentes
  const { data: config, isLoading } = useQuery({
    queryKey: ["config-arena", effectiveArenaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("configuracoes_arena")
        .select("*")
        .eq("arena_id", effectiveArenaId!)
        .maybeSingle();
      
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!effectiveArenaId,
  });

  const [formData, setFormData] = useState({
    evolution_api_enabled: false,
    evolution_api_url: "",
    evolution_api_key: "",
    evolution_instance_name: "",
    notificacoes_whatsapp_enabled: false,
    notificacoes_email_enabled: false,
    email_remetente: "",
    template_lembrete_pagamento: "Olá {{nome}}, seu pagamento de {{valor}} vence em {{data_vencimento}}. Link para pagamento: {{link_pagamento}}",
    template_confirmacao_pagamento: "Olá {{nome}}, confirmamos o recebimento do seu pagamento de {{valor}}. Obrigado!",
  });

  // Atualizar form quando config carregar
  useEffect(() => {
    if (config) {
      setFormData({
        evolution_api_enabled: config.evolution_api_enabled ?? false,
        evolution_api_url: config.evolution_api_url ?? "",
        evolution_api_key: config.evolution_api_key ?? "",
        evolution_instance_name: config.evolution_instance_name ?? "",
        notificacoes_whatsapp_enabled: config.notificacoes_whatsapp_enabled ?? false,
        notificacoes_email_enabled: config.notificacoes_email_enabled ?? false,
        email_remetente: config.email_remetente ?? "",
        template_lembrete_pagamento: config.template_lembrete_pagamento ?? 
          "Olá {{nome}}, seu pagamento de {{valor}} vence em {{data_vencimento}}. Link para pagamento: {{link_pagamento}}",
        template_confirmacao_pagamento: config.template_confirmacao_pagamento ?? 
          "Olá {{nome}}, confirmamos o recebimento do seu pagamento de {{valor}}. Obrigado!",
      });
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (config?.id) {
        // Update
        const { error } = await supabase
          .from("configuracoes_arena")
          .update(formData)
          .eq("id", config.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from("configuracoes_arena")
          .insert({ ...formData, arena_id: effectiveArenaId! });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config-arena", effectiveArenaId] });
      toast.success("Configurações salvas com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao salvar configurações");
    },
  });

  const testarConexaoMutation = useMutation({
    mutationFn: async () => {
      // Testar conexão com Evolution API
      const response = await fetch(`${formData.evolution_api_url}/instance/fetchInstances`, {
        method: "GET",
        headers: {
          "apikey": formData.evolution_api_key,
        },
      });

      if (!response.ok) throw new Error("Falha ao conectar com Evolution API");
      return await response.json();
    },
    onSuccess: () => {
      toast.success("Conexão com Evolution API bem-sucedida!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao testar conexão");
    },
    onSettled: () => {
      setTestando(false);
    },
  });

  const handleTestarConexao = () => {
    if (!formData.evolution_api_url || !formData.evolution_api_key) {
      toast.error("Preencha a URL e API Key antes de testar");
      return;
    }
    setTestando(true);
    testarConexaoMutation.mutate();
  };

  if (isLoading) {
    return <div>Carregando configurações...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Evolution API */}
      <Card>
        <CardHeader>
          <CardTitle>Evolution API - WhatsApp</CardTitle>
          <CardDescription>
            Configure a integração com Evolution API para envio de mensagens via WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Ativar Evolution API</Label>
              <p className="text-sm text-muted-foreground">
                Habilitar envio de mensagens via WhatsApp
              </p>
            </div>
            <Switch
              checked={formData.evolution_api_enabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, evolution_api_enabled: checked })
              }
            />
          </div>

          {formData.evolution_api_enabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="evolution_url">URL da Evolution API *</Label>
                <Input
                  id="evolution_url"
                  placeholder="https://sua-evolution-api.com"
                  value={formData.evolution_api_url}
                  onChange={(e) =>
                    setFormData({ ...formData, evolution_api_url: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="evolution_key">API Key *</Label>
                <Input
                  id="evolution_key"
                  type="password"
                  placeholder="Sua chave de API"
                  value={formData.evolution_api_key}
                  onChange={(e) =>
                    setFormData({ ...formData, evolution_api_key: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instance_name">Nome da Instância *</Label>
                <Input
                  id="instance_name"
                  placeholder="minha-instancia"
                  value={formData.evolution_instance_name}
                  onChange={(e) =>
                    setFormData({ ...formData, evolution_instance_name: e.target.value })
                  }
                />
              </div>

              <Button
                variant="outline"
                onClick={handleTestarConexao}
                disabled={testando}
              >
                <TestTube className="h-4 w-4 mr-2" />
                {testando ? "Testando..." : "Testar Conexão"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Notificações */}
      <Card>
        <CardHeader>
          <CardTitle>Notificações</CardTitle>
          <CardDescription>Configure os canais de notificação</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificações por WhatsApp</Label>
              <p className="text-sm text-muted-foreground">
                Enviar lembretes e confirmações via WhatsApp
              </p>
            </div>
            <Switch
              checked={formData.notificacoes_whatsapp_enabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, notificacoes_whatsapp_enabled: checked })
              }
              disabled={!formData.evolution_api_enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificações por Email</Label>
              <p className="text-sm text-muted-foreground">
                Enviar lembretes e confirmações via Email
              </p>
            </div>
            <Switch
              checked={formData.notificacoes_email_enabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, notificacoes_email_enabled: checked })
              }
            />
          </div>

          {formData.notificacoes_email_enabled && (
            <div className="space-y-2">
              <Label htmlFor="email_remetente">Email Remetente</Label>
              <Input
                id="email_remetente"
                type="email"
                placeholder="arena@exemplo.com"
                value={formData.email_remetente}
                onChange={(e) =>
                  setFormData({ ...formData, email_remetente: e.target.value })
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Templates de Mensagens */}
      <Card>
        <CardHeader>
          <CardTitle>Templates de Mensagens</CardTitle>
          <CardDescription>
            Personalize as mensagens automáticas. Use: {`{{nome}}, {{valor}}, {{data_vencimento}}, {{link_pagamento}}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template_lembrete">Template de Lembrete de Pagamento</Label>
            <Textarea
              id="template_lembrete"
              rows={4}
              placeholder="Olá {{nome}}, seu pagamento de {{valor}} vence em {{data_vencimento}}..."
              value={formData.template_lembrete_pagamento}
              onChange={(e) =>
                setFormData({ ...formData, template_lembrete_pagamento: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template_confirmacao">Template de Confirmação de Pagamento</Label>
            <Textarea
              id="template_confirmacao"
              rows={4}
              placeholder="Olá {{nome}}, confirmamos o recebimento do seu pagamento de {{valor}}..."
              value={formData.template_confirmacao_pagamento}
              onChange={(e) =>
                setFormData({ ...formData, template_confirmacao_pagamento: e.target.value })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button onClick={() => saveMutation.mutate()}>
          <Save className="h-4 w-4 mr-2" />
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}
