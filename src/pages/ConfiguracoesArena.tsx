import { useState } from "react";
import { useParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { PerfilAccessGuard } from "@/components/PerfilAccessGuard";
import { useAuth } from "@/contexts/AuthContext";
import { ArenaSelector } from "@/components/financeiro/ArenaSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfiguracoesGerais } from "@/components/configuracoes/ConfiguracoesGerais";
import { MinhaAssinatura } from "@/components/configuracoes/MinhaAssinatura";
import { ModulosArenaManager } from "@/components/configuracoes/ModulosArenaManager";
import { ConfiguracoesEvolution } from "@/components/configuracoes/ConfiguracoesEvolution";
import { ConfiguracoesPagamentos } from "@/components/configuracoes/ConfiguracoesPagamentos";
import { TemplatesWhatsApp } from "@/components/configuracoes/TemplatesWhatsApp";
import { ConfiguracoesHorarios } from "@/components/configuracoes/ConfiguracoesHorarios";
import { Building2, Settings } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ConfiguracoesArena() {
  const { id } = useParams<{ id: string }>();
  const { hasRole } = useAuth();
  const isSuperAdmin = hasRole("super_admin");
  const [selectedArena, setSelectedArena] = useState<string>(id || "");

  return (
    <Layout>
      <PerfilAccessGuard allowedRoles={["super_admin"]}>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Configurações de Arena</h1>
                <p className="text-sm text-muted-foreground">
                  Gerencie as configurações específicas de cada arena
                </p>
              </div>
            </div>
            
            {/* Arena Selector - Apenas se super admin E sem ID na URL */}
            {isSuperAdmin && !id && (
              <div className="w-full sm:w-auto">
                <ArenaSelector 
                  value={selectedArena} 
                  onChange={setSelectedArena}
                />
              </div>
            )}
          </div>

          {!selectedArena && !id && (
            <Alert>
              <Settings className="h-4 w-4" />
              <AlertDescription>
                Selecione uma arena acima para visualizar e editar suas configurações.
              </AlertDescription>
            </Alert>
          )}

          {(selectedArena || id) && selectedArena !== "all" && (
            <Tabs defaultValue="geral" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-7">
                <TabsTrigger value="geral">Geral</TabsTrigger>
                <TabsTrigger value="assinatura">Assinatura</TabsTrigger>
                <TabsTrigger value="modulos">Módulos</TabsTrigger>
                <TabsTrigger value="evolution">Evolution</TabsTrigger>
                <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
                <TabsTrigger value="templates">Templates</TabsTrigger>
                <TabsTrigger value="horarios">Horários</TabsTrigger>
              </TabsList>

              <TabsContent value="geral">
                <Card>
                  <CardHeader>
                    <CardTitle>Configurações Gerais</CardTitle>
                    <CardDescription>
                      Informações básicas e dados de contato da arena
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ConfiguracoesGerais arenaId={selectedArena || id} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="assinatura">
                <Card>
                  <CardHeader>
                    <CardTitle>Assinatura e Plano</CardTitle>
                    <CardDescription>
                      Informações sobre o plano contratado e faturas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <MinhaAssinatura arenaId={selectedArena || id} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="modulos">
                <Card>
                  <CardHeader>
                    <CardTitle>Módulos Ativos</CardTitle>
                    <CardDescription>
                      Gerenciar módulos disponíveis para esta arena
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ModulosArenaManager arenaId={selectedArena || id} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="evolution">
                <Card>
                  <CardHeader>
                    <CardTitle>Evolution API</CardTitle>
                    <CardDescription>
                      Configurações de integração com WhatsApp via Evolution API
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ConfiguracoesEvolution arenaId={selectedArena || id} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="pagamentos">
                <Card>
                  <CardHeader>
                    <CardTitle>Configurações de Pagamento</CardTitle>
                    <CardDescription>
                      Integração com Asaas e métodos de pagamento aceitos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ConfiguracoesPagamentos arenaId={selectedArena || id} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="templates">
                <Card>
                  <CardHeader>
                    <CardTitle>Templates de Mensagens</CardTitle>
                    <CardDescription>
                      Personalize as mensagens automáticas enviadas aos clientes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TemplatesWhatsApp arenaId={selectedArena || id} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="horarios">
                <Card>
                  <CardHeader>
                    <CardTitle>Horários de Funcionamento</CardTitle>
                    <CardDescription>
                      Defina os horários de operação da arena
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ConfiguracoesHorarios arenaId={selectedArena || id} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </PerfilAccessGuard>
    </Layout>
  );
}