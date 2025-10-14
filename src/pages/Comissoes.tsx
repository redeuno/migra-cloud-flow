import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Calculator } from "lucide-react";
import { ComissoesTable } from "@/components/professores/ComissoesTable";
import { GerarComissoesDialog } from "@/components/professores/GerarComissoesDialog";

export default function Comissoes() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Comissões de Professores
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gerencie e pague as comissões dos professores
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Calculator className="mr-2 h-4 w-4" />
            Gerar Comissões
          </Button>
        </div>

        <ComissoesTable />
      </div>

      <GerarComissoesDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </Layout>
  );
}
