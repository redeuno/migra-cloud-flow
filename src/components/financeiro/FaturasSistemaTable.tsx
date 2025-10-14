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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, ExternalLink, Copy, QrCode, FileText, MessageSquare } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FaturasSistemaTableProps {
  arenaFilter?: string;
  assinaturaFilter?: string;
}

export function FaturasSistemaTable({ arenaFilter, assinaturaFilter }: FaturasSistemaTableProps) {
  const { data: faturas, isLoading } = useQuery({
    queryKey: ["faturas-sistema", arenaFilter, assinaturaFilter],
    queryFn: async () => {
      let query = supabase
        .from("faturas_sistema")
        .select(`
          *,
          arenas(id, nome, email),
          assinaturas_arena(numero_assinatura)
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (assinaturaFilter) {
        query = query.eq("assinatura_arena_id", assinaturaFilter);
      } else if (arenaFilter && arenaFilter !== "all") {
        query = query.eq("arena_id", arenaFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const copiarLinhaDigitavel = (linha: string) => {
    navigator.clipboard.writeText(linha);
    toast.success("Linha digitável copiada!");
  };

  const copiarPixCopyPaste = (pix: string) => {
    navigator.clipboard.writeText(pix);
    toast.success("Código PIX copiado!");
  };

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
    <div className="rounded-md border">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[100px]">Número</TableHead>
              <TableHead className="min-w-[120px]">Arena</TableHead>
              <TableHead className="hidden md:table-cell min-w-[90px]">Comp.</TableHead>
              <TableHead className="hidden sm:table-cell min-w-[90px]">Venc.</TableHead>
              <TableHead className="min-w-[90px]">Valor</TableHead>
              <TableHead className="min-w-[80px]">Status</TableHead>
              <TableHead className="hidden lg:table-cell min-w-[100px]">Pagamento</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
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
                  <TableCell className="hidden md:table-cell">
                    {format(new Date(fatura.competencia), "MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {format(new Date(fatura.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="font-semibold">
                    R$ {Number(fatura.valor).toFixed(2)}
                  </TableCell>
                  <TableCell>{getStatusBadge(fatura.status_pagamento)}</TableCell>
                  <TableCell className="hidden lg:table-cell">
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {fatura.asaas_invoice_url && (
                          <DropdownMenuItem onClick={() => window.open(fatura.asaas_invoice_url!, "_blank")}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Abrir Fatura Asaas
                          </DropdownMenuItem>
                        )}
                        {fatura.linha_digitavel && (
                          <DropdownMenuItem onClick={() => copiarLinhaDigitavel(fatura.linha_digitavel!)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copiar Linha Digitável
                          </DropdownMenuItem>
                        )}
                        {fatura.pix_copy_paste && (
                          <DropdownMenuItem onClick={() => copiarPixCopyPaste(fatura.pix_copy_paste!)}>
                            <QrCode className="mr-2 h-4 w-4" />
                            Copiar Código PIX
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Enviar via WhatsApp
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
