import { useState } from "react";
import { Layout } from "@/components/Layout";
import { PerfilAccessGuard } from "@/components/PerfilAccessGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { ProfessoresTable } from "@/components/professores/ProfessoresTable";
import { ProfessorDialog } from "@/components/professores/ProfessorDialog";

export default function Professores() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [professorSelecionado, setProfessorSelecionado] = useState<any>(null);
  const [busca, setBusca] = useState("");

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
      <PerfilAccessGuard allowedRoles={["arena_admin", "funcionario"]}>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Professores
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Gerencie os professores da arena
              </p>
            </div>
            <Button onClick={handleNew}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Professor
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar professor..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <ProfessoresTable onEdit={handleEdit} />
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
