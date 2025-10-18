import { useState } from "react";
import { Layout } from "@/components/Layout";
import { PerfilAccessGuard } from "@/components/PerfilAccessGuard";
import { Button } from "@/components/ui/button";
import { Calculator } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ComissoesTable } from "@/components/professores/ComissoesTable";
import { GerarComissoesDialog } from "@/components/professores/GerarComissoesDialog";
import { AvaliacoesProfessoresTable } from "@/components/professores/AvaliacoesProfessoresTable";

export default function Comissoes() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <Layout>
      <PerfilAccessGuard allowedRoles={["arena_admin", "professor"]}>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Gestão de Professores
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Gerencie comissões e avaliações dos professores
              </p>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <Calculator className="mr-2 h-4 w-4" />
              Gerar Comissões
            </Button>
          </div>

          <Tabs defaultValue="comissoes" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="comissoes">Comissões</TabsTrigger>
              <TabsTrigger value="avaliacoes">Avaliações</TabsTrigger>
            </TabsList>

            <TabsContent value="comissoes">
              <ComissoesTable />
            </TabsContent>

            <TabsContent value="avaliacoes">
              <AvaliacoesProfessoresTable />
            </TabsContent>
          </Tabs>
        </div>

        <GerarComissoesDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </PerfilAccessGuard>
    </Layout>
  );
}
