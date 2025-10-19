import { useState } from "react";
import { Layout } from "@/components/Layout";
import { PerfilAccessGuard } from "@/components/PerfilAccessGuard";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfessoresTable } from "@/components/professores/ProfessoresTable";
import { ProfessorDialog } from "@/components/professores/ProfessorDialog";
import { VinculosProfessorAlunoManager } from "@/components/professores/VinculosProfessorAlunoManager";

export default function Professores() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [professorSelecionado, setProfessorSelecionado] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleEdit = (professor: any) => {
    setProfessorSelecionado(professor);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setProfessorSelecionado(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setProfessorSelecionado(null);
    }
  };

  return (
    <Layout>
      <PerfilAccessGuard allowedRoles={["arena_admin"]}>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Professores
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Gerencie os professores e seus alunos
              </p>
            </div>
            <Button onClick={handleNew}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Professor
            </Button>
          </div>

          <Tabs defaultValue="lista" className="space-y-6">
            <TabsList>
              <TabsTrigger value="lista">Professores</TabsTrigger>
              <TabsTrigger value="vinculos">Vínculos Professor-Aluno</TabsTrigger>
            </TabsList>

            <TabsContent value="lista" className="space-y-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar professores..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <ProfessoresTable onEdit={handleEdit} />
            </TabsContent>

            <TabsContent value="vinculos">
              <VinculosProfessorAlunoManager />
            </TabsContent>
          </Tabs>
        </div>

        <ProfessorDialog
          open={dialogOpen}
          onOpenChange={handleCloseDialog}
          professor={professorSelecionado}
        />
      </PerfilAccessGuard>
    </Layout>
  );
}
