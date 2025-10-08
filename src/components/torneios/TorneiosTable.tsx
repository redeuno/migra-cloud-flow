import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function TorneiosTable() {
  const { arenaId } = useAuth();

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

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!torneios || torneios.length === 0) {
    return <div className="text-center py-12 text-muted-foreground">Nenhum torneio cadastrado</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Modalidade</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {torneios.map((torneio) => (
          <TableRow key={torneio.id}>
            <TableCell>{torneio.nome}</TableCell>
            <TableCell>{torneio.modalidade}</TableCell>
            <TableCell>
              <Badge>{torneio.status}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
