import { Layout } from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfiguracoesEvolution } from "@/components/configuracoes/ConfiguracoesEvolution";
import { ConfiguracoesGerais } from "@/components/configuracoes/ConfiguracoesGerais";
import { ConfiguracoesHorarios } from "@/components/configuracoes/ConfiguracoesHorarios";
import { ConfiguracoesPagamentos } from "@/components/configuracoes/ConfiguracoesPagamentos";
import { ModulosArenaManager } from "@/components/configuracoes/ModulosArenaManager";

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
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            <TabsTrigger value="geral">Geral</TabsTrigger>
            <TabsTrigger value="modulos">Módulos</TabsTrigger>
            <TabsTrigger value="evolution">Evolution</TabsTrigger>
            <TabsTrigger value="horarios">Horários</TabsTrigger>
            <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
          </TabsList>

          <TabsContent value="geral" className="space-y-4">
            <ConfiguracoesGerais />
          </TabsContent>

          <TabsContent value="modulos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Módulos Disponíveis</CardTitle>
                <CardDescription>
                  Ative ou desative funcionalidades conforme seu plano permite
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ModulosArenaManager />
              </CardContent>
            </Card>
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
