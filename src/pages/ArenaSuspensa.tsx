import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CreditCard, MessageCircle, Settings, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

export default function ArenaSuspensa() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: faturaPendente, isLoading } = useQuery({
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
    // Priorizar link direto do boleto (PDF)
    const paymentUrl = faturaPendente?.asaas_bankslip_url || faturaPendente?.asaas_invoice_url;
    if (paymentUrl) {
      window.open(paymentUrl, "_blank");
    }
  };

  const handleContatarSuporte = () => {
    const whatsapp = "5511999999999"; // Substituir pelo número real
    const mensagem = `Olá! Minha arena está suspensa e preciso de ajuda. Fatura: ${faturaPendente?.numero_fatura || "N/A"}`;
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(mensagem)}`, "_blank");
  };

  const handleVerAssinatura = () => {
    navigate("/configuracoes?tab=assinatura");
  };

  const handleGerarFatura = async () => {
    try {
      await supabase.functions.invoke('gerar-fatura-sistema');
      // Refetch após gerar
      window.location.reload();
    } catch (error) {
      console.error("Erro ao gerar fatura:", error);
    }
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
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : faturaPendente ? (
            <>
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

              <div className="space-y-3">
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handlePagarAgora}
                  disabled={!faturaPendente?.asaas_bankslip_url && !faturaPendente?.asaas_invoice_url}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pagar Agora (Boleto)
                </Button>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    size="lg"
                    onClick={handleVerAssinatura}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Ver Assinatura
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    size="lg"
                    onClick={handleContatarSuporte}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Suporte
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4 rounded-lg space-y-3">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                      Nenhuma fatura pendente encontrada
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      Sua arena está suspensa, mas não encontramos uma fatura ativa. 
                      Isso pode significar que a fatura ainda não foi gerada pelo sistema.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleGerarFatura}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Gerar Fatura
                </Button>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    size="lg"
                    onClick={handleVerAssinatura}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Ver Assinatura
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    size="lg"
                    onClick={handleContatarSuporte}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Suporte
                  </Button>
                </div>
              </div>
            </>
          )}

          <div className="text-xs text-center text-muted-foreground space-y-1">
            <p>Após a confirmação do pagamento, seu acesso será liberado automaticamente.</p>
            <p>Dúvidas? Entre em contato com nosso suporte.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
