import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { PlanosSistemaTable } from "@/components/configuracoes/PlanosSistemaTable";
import { PlanoDialog } from "@/components/configuracoes/PlanoDialog";
import { ModulosSistemaTable } from "@/components/configuracoes/ModulosSistemaTable";
import { ModuloDialog } from "@/components/configuracoes/ModuloDialog";

export default function ConfiguracoesSistema() {
  const [planoDialogOpen, setPlanoDialogOpen] = useState(false);
  const [moduloDialogOpen, setModuloDialogOpen] = useState(false);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Configurações do Sistema
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Gerencie planos, módulos e configurações globais do sistema
            </p>
          </div>
        </div>

        <Tabs defaultValue="planos" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="planos">Planos</TabsTrigger>
            <TabsTrigger value="modulos">Módulos</TabsTrigger>
            <TabsTrigger value="categorias">Categorias</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          {/* Tab Planos do Sistema */}
          <TabsContent value="planos" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Planos do Sistema</CardTitle>
                    <CardDescription>
                      Configure os planos de assinatura disponíveis para as arenas
                    </CardDescription>
                  </div>
                  <Button onClick={() => setPlanoDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Plano
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <PlanosSistemaTable />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Módulos */}
          <TabsContent value="modulos" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Módulos do Sistema</CardTitle>
                    <CardDescription>
                      Gerencie os módulos disponíveis no sistema
                    </CardDescription>
                  </div>
                  <Button onClick={() => setModuloDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Módulo
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ModulosSistemaTable />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Categorias */}
          <TabsContent value="categorias" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Categorias Financeiras</CardTitle>
                <CardDescription>
                  Em desenvolvimento - Configure as categorias para movimentações financeiras
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-12 text-muted-foreground">
                🚧 Esta funcionalidade será implementada em breve
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Templates */}
          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Templates de Notificações</CardTitle>
                <CardDescription>
                  Em desenvolvimento - Configure templates para mensagens e notificações
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-12 text-muted-foreground">
                🚧 Esta funcionalidade será implementada em breve
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <PlanoDialog open={planoDialogOpen} onOpenChange={setPlanoDialogOpen} />
        <ModuloDialog open={moduloDialogOpen} onOpenChange={setModuloDialogOpen} />
      </div>
    </Layout>
  );
}
