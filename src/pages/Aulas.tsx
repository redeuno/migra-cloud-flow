import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AulaDialog } from "@/components/aulas/AulaDialog";
import { AulasTable } from "@/components/aulas/AulasTable";
import { AulaPresencaDialog } from "@/components/aulas/AulaPresencaDialog";

export default function Aulas() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [presencaDialogOpen, setPresencaDialogOpen] = useState(false);
  const [selectedAulaId, setSelectedAulaId] = useState<string>();

  const handleNew = () => {
    setSelectedAulaId(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (aulaId: string) => {
    setSelectedAulaId(aulaId);
    setDialogOpen(true);
  };

  const handlePresenca = (aulaId: string) => {
    setSelectedAulaId(aulaId);
    setPresencaDialogOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Aulas</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gerencie as aulas e professores
            </p>
          </div>
          <Button onClick={handleNew} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Nova Aula
          </Button>
        </div>

        <AulasTable onEdit={handleEdit} onPresenca={handlePresenca} />
      </div>

      <AulaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        aulaId={selectedAulaId}
      />

      {selectedAulaId && (
        <AulaPresencaDialog
          open={presencaDialogOpen}
          onOpenChange={setPresencaDialogOpen}
          aulaId={selectedAulaId}
        />
      )}
    </Layout>
  );
}
