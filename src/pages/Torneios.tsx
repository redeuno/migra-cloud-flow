import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TorneioDialog } from "@/components/torneios/TorneioDialog";
import { TorneiosTable } from "@/components/torneios/TorneiosTable";

export default function Torneios() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Torneios</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gerencie os torneios e competições
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Novo Torneio
          </Button>
        </div>

        <TorneiosTable />
      </div>

      <TorneioDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
      />
    </Layout>
  );
}
