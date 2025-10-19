import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { AlertCircle, CheckCircle2, CreditCard, DollarSign, Calendar, FileText } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface MinhaAssinaturaProps {
  arenaId?: string;
}

export function MinhaAssinatura({ arenaId: propArenaId }: MinhaAssinaturaProps) {
  const { arenaId: contextArenaId } = useAuth();
  const effectiveArenaId = propArenaId || contextArenaId;

  const { data: assinatura, isLoading: loadingAssinatura } = useQuery({
    queryKey: ["minha-assinatura", effectiveArenaId],
    queryFn: async () => {
      if (!effectiveArenaId) return null;

      const { data, error } = await supabase
        .from("assinaturas_arena")
        .select(`
          *,
          planos_sistema:plano_sistema_id(
            nome,
            valor_mensal,
            modulos_inclusos
          )
        `)
        .eq("arena_id", effectiveArenaId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!effectiveArenaId,
  });

  const { data: faturas, isLoading: loadingFaturas } = useQuery({
    queryKey: ["faturas-assinatura", effectiveArenaId],
    queryFn: async () => {
      if (!effectiveArenaId) return [];

      const { data, error } = await supabase
        .from("faturas_sistema")
        .select("*")
        .eq("arena_id", effectiveArenaId)
        .order("data_vencimento", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!effectiveArenaId && !!assinatura,
  });

  const { data: arena } = useQuery({
    queryKey: ["arena-info", effectiveArenaId],
    queryFn: async () => {
      if (!effectiveArenaId) return null;

      const { data, error } = await supabase
        .from("arenas")
        .select("nome, status, data_vencimento")
        .eq("id", effectiveArenaId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!effectiveArenaId,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ativo":
        return <Badge variant="default" className="bg-green-600">Ativo</Badge>;
      case "suspenso":
        return <Badge variant="destructive">Suspenso</Badge>;
      case "cancelado":
        return <Badge variant="secondary">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusPagamento = (statusPagamento: string, dataVencimento: string) => {
    const vencido = isPast(new Date(dataVencimento)) && !isToday(new Date(dataVencimento));
    
    if (statusPagamento === "pago") {
      return { label: "Pago", variant: "default" as const, icon: CheckCircle2, color: "text-green-600" };
    }
    if (vencido) {
      return { label: "Vencido", variant: "destructive" as const, icon: AlertCircle, color: "text-destructive" };
    }
    if (isToday(new Date(dataVencimento))) {
      return { label: "Vence hoje", variant: "default" as const, icon: AlertCircle, color: "text-orange-600" };
    }
    return { label: "Pendente", variant: "outline" as const, icon: Calendar, color: "text-muted-foreground" };
  };

  if (!effectiveArenaId) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Erro"
        description="Arena não identificada"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Status da Arena e Assinatura */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Status da Assinatura
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAssinatura ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : assinatura ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Plano</span>
                  <span className="font-medium">{assinatura.planos_sistema?.nome || "N/A"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Valor Mensal</span>
                  <span className="font-medium">
                    R$ {Number(assinatura.valor_mensal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {getStatusBadge(assinatura.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Dia Vencimento</span>
                  <span className="font-medium">Todo dia {assinatura.dia_vencimento}</span>
                </div>
                {assinatura.data_fim && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Data Fim</span>
                    <span className="font-medium">
                      {format(new Date(assinatura.data_fim), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState
                icon={AlertCircle}
                title="Sem assinatura"
                description="Nenhuma assinatura ativa encontrada"
                className="py-4"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informações da Arena
            </CardTitle>
          </CardHeader>
          <CardContent>
            {arena ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Nome</span>
                  <span className="font-medium">{arena.nome}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {getStatusBadge(arena.status)}
                </div>
                {arena.data_vencimento && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Próximo Vencimento</span>
                    <span className="font-medium">
                      {format(new Date(arena.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <Skeleton className="h-20 w-full" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Faturas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Histórico de Faturas
          </CardTitle>
          <CardDescription>
            Últimas faturas da sua assinatura
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingFaturas ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !faturas || faturas.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Sem faturas"
              description="Nenhuma fatura encontrada"
              className="py-4"
            />
          ) : (
            <div className="space-y-2">
              {faturas.map((fatura: any) => {
                const status = getStatusPagamento(fatura.status_pagamento, fatura.data_vencimento);
                const StatusIcon = status.icon;
                
                return (
                  <div
                    key={fatura.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border",
                      status.variant === "destructive" && "border-destructive/50 bg-destructive/5"
                    )}
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <StatusIcon className={cn("h-4 w-4", status.color)} />
                        <span className="font-medium">
                          {format(new Date(fatura.competencia), "MMMM/yyyy", { locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Vencimento: {format(new Date(fatura.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                      {fatura.data_pagamento && (
                        <p className="text-sm text-green-600">
                          Pago em: {format(new Date(fatura.data_pagamento), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-lg font-bold">
                        R$ {Number(fatura.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Aviso para Super Admin */}
      {assinatura?.status === "suspenso" && (
        <Card className="border-destructive bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Assinatura Suspensa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Sua assinatura está suspensa. Entre em contato com o suporte para regularizar.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
