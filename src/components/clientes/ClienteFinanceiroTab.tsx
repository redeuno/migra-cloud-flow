import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Send } from "lucide-react";
import { format } from "date-fns";
import { ContratoDialog } from "../financeiro/ContratoDialog";
import { EnviarLinkPagamento } from "../financeiro/EnviarLinkPagamento";

interface ClienteFinanceiroTabProps {
  clienteId: string;
}

export function ClienteFinanceiroTab({ clienteId }: ClienteFinanceiroTabProps) {
  const [contratoDialogOpen, setContratoDialogOpen] = useState(false);
  const [linkPagamentoOpen, setLinkPagamentoOpen] = useState(false);
  const [selectedMensalidade, setSelectedMensalidade] = useState<any>(null);

  // Buscar contratos do cliente
  const { data: contratos, isLoading: loadingContratos } = useQuery({
    queryKey: ["contratos-cliente", clienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contratos")
        .select("*")
        .eq("usuario_id", clienteId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Buscar mensalidades pendentes do cliente
  const { data: mensalidades, isLoading: loadingMensalidades } = useQuery({
    queryKey: ["mensalidades-cliente", clienteId],
    queryFn: async () => {
      const contratoIds = contratos?.map((c) => c.id) || [];
      if (contratoIds.length === 0) return [];

      const { data, error } = await supabase
        .from("mensalidades")
        .select("*")
        .in("contrato_id", contratoIds)
        .eq("status_pagamento", "pendente")
        .order("data_vencimento", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!contratos && contratos.length > 0,
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      ativo: "default",
      cancelado: "destructive",
      suspenso: "secondary",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const handleEnviarLink = (mensalidade: any) => {
    setSelectedMensalidade(mensalidade);
    setLinkPagamentoOpen(true);
  };

  if (loadingContratos) {
    return <div className="p-4">Carregando dados financeiros...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Contratos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Contratos</CardTitle>
          <Button size="sm" onClick={() => setContratoDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Contrato
          </Button>
        </CardHeader>
        <CardContent>
          {contratos && contratos.length > 0 ? (
            <div className="space-y-4">
              {contratos.map((contrato) => (
                <div
                  key={contrato.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{contrato.numero_contrato}</p>
                    <p className="text-sm text-muted-foreground">
                      {contrato.tipo_contrato} - R$ {contrato.valor_mensal}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Início: {format(new Date(contrato.data_inicio), "dd/MM/yyyy")}
                    </p>
                  </div>
                  {getStatusBadge(contrato.status)}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum contrato cadastrado
            </p>
          )}
        </CardContent>
      </Card>

      {/* Mensalidades Pendentes */}
      <Card>
        <CardHeader>
          <CardTitle>Mensalidades Pendentes</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingMensalidades ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : mensalidades && mensalidades.length > 0 ? (
            <div className="space-y-4">
              {mensalidades.map((mensalidade) => (
                <div
                  key={mensalidade.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      R$ {mensalidade.valor_final || mensalidade.valor}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Vencimento:{" "}
                      {format(new Date(mensalidade.data_vencimento), "dd/MM/yyyy")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ref: {format(new Date(mensalidade.referencia), "MM/yyyy")}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEnviarLink(mensalidade)}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Link
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhuma mensalidade pendente
            </p>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ContratoDialog
        open={contratoDialogOpen}
        onOpenChange={setContratoDialogOpen}
        preSelectedUsuarioId={clienteId}
      />

      {selectedMensalidade && (
        <EnviarLinkPagamento
          open={linkPagamentoOpen}
          onOpenChange={setLinkPagamentoOpen}
          mensalidade={selectedMensalidade}
          clienteId={clienteId}
        />
      )}
    </div>
  );
}
