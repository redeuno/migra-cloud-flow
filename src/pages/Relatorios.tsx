import { Layout } from "@/components/Layout";
import { PerfilAccessGuard } from "@/components/PerfilAccessGuard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RelatoriosFinanceiros } from "@/components/financeiro/RelatoriosFinanceiros";
import { RelatorioAgendamentos } from "@/components/relatorios/RelatorioAgendamentos";
import { RelatorioClientes } from "@/components/relatorios/RelatorioClientes";
import { RelatorioProfessores } from "@/components/relatorios/RelatorioProfessores";
import { RelatorioQuadras } from "@/components/relatorios/RelatorioQuadras";
import { RelatorioRetencao } from "@/components/relatorios/RelatorioRetencao";

export default function Relatorios() {
  return (
    <Layout>
      <PerfilAccessGuard allowedRoles={["arena_admin", "funcionario"]}>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Relatórios</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Visualize estatísticas e indicadores do seu negócio
            </p>
          </div>

          <Tabs defaultValue="financeiro" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 h-auto">
              <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
              <TabsTrigger value="agendamentos">Agendamentos</TabsTrigger>
              <TabsTrigger value="clientes">Clientes</TabsTrigger>
              <TabsTrigger value="professores">Professores</TabsTrigger>
              <TabsTrigger value="quadras">Quadras</TabsTrigger>
              <TabsTrigger value="retencao">Retenção</TabsTrigger>
            </TabsList>

            <TabsContent value="financeiro" className="space-y-4">
              <RelatoriosFinanceiros />
            </TabsContent>

            <TabsContent value="agendamentos" className="space-y-4">
              <RelatorioAgendamentos />
            </TabsContent>

            <TabsContent value="clientes" className="space-y-4">
              <RelatorioClientes />
            </TabsContent>

            <TabsContent value="professores" className="space-y-4">
              <RelatorioProfessores />
            </TabsContent>

            <TabsContent value="quadras" className="space-y-4">
              <RelatorioQuadras />
            </TabsContent>

            <TabsContent value="retencao" className="space-y-4">
              <RelatorioRetencao />
            </TabsContent>
          </Tabs>
        </div>
      </PerfilAccessGuard>
    </Layout>
  );
}
