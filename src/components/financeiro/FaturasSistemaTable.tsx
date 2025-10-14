import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { ExternalLink, Copy, QrCode, FileText } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function FaturasSistemaTable() {
  const { data: faturas, isLoading } = useQuery({
    queryKey: ["faturas-sistema"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faturas_sistema")
        .select(`
          *,
          arenas(id, nome, email),
          assinaturas_arena(numero_assinatura)
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive", label: string }> = {
      pendente: { variant: "secondary", label: "Pendente" },
      pago: { variant: "default", label: "Pago" },
      vencido: { variant: "destructive", label: "Vencido" },
      cancelado: { variant: "destructive", label: "Cancelado" },
    };
    const config = variants[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const copiarLinha = (texto: string) => {
    navigator.clipboard.writeText(texto);
    toast.success("Código copiado!");
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[120px]">Número</TableHead>
            <TableHead className="min-w-[150px]">Arena</TableHead>
            <TableHead className="min-w-[100px]">Competência</TableHead>
            <TableHead className="min-w-[110px]">Vencimento</TableHead>
            <TableHead className="min-w-[100px]">Valor</TableHead>
            <TableHead className="min-w-[90px]">Status</TableHead>
            <TableHead className="min-w-[120px]">Pagamento</TableHead>
            <TableHead className="w-[150px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {faturas?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8}>
                <EmptyState
                  icon={FileText}
                  title="Nenhuma fatura encontrada"
                  description="Ainda não há faturas geradas no sistema. As faturas serão criadas automaticamente com base nas assinaturas ativas."
                />
              </TableCell>
            </TableRow>
          ) : (
            faturas?.map((fatura) => (
              <TableRow key={fatura.id}>
                <TableCell className="font-mono text-sm">
                  {fatura.numero_fatura}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{fatura.arenas?.nome || "Arena não encontrada"}</p>
                    <p className="text-sm text-muted-foreground">{fatura.arenas?.email || "-"}</p>
                  </div>
                </TableCell>
                <TableCell>
                  {format(new Date(fatura.competencia), "MM/yyyy", { locale: ptBR })}
                </TableCell>
                <TableCell>
                  {format(new Date(fatura.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                </TableCell>
                <TableCell className="font-semibold">
                  R$ {Number(fatura.valor).toFixed(2)}
                </TableCell>
                <TableCell>{getStatusBadge(fatura.status_pagamento)}</TableCell>
                <TableCell>
                  {fatura.data_pagamento ? (
                    <div className="text-sm">
                      <p>{format(new Date(fatura.data_pagamento), "dd/MM/yyyy", { locale: ptBR })}</p>
                      <p className="text-muted-foreground capitalize">{fatura.forma_pagamento}</p>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {fatura.asaas_invoice_url && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(fatura.asaas_invoice_url, "_blank")}
                        title="Abrir fatura"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    {fatura.linha_digitavel && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copiarLinha(fatura.linha_digitavel)}
                        title="Copiar linha digitável"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                    {fatura.qr_code_pix && (
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Ver QR Code PIX"
                      >
                        <QrCode className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
