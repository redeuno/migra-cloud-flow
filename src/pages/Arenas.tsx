import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search } from "lucide-react";
import { ArenasTable } from "@/components/arenas/ArenasTable";
import { ArenaDialog } from "@/components/arenas/ArenaDialog";
import { EmptyState } from "@/components/EmptyState";

export default function Arenas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: arenas, isLoading } = useQuery({
    queryKey: ["arenas", searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("arenas")
        .select("*")
        .order("nome");

      if (searchTerm) {
        query = query.or(`nome.ilike.%${searchTerm}%,cnpj.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Arenas</h1>
            <p className="text-muted-foreground">
              Gerencie todas as arenas do sistema
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Arena
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Arenas</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou CNPJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : arenas && arenas.length > 0 ? (
              <ArenasTable arenas={arenas} />
            ) : (
              <EmptyState
                icon={Plus}
                title="Nenhuma arena cadastrada"
                description="Comece criando sua primeira arena"
                action={{
                  label: "Nova Arena",
                  onClick: () => setDialogOpen(true)
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <ArenaDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </Layout>
  );
}
