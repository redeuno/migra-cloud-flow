import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ExternalLink, MessageCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function ArenaSuspensa() {
  const { user } = useAuth();

  const { data: faturaPendente } = useQuery({
    queryKey: ["fatura-pendente", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data: userData } = await supabase
        .from("usuarios")
        .select("arena_id")
        .eq("auth_id", user.id)
        .single();

      if (!userData?.arena_id) return null;

      const { data } = await supabase
        .from("faturas_sistema")
        .select("*, assinaturas_arena(*)")
        .eq("arena_id", userData.arena_id)
        .eq("status_pagamento", "pendente")
        .order("data_vencimento", { ascending: true })
        .limit(1)
        .maybeSingle();

      return data;
    },
  });

  const handlePagarAgora = () => {
    if (faturaPendente?.asaas_invoice_url) {
      window.open(faturaPendente.asaas_invoice_url, "_blank");
    }
  };

  const handleContatarSuporte = () => {
    // Número do Super Admin para contato
    const whatsapp = "5511999999999"; // Substituir pelo número real
    const mensagem = `Olá! Minha arena está suspensa e preciso de ajuda. Fatura: ${faturaPendente?.numero_fatura || "N/A"}`;
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(mensagem)}`, "_blank");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Assinatura Pendente</CardTitle>
          <CardDescription className="text-base">
            Sua arena está temporariamente suspensa devido a pendências financeiras.
            Para continuar usando o sistema, regularize sua situação.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {faturaPendente && (
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fatura:</span>
                <span className="font-medium">{faturaPendente.numero_fatura}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valor:</span>
                <span className="font-medium">
                  R$ {Number(faturaPendente.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Vencimento:</span>
                <span className="font-medium text-destructive">
                  {new Date(faturaPendente.data_vencimento).toLocaleDateString('pt-BR')}
                </span>
              </div>
              {faturaPendente.assinaturas_arena && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Plano:</span>
                  <span className="font-medium">
                    R$ {Number(faturaPendente.assinaturas_arena.valor_mensal).toFixed(0)}/mês
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            <Button 
              className="w-full" 
              size="lg"
              onClick={handlePagarAgora}
              disabled={!faturaPendente?.asaas_invoice_url}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Pagar Agora
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              size="lg"
              onClick={handleContatarSuporte}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Falar com Suporte
            </Button>
          </div>

          <div className="text-xs text-center text-muted-foreground space-y-1">
            <p>Após a confirmação do pagamento, seu acesso será liberado automaticamente.</p>
            <p>Dúvidas? Entre em contato com nosso suporte.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
