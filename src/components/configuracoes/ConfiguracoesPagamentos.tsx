import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Loader2, CreditCard, Smartphone } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface ConfiguracoesPagamentosProps {
  arenaId?: string;
}

export function ConfiguracoesPagamentos({ arenaId: propArenaId }: ConfiguracoesPagamentosProps) {
  const { arenaId: contextArenaId } = useAuth();
  const effectiveArenaId = propArenaId || contextArenaId;
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: config, isLoading } = useQuery({
    queryKey: ["arena-config-pagamentos", effectiveArenaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("arenas")
        .select("configuracoes")
        .eq("id", effectiveArenaId!)
        .single();

      if (error) throw error;
      return data?.configuracoes || {};
    },
    enabled: !!effectiveArenaId,
  });

  const updateMutation = useMutation({
    mutationFn: async (configuracoes: any) => {
      const { error } = await supabase
        .from("arenas")
        .update({ configuracoes })
        .eq("id", effectiveArenaId!);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["arena-config-pagamentos", effectiveArenaId] });
      toast({
        title: "Configurações atualizadas",
        description: "As configurações de pagamento foram salvas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const configuracoes = {
      ...(config as any),
      pagamentos: {
        asaas_enabled: formData.get("asaas_enabled") === "on",
        asaas_api_key: formData.get("asaas_api_key"),
        asaas_wallet_id: formData.get("asaas_wallet_id"),
        formas_pagamento: {
          boleto: formData.get("boleto") === "on",
          pix: formData.get("pix") === "on",
          cartao_credito: formData.get("cartao_credito") === "on",
          dinheiro: formData.get("dinheiro") === "on",
        },
        pix_config: {
          chave_pix: formData.get("chave_pix"),
          tipo_chave: formData.get("tipo_chave"),
        },
      },
      contratos_padrao: {
        valor_mensal_padrao: parseFloat(formData.get("valor_mensal_padrao") as string) || 150,
        dia_vencimento_padrao: parseInt(formData.get("dia_vencimento_padrao") as string) || 10,
        taxa_adesao_padrao: parseFloat(formData.get("taxa_adesao_padrao") as string) || 0,
        desconto_percentual_padrao: parseFloat(formData.get("desconto_percentual_padrao") as string) || 0,
      },
    };

    await updateMutation.mutateAsync(configuracoes);
    setIsSubmitting(false);
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const configData = config as any;
  const pagamentos = configData?.pagamentos || {};
  const formas = pagamentos?.formas_pagamento || {};
  const pixConfig = pagamentos?.pix_config || {};

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações de Pagamento</CardTitle>
        <CardDescription>
          Configure as formas de pagamento e integrações
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Integração Asaas */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Integração Asaas</h3>
                <p className="text-sm text-muted-foreground">
                  Configure a integração com o gateway de pagamento Asaas
                </p>
              </div>
              <Switch
                id="asaas_enabled"
                name="asaas_enabled"
                defaultChecked={pagamentos?.asaas_enabled}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 ml-4">
              <div className="space-y-2">
                <Label htmlFor="asaas_api_key">API Key do Asaas</Label>
                <Input
                  id="asaas_api_key"
                  name="asaas_api_key"
                  type="password"
                  defaultValue={pagamentos?.asaas_api_key}
                  placeholder="$aact_..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="asaas_wallet_id">Wallet ID (opcional)</Label>
                <Input
                  id="asaas_wallet_id"
                  name="asaas_wallet_id"
                  defaultValue={pagamentos?.asaas_wallet_id}
                  placeholder="ID da carteira Asaas"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Formas de Pagamento */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Formas de Pagamento Aceitas</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor="boleto" className="font-medium">Boleto</Label>
                    <p className="text-xs text-muted-foreground">Pagamento via boleto bancário</p>
                  </div>
                </div>
                <Switch
                  id="boleto"
                  name="boleto"
                  defaultChecked={formas?.boleto ?? true}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor="pix" className="font-medium">PIX</Label>
                    <p className="text-xs text-muted-foreground">Pagamento instantâneo via PIX</p>
                  </div>
                </div>
                <Switch
                  id="pix"
                  name="pix"
                  defaultChecked={formas?.pix ?? true}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor="cartao_credito" className="font-medium">Cartão de Crédito</Label>
                    <p className="text-xs text-muted-foreground">Parcelamento disponível</p>
                  </div>
                </div>
                <Switch
                  id="cartao_credito"
                  name="cartao_credito"
                  defaultChecked={formas?.cartao_credito ?? true}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor="dinheiro" className="font-medium">Dinheiro</Label>
                    <p className="text-xs text-muted-foreground">Pagamento em espécie</p>
                  </div>
                </div>
                <Switch
                  id="dinheiro"
                  name="dinheiro"
                  defaultChecked={formas?.dinheiro ?? true}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Configurações PIX */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Configurações PIX</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo_chave">Tipo de Chave</Label>
                <Input
                  id="tipo_chave"
                  name="tipo_chave"
                  defaultValue={pixConfig?.tipo_chave}
                  placeholder="CPF, CNPJ, E-mail, Telefone"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="chave_pix">Chave PIX</Label>
                <Input
                  id="chave_pix"
                  name="chave_pix"
                  defaultValue={pixConfig?.chave_pix}
                  placeholder="Sua chave PIX"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Padrões de Contratos */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Padrões de Contratos</h3>
            <p className="text-sm text-muted-foreground">
              Valores padrão para novos contratos
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valor_mensal_padrao">Valor Mensal Padrão (R$)</Label>
                <Input
                  id="valor_mensal_padrao"
                  name="valor_mensal_padrao"
                  type="number"
                  step="0.01"
                  defaultValue={configData?.contratos_padrao?.valor_mensal_padrao || 150}
                  placeholder="150.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dia_vencimento_padrao">Dia Vencimento Padrão</Label>
                <Input
                  id="dia_vencimento_padrao"
                  name="dia_vencimento_padrao"
                  type="number"
                  min="1"
                  max="28"
                  defaultValue={configData?.contratos_padrao?.dia_vencimento_padrao || 10}
                  placeholder="10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxa_adesao_padrao">Taxa de Adesão Padrão (R$)</Label>
                <Input
                  id="taxa_adesao_padrao"
                  name="taxa_adesao_padrao"
                  type="number"
                  step="0.01"
                  defaultValue={configData?.contratos_padrao?.taxa_adesao_padrao || 0}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="desconto_percentual_padrao">Desconto Percentual Padrão (%)</Label>
                <Input
                  id="desconto_percentual_padrao"
                  name="desconto_percentual_padrao"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  defaultValue={configData?.contratos_padrao?.desconto_percentual_padrao || 0}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Configurações
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
