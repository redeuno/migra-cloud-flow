import { Layout } from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfiguracoesEvolution } from "@/components/configuracoes/ConfiguracoesEvolution";
import { ConfiguracoesGerais } from "@/components/configuracoes/ConfiguracoesGerais";
import { ConfiguracoesHorarios } from "@/components/configuracoes/ConfiguracoesHorarios";
import { ConfiguracoesPagamentos } from "@/components/configuracoes/ConfiguracoesPagamentos";

export default function Configuracoes() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações da arena
          </p>
        </div>

        <Tabs defaultValue="geral" className="space-y-4">
          <TabsList>
            <TabsTrigger value="geral">Geral</TabsTrigger>
            <TabsTrigger value="evolution">Evolution API</TabsTrigger>
            <TabsTrigger value="horarios">Horários</TabsTrigger>
            <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
          </TabsList>

          <TabsContent value="geral" className="space-y-4">
            <ConfiguracoesGerais />
          </TabsContent>

          <TabsContent value="evolution" className="space-y-4">
            <ConfiguracoesEvolution />
          </TabsContent>

          <TabsContent value="horarios" className="space-y-4">
            <ConfiguracoesHorarios />
          </TabsContent>

          <TabsContent value="pagamentos" className="space-y-4">
            <ConfiguracoesPagamentos />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
