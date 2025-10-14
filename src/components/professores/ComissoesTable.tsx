import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { DollarSign, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface ComissoesTableProps {
  professorId?: string;
}

export function ComissoesTable({ professorId }: ComissoesTableProps) {
  const { arenaId } = useAuth();
  const queryClient = useQueryClient();

  const { data: comissoes, isLoading } = useQuery({
    queryKey: ["comissoes", arenaId, professorId],
    queryFn: async () => {
      let query = supabase
        .from("comissoes_professores")
        .select(`
          *,
          professores (
            usuario_id,
            usuarios (nome_completo)
          )
        `)
        .eq("arena_id", arenaId)
        .order("referencia", { ascending: false });

      if (professorId) {
        query = query.eq("professor_id", professorId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!arenaId,
  });

  const marcarPagoMutation = useMutation({
    mutationFn: async (comissaoId: string) => {
      const { error } = await supabase
        .from("comissoes_professores")
        .update({
          status: "pago",
          data_pagamento: new Date().toISOString(),
        })
        .eq("id", comissaoId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comissoes"] });
      toast.success("Comissão marcada como paga!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao marcar comissão como paga");
    },
  });

  const cancelarMutation = useMutation({
    mutationFn: async (comissaoId: string) => {
      const { error } = await supabase
        .from("comissoes_professores")
        .update({ status: "cancelado" })
        .eq("id", comissaoId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comissoes"] });
      toast.success("Comissão cancelada!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao cancelar comissão");
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pago":
        return <Badge className="bg-green-100 text-green-700">Pago</Badge>;
      case "cancelado":
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!comissoes || comissoes.length === 0) {
    return (
      <EmptyState
        icon={DollarSign}
        title="Nenhuma comissão registrada"
        description="As comissões aparecerão aqui quando forem calculadas"
      />
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {!professorId && <TableHead>Professor</TableHead>}
            <TableHead>Referência</TableHead>
            <TableHead className="text-right">Valor Aulas</TableHead>
            <TableHead className="text-right">% Comissão</TableHead>
            <TableHead className="text-right">Valor Comissão</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data Pagamento</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {comissoes.map((comissao: any) => (
            <TableRow key={comissao.id}>
              {!professorId && (
                <TableCell className="font-medium">
                  {comissao.professores?.usuarios?.nome_completo || "N/A"}
                </TableCell>
              )}
              <TableCell>
                {format(new Date(comissao.referencia), "MMMM 'de' yyyy", {
                  locale: ptBR,
                })}
              </TableCell>
              <TableCell className="text-right">
                R$ {Number(comissao.valor_aulas).toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                {Number(comissao.percentual_comissao).toFixed(2)}%
              </TableCell>
              <TableCell className="text-right font-bold">
                R$ {Number(comissao.valor_comissao).toFixed(2)}
              </TableCell>
              <TableCell>{getStatusBadge(comissao.status)}</TableCell>
              <TableCell>
                {comissao.data_pagamento
                  ? format(new Date(comissao.data_pagamento), "dd/MM/yyyy", {
                      locale: ptBR,
                    })
                  : "-"}
              </TableCell>
              <TableCell className="text-right">
                {comissao.status === "pendente" && (
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => marcarPagoMutation.mutate(comissao.id)}
                      disabled={marcarPagoMutation.isPending}
                    >
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Pagar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => cancelarMutation.mutate(comissao.id)}
                      disabled={cancelarMutation.isPending}
                    >
                      <XCircle className="mr-1 h-3 w-3" />
                      Cancelar
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
