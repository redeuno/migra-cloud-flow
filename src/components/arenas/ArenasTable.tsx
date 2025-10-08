import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  DollarSign, 
  Ban, 
  CheckCircle, 
  MessageSquare 
} from "lucide-react";
import { ArenaDialog } from "./ArenaDialog";

interface ArenasTableProps {
  arenas: any[];
}

const statusMap = {
  ativo: { label: "Ativo", variant: "default" as const },
  inativo: { label: "Inativo", variant: "secondary" as const },
  suspenso: { label: "Suspenso", variant: "destructive" as const },
};

export function ArenasTable({ arenas }: ArenasTableProps) {
  const navigate = useNavigate();
  const [editingArena, setEditingArena] = useState<any>(null);
  const [deletingArena, setDeletingArena] = useState<any>(null);
  const queryClient = useQueryClient();

  // Links Asaas para planos das arenas
  const PLANO_99_LINK = "https://sandbox.asaas.com/c/nd1qxtj1f6wjtvnl";
  const PLANO_199_LINK = "https://sandbox.asaas.com/c/mwvtodyu3tyrekis";
  const PLANO_299_LINK = "https://sandbox.asaas.com/c/mvzdo94e7ou5j1gy";

  const deleteMutation = useMutation({
    mutationFn: async (arenaId: string) => {
      const { error } = await supabase
        .from("arenas")
        .delete()
        .eq("id", arenaId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["arenas"] });
      toast.success("Arena excluída com sucesso!");
      setDeletingArena(null);
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir: ${error.message}`);
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: 'ativo' | 'suspenso' }) => {
      const { error } = await supabase
        .from("arenas")
        .update({ status: newStatus })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["arenas"] });
      toast.success(
        variables.newStatus === 'suspenso' 
          ? "Acesso suspenso com sucesso!" 
          : "Acesso reativado com sucesso!"
      );
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    },
  });

  const handleEnviarPlanoWhatsApp = (arena: any, planoNome: string, planoLink: string) => {
    const mensagem = `Olá ${arena.nome}! Aqui está o link para pagamento do Plano ${planoNome}: ${planoLink}`;
    const whatsappNum = arena.whatsapp?.replace(/\D/g, '');
    window.open(`https://wa.me/${whatsappNum}?text=${encodeURIComponent(mensagem)}`, '_blank');
    toast.success("WhatsApp aberto!");
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>CNPJ</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {arenas.map((arena) => (
            <TableRow key={arena.id}>
              <TableCell className="font-medium">{arena.nome}</TableCell>
              <TableCell>{arena.cnpj}</TableCell>
              <TableCell>{arena.email}</TableCell>
              <TableCell>{arena.telefone}</TableCell>
              <TableCell>
                <Badge variant={statusMap[arena.status as keyof typeof statusMap].variant}>
                  {statusMap[arena.status as keyof typeof statusMap].label}
                </Badge>
              </TableCell>
              <TableCell>
                {new Date(arena.data_vencimento).toLocaleDateString("pt-BR")}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={() => navigate(`/financeiro?arena=${arena.id}&tab=assinaturas`)}>
                        <DollarSign className="mr-2 h-4 w-4" />
                        Financeiro da Arena
                      </DropdownMenuItem>
                      
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <DollarSign className="mr-2 h-4 w-4" />
                          Cobrar plano
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem onClick={() => window.open(PLANO_99_LINK, '_blank')}>
                            Plano R$ 99
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEnviarPlanoWhatsApp(arena, "R$ 99", PLANO_99_LINK)}>
                            <MessageSquare className="mr-2 h-3 w-3" />
                            Enviar R$ 99 (WhatsApp)
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => window.open(PLANO_199_LINK, '_blank')}>
                            Plano R$ 199
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEnviarPlanoWhatsApp(arena, "R$ 199", PLANO_199_LINK)}>
                            <MessageSquare className="mr-2 h-3 w-3" />
                            Enviar R$ 199 (WhatsApp)
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => window.open(PLANO_299_LINK, '_blank')}>
                            Plano R$ 299
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEnviarPlanoWhatsApp(arena, "R$ 299", PLANO_299_LINK)}>
                            <MessageSquare className="mr-2 h-3 w-3" />
                            Enviar R$ 299 (WhatsApp)
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>

                      <DropdownMenuSeparator />
                      
                      {arena.status === 'ativo' ? (
                        <DropdownMenuItem 
                          onClick={() => toggleStatusMutation.mutate({ id: arena.id, newStatus: 'suspenso' })}
                          className="text-orange-600"
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          Suspender acesso
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem 
                          onClick={() => toggleStatusMutation.mutate({ id: arena.id, newStatus: 'ativo' })}
                          className="text-green-600"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Reativar acesso
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem onClick={() => setEditingArena(arena)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeletingArena(arena)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ArenaDialog
        open={!!editingArena}
        onOpenChange={(open) => !open && setEditingArena(null)}
        arena={editingArena}
      />

      <AlertDialog open={!!deletingArena} onOpenChange={() => setDeletingArena(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a arena "{deletingArena?.nome}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deletingArena.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
