import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Users } from "lucide-react";
import { ClientesTable } from "@/components/clientes/ClientesTable";
import { ClienteDialog } from "@/components/clientes/ClienteDialog";
import { EmptyState } from "@/components/EmptyState";

export default function Clientes() {
  const { arenaId } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: clientes, isLoading } = useQuery({
    queryKey: ["clientes", arenaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("arena_id", arenaId)
        .eq("tipo_usuario", "aluno")
        .order("nome_completo", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!arenaId,
  });

  const filteredClientes = clientes?.filter((cliente) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      cliente.nome_completo?.toLowerCase().includes(searchLower) ||
      cliente.email?.toLowerCase().includes(searchLower) ||
      cliente.cpf?.includes(searchTerm)
    );
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Alunos / Clientes</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gerencie os alunos e clientes cadastrados
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : !filteredClientes || filteredClientes.length === 0 ? (
          <EmptyState
            icon={Users}
            title={searchTerm ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
            description={
              searchTerm
                ? "Tente ajustar os filtros de busca"
                : "Comece cadastrando seu primeiro cliente"
            }
            action={
              !searchTerm
                ? {
                    label: "Cadastrar Cliente",
                    onClick: () => setDialogOpen(true),
                  }
                : undefined
            }
          />
        ) : (
          <ClientesTable clientes={filteredClientes} />
        )}

        <ClienteDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </div>
    </Layout>
  );
}
