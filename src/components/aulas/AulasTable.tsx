import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Edit, Trash2, Users, Clock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
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

interface AulasTableProps {
  onEdit: (aulaId: string) => void;
  onPresenca: (aulaId: string) => void;
}

export function AulasTable({ onEdit, onPresenca }: AulasTableProps) {
  const { arenaId } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [aulaToDelete, setAulaToDelete] = useState<string>();

  const { data: aulas, isLoading } = useQuery({
    queryKey: ["aulas", arenaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aulas")
        .select(`
          *,
          professores!aulas_professor_id_fkey(
            usuarios(nome_completo)
          ),
          quadras(nome, numero)
        `)
        .eq("arena_id", arenaId)
        .order("data_aula", { ascending: false })
        .order("hora_inicio", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!arenaId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (aulaId: string) => {
      const { error } = await supabase.from("aulas").delete().eq("id", aulaId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aulas"] });
      toast({ title: "Aula excluída com sucesso" });
      setDeleteDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Erro ao excluir aula", variant: "destructive" });
    },
  });

  const handleDelete = (aulaId: string) => {
    setAulaToDelete(aulaId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (aulaToDelete) {
      deleteMutation.mutate(aulaToDelete);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      agendada: "bg-blue-500/20 text-blue-700 border-blue-500/30",
      confirmada: "bg-green-500/20 text-green-700 border-green-500/30",
      em_andamento: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
      realizada: "bg-gray-500/20 text-gray-700 border-gray-500/30",
      cancelada: "bg-red-500/20 text-red-700 border-red-500/30",
    };
    return colors[status as keyof typeof colors] || "";
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!aulas || aulas.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Nenhuma aula cadastrada</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Professor</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Alunos</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {aulas.map((aula) => {
              const inscritos = (aula.presencas as any[])?.length || 0;
              
              return (
                <TableRow key={aula.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {format(new Date(aula.data_aula), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {aula.hora_inicio.substring(0, 5)} - {aula.hora_fim.substring(0, 5)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{aula.titulo}</span>
                      {aula.quadras && (
                        <span className="text-xs text-muted-foreground">
                          Quadra {aula.quadras.numero}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {aula.professores?.usuarios?.nome_completo}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{aula.tipo_aula}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {inscritos}/{aula.max_alunos}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    R$ {Number(aula.valor_por_aluno).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(aula.status || "agendada")}>
                      {aula.status || "agendada"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/aulas/${aula.id}/presencas`)}
                        title="Gerenciar Presença"
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(aula.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(aula.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta aula? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
