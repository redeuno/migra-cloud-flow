import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
            <TabsTrigger value="horarios">Horários</TabsTrigger>
            <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
            <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
          </TabsList>

          <TabsContent value="geral" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Em Construção</CardTitle>
                <CardDescription>
                  Esta seção está em desenvolvimento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Em breve você poderá configurar informações gerais da arena aqui.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="horarios" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Em Construção</CardTitle>
                <CardDescription>
                  Esta seção está em desenvolvimento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Em breve você poderá configurar horários de funcionamento aqui.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pagamentos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Em Construção</CardTitle>
                <CardDescription>
                  Esta seção está em desenvolvimento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Em breve você poderá configurar formas de pagamento aqui.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notificacoes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Em Construção</CardTitle>
                <CardDescription>
                  Esta seção está em desenvolvimento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Em breve você poderá configurar notificações aqui.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
