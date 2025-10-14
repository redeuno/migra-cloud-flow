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
import { CategoriasSistemaTable } from "@/components/configuracoes/CategoriasSistemaTable";
import { CategoriaDialog } from "@/components/configuracoes/CategoriaDialog";
import { TemplatesSistemaTable } from "@/components/configuracoes/TemplatesSistemaTable";
import { TemplateDialog } from "@/components/configuracoes/TemplateDialog";

export default function ConfiguracoesSistema() {
  const [planoDialogOpen, setPlanoDialogOpen] = useState(false);
  const [moduloDialogOpen, setModuloDialogOpen] = useState(false);
  const [categoriaDialogOpen, setCategoriaDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);

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
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1">
            <TabsTrigger value="planos" className="text-xs sm:text-sm">Planos</TabsTrigger>
            <TabsTrigger value="modulos" className="text-xs sm:text-sm">Módulos</TabsTrigger>
            <TabsTrigger value="categorias" className="text-xs sm:text-sm">Categorias</TabsTrigger>
            <TabsTrigger value="templates" className="text-xs sm:text-sm">Templates</TabsTrigger>
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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Categorias Financeiras</CardTitle>
                    <CardDescription>
                      Configure as categorias para movimentações financeiras
                    </CardDescription>
                  </div>
                  <Button onClick={() => setCategoriaDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Categoria
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <CategoriasSistemaTable />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Templates */}
          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Templates de Notificações</CardTitle>
                    <CardDescription>
                      Configure templates para mensagens e notificações
                    </CardDescription>
                  </div>
                  <Button onClick={() => setTemplateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Template
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <TemplatesSistemaTable />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <PlanoDialog open={planoDialogOpen} onOpenChange={setPlanoDialogOpen} />
        <ModuloDialog open={moduloDialogOpen} onOpenChange={setModuloDialogOpen} />
        <CategoriaDialog open={categoriaDialogOpen} onOpenChange={setCategoriaDialogOpen} />
        <TemplateDialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen} />
      </div>
    </Layout>
  );
}
