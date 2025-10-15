import { Layout } from "@/components/Layout";
import { PerfilAccessGuard } from "@/components/PerfilAccessGuard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RelatoriosFinanceiros } from "@/components/financeiro/RelatoriosFinanceiros";
import { RelatorioAgendamentos } from "@/components/relatorios/RelatorioAgendamentos";
import { RelatorioClientes } from "@/components/relatorios/RelatorioClientes";

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
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto">
              <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
              <TabsTrigger value="agendamentos">Agendamentos</TabsTrigger>
              <TabsTrigger value="clientes">Clientes</TabsTrigger>
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
          </Tabs>
        </div>
      </PerfilAccessGuard>
    </Layout>
  );
}
