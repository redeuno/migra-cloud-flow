import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { PerfilAccessGuard } from "@/components/PerfilAccessGuard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, GraduationCap, Calendar, TrendingUp } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";

export default function MeusAlunos() {
  const { user } = useAuth();

  // Buscar alunos vinculados ao professor
  const { data: alunos, isLoading } = useQuery({
    queryKey: ["meus-alunos", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professor_alunos")
        .select(`
          id,
          data_vinculo,
          ativo,
          observacoes,
          usuarios!professor_alunos_aluno_id_fkey (
            id,
            nome_completo,
            email,
            telefone,
            status
          )
        `)
        .eq("ativo", true)
        .order("data_vinculo", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Estatísticas
  const stats = {
    total: alunos?.length || 0,
    ativos: alunos?.filter((a) => a.usuarios?.status === "ativo").length || 0,
  };

  return (
    <Layout>
      <PerfilAccessGuard allowedRoles={["professor"]}>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Meus Alunos</h1>
            <p className="text-muted-foreground">
              Gerencie os alunos vinculados a você
            </p>
          </div>

          {/* Cards de Estatísticas */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total de Alunos
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Alunos Ativos
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.ativos}</div>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Alunos */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Alunos</CardTitle>
              <CardDescription>
                Alunos atualmente vinculados a você
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : !alunos || alunos.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="Nenhum aluno vinculado"
                  description="Você ainda não possui alunos vinculados. Entre em contato com a administração da arena."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Vinculado desde</TableHead>
                      <TableHead>Observações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alunos.map((vinculo) => (
                      <TableRow key={vinculo.id}>
                        <TableCell className="font-medium">
                          {vinculo.usuarios?.nome_completo || "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{vinculo.usuarios?.email}</div>
                            {vinculo.usuarios?.telefone && (
                              <div className="text-muted-foreground">
                                {vinculo.usuarios.telefone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              vinculo.usuarios?.status === "ativo"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {vinculo.usuarios?.status || "inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(vinculo.data_vinculo).toLocaleDateString(
                            "pt-BR"
                          )}
                        </TableCell>
                        <TableCell>
                          {vinculo.observacoes || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </PerfilAccessGuard>
    </Layout>
  );
}
