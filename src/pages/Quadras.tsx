import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { QuadrasTable } from "@/components/quadras/QuadrasTable";
import { QuadraDialog } from "@/components/quadras/QuadraDialog";

export default function Quadras() {
  const { arenaId } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: quadras, isLoading } = useQuery({
    queryKey: ["quadras", arenaId, searchTerm],
    queryFn: async () => {
      if (!arenaId) return [];

      let query = supabase
        .from("quadras")
        .select("*")
        .eq("arena_id", arenaId)
        .order("numero", { ascending: true });

      if (searchTerm) {
        query = query.or(`nome.ilike.%${searchTerm}%,numero.eq.${searchTerm}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!arenaId,
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Quadras</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gerencie as quadras da sua arena
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Nova Quadra
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Listagem de Quadras</CardTitle>
            <CardDescription>
              Visualize e gerencie todas as quadras cadastradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou número..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : quadras && quadras.length > 0 ? (
              <QuadrasTable quadras={quadras} />
            ) : (
              <EmptyState
                icon={Plus}
                title="Nenhuma quadra encontrada"
                description={
                  searchTerm
                    ? "Tente buscar com outros termos"
                    : "Comece cadastrando sua primeira quadra"
                }
                action={
                  !searchTerm
                    ? {
                        label: "Nova Quadra",
                        onClick: () => setDialogOpen(true),
                      }
                    : undefined
                }
              />
            )}
          </CardContent>
        </Card>
      </div>

      <QuadraDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </Layout>
  );
}
