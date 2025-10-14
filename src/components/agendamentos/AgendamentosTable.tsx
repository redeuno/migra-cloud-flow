import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckinStatusBadge } from "./CheckinStatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AgendamentosTableProps {
  onEdit: (id: string) => void;
  onCheckin: (id: string) => void;
}

export function AgendamentosTable({ onEdit, onCheckin }: AgendamentosTableProps) {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: agendamentos, isLoading } = useQuery({
    queryKey: ["agendamentos-tabela"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agendamentos")
        .select(`
          *,
          quadras(nome, numero),
          usuarios!agendamentos_cliente_id_fkey(nome_completo)
        `)
        .order("data_agendamento", { ascending: false })
        .order("hora_inicio", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("agendamentos")
        .update({ status: "cancelado" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agendamentos-tabela"] });
      queryClient.invalidateQueries({ queryKey: ["agendamentos-calendario"] });
      toast.success("Agendamento cancelado com sucesso!");
      setDeleteId(null);
    },
    onError: () => {
      toast.error("Erro ao cancelar agendamento");
    },
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      confirmado: "default",
      pendente: "secondary",
      cancelado: "destructive",
    } as const;
    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {status}
      </Badge>
    );
  };

  const getStatusPagamentoBadge = (status: string) => {
    const variants = {
      pago: "default",
      pendente: "secondary",
      vencido: "destructive",
    } as const;
    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  const agendamentosFiltrados = agendamentos?.filter((ag) => {
    const matchSearch = ag.usuarios?.nome_completo
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === "all" || ag.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <>
      <div className="flex gap-4 mb-4">
        <Input
          placeholder="Buscar por cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="max-w-[200px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="confirmado">Confirmado</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Horário</TableHead>
              <TableHead>Quadra</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Modalidade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agendamentosFiltrados?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  Nenhum agendamento encontrado
                </TableCell>
              </TableRow>
            ) : (
              agendamentosFiltrados?.map((agendamento) => (
                <TableRow key={agendamento.id}>
                  <TableCell>
                    {format(new Date(agendamento.data_agendamento), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </TableCell>
                  <TableCell>
                    {agendamento.hora_inicio.substring(0, 5)} -{" "}
                    {agendamento.hora_fim.substring(0, 5)}
                  </TableCell>
                  <TableCell>
                    Quadra {agendamento.quadras?.numero}
                  </TableCell>
                  <TableCell>
                    {agendamento.usuarios?.nome_completo || "Sem cliente"}
                  </TableCell>
                  <TableCell className="capitalize">
                    {agendamento.modalidade.replace("_", " ")}
                  </TableCell>
                  <TableCell>{getStatusBadge(agendamento.status)}</TableCell>
                  <TableCell>
                    <CheckinStatusBadge
                      checkinRealizado={agendamento.checkin_realizado}
                      dataCheckin={agendamento.data_checkin}
                    />
                  </TableCell>
                  <TableCell>
                    {getStatusPagamentoBadge(agendamento.status_pagamento)}
                  </TableCell>
                  <TableCell>
                    R$ {Number(agendamento.valor_total).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {agendamento.status !== "cancelado" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onCheckin(agendamento.id)}
                            title="Check-in"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(agendamento.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(agendamento.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Agendamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar este agendamento? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              Sim, cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
