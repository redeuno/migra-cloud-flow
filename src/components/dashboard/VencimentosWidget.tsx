import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { format, addDays, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface VencimentosWidgetProps {
  arenaId: string;
  className?: string;
}

export function VencimentosWidget({ arenaId, className }: VencimentosWidgetProps) {
  const navigate = useNavigate();
  const hoje = new Date();
  const proximosDias = addDays(hoje, 7).toISOString().split("T")[0];

  const { data: vencimentos, isLoading } = useQuery({
    queryKey: ["vencimentos-proximos", arenaId],
    queryFn: async () => {
      // Buscar apenas mensalidades de clientes/alunos pendentes dos próximos 7 dias
      const { data: mensalidades, error: mensalidadesError } = await supabase
        .from("mensalidades")
        .select(`
          id,
          valor_final,
          data_vencimento,
          status_pagamento,
          contratos(
            arena_id,
            usuario_id,
            usuarios:usuario_id(nome_completo, cpf)
          )
        `)
        .eq("status_pagamento", "pendente")
        .lte("data_vencimento", proximosDias)
        .order("data_vencimento", { ascending: true });

      if (mensalidadesError) throw mensalidadesError;

      // Filtrar apenas mensalidades da arena atual e formatar
      const combined = (mensalidades || [])
        .filter((m: any) => m.contratos?.arena_id === arenaId)
        .map((m: any) => ({
          id: m.id,
          tipo: "Mensalidade",
          descricao: m.contratos?.usuarios?.nome_completo || "Cliente",
          valor: Number(m.valor_final),
          dataVencimento: m.data_vencimento,
          link: "/financeiro?tab=mensalidades",
        }))
        .sort((a, b) => new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime());

      return combined;
    },
    enabled: !!arenaId,
  });

  const getStatusVencimento = (dataVencimento: string) => {
    const data = new Date(dataVencimento);
    if (isPast(data) && !isToday(data)) {
      return { label: "Vencido", variant: "destructive" as const, urgent: true };
    }
    if (isToday(data)) {
      return { label: "Vence hoje", variant: "default" as const, urgent: true };
    }
    return { label: "Próximo", variant: "outline" as const, urgent: false };
  };

  const totalVencimentos = vencimentos?.reduce((sum, v) => sum + v.valor, 0) || 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Vencimentos Próximos
        </CardTitle>
        <CardDescription>
          Próximos 7 dias • Total: R$ {totalVencimentos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : !vencimentos || vencimentos.length === 0 ? (
          <EmptyState
            icon={DollarSign}
            title="Nenhum vencimento próximo"
            description="Tudo em dia nos próximos 7 dias"
            className="py-4"
          />
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {vencimentos.map((vencimento: any) => {
              const status = getStatusVencimento(vencimento.dataVencimento);
              return (
                <div
                  key={`${vencimento.tipo}-${vencimento.id}`}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer",
                    status.urgent ? "border-destructive/50 bg-destructive/5 hover:bg-destructive/10" : "hover:bg-accent/50"
                  )}
                  onClick={() => navigate(vencimento.link)}
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      {status.urgent && <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />}
                      <span className="text-sm font-medium truncate">
                        {vencimento.descricao}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {vencimento.tipo} • Vence em {format(new Date(vencimento.dataVencimento), "dd/MMM", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-2">
                    <span className="text-sm font-bold whitespace-nowrap">
                      R$ {vencimento.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <Badge variant={status.variant} className="text-xs">
                      {status.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
