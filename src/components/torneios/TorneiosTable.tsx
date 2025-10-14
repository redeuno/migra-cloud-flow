import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MoreHorizontal, Users, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import { TorneioDialog } from "./TorneioDialog";

export function TorneiosTable() {
  const { arenaId } = useAuth();
  const queryClient = useQueryClient();
  const [inscricoesDialogOpen, setInscricoesDialogOpen] = useState(false);
  const [selectedTorneio, setSelectedTorneio] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [torneioToEdit, setTorneioToEdit] = useState<string | null>(null);
  const [torneioToDelete, setTorneioToDelete] = useState<{ id: string; nome: string } | null>(null);

  const { data: torneios, isLoading } = useQuery({
    queryKey: ["torneios", arenaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("torneios")
        .select("*")
        .eq("arena_id", arenaId)
        .order("data_inicio", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!arenaId,
  });

  const { data: inscricoes } = useQuery({
    queryKey: ["torneio-inscricoes", selectedTorneio?.id],
    queryFn: async () => {
      if (!selectedTorneio?.id) return [];
      
      const { data, error } = await supabase
        .from("torneios_inscricoes")
        .select(`
          *,
          usuarios!torneios_inscricoes_usuario_id_fkey(nome_completo, email, whatsapp),
          parceiro:parceiro_id(nome_completo, email)
        `)
        .eq("torneio_id", selectedTorneio.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedTorneio?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (torneioId: string) => {
      const { error } = await supabase
        .from("torneios")
        .delete()
        .eq("id", torneioId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["torneios"] });
      toast({ title: "Torneio excluído com sucesso!" });
      setDeleteDialogOpen(false);
      setTorneioToDelete(null);
    },
    onError: () => {
      toast({ 
        title: "Erro ao excluir torneio",
        description: "Verifique se não há inscrições vinculadas",
        variant: "destructive" 
      });
    },
  });

  const handleVerInscricoes = (torneio: any) => {
    setSelectedTorneio(torneio);
    setInscricoesDialogOpen(true);
  };

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!torneios || torneios.length === 0) {
    return <div className="text-center py-12 text-muted-foreground">Nenhum torneio cadastrado</div>;
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Modalidade</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {torneios.map((torneio) => (
            <TableRow key={torneio.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{torneio.nome}</span>
                  {torneio.descricao && (
                    <span className="text-xs text-muted-foreground">{torneio.descricao.substring(0, 50)}...</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{torneio.modalidade}</Badge>
              </TableCell>
              <TableCell>
                {format(new Date(torneio.data_inicio), "dd/MM/yy", { locale: ptBR })} - {format(new Date(torneio.data_fim), "dd/MM/yy", { locale: ptBR })}
              </TableCell>
              <TableCell>
                <Badge>{torneio.status}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleVerInscricoes(torneio)}>
                      <Users className="mr-2 h-4 w-4" />
                      Ver Inscrições
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setTorneioToEdit(torneio.id);
                        setEditDialogOpen(true);
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => {
                        setTorneioToDelete({ id: torneio.id, nome: torneio.nome });
                        setDeleteDialogOpen(true);
                      }}
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

      {/* Dialog de Inscrições */}
      <Dialog open={inscricoesDialogOpen} onOpenChange={setInscricoesDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Inscrições - {selectedTorneio?.nome}</DialogTitle>
            <DialogDescription>
              Lista de participantes inscritos no torneio
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[400px] overflow-y-auto">
            {!inscricoes || inscricoes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma inscrição ainda
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Jogador</TableHead>
                    <TableHead>Parceiro</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inscricoes.map((inscricao: any) => (
                    <TableRow key={inscricao.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{inscricao.usuarios?.nome_completo}</p>
                          <p className="text-xs text-muted-foreground">{inscricao.usuarios?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {inscricao.parceiro ? inscricao.parceiro.nome_completo : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={inscricao.status_pagamento === "pago" ? "default" : "secondary"}>
                          {inscricao.status_pagamento}
                        </Badge>
                      </TableCell>
                      <TableCell>R$ {Number(inscricao.valor_pago).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição */}
      <TorneioDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setTorneioToEdit(null);
        }}
        torneioId={torneioToEdit || undefined}
      />

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o torneio <strong>"{torneioToDelete?.nome}"</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTorneioToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => torneioToDelete && deleteMutation.mutate(torneioToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
