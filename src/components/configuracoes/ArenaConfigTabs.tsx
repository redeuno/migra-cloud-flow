import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfiguracoesGerais } from "./ConfiguracoesGerais";
import { MinhaAssinatura } from "./MinhaAssinatura";
import { ModulosArenaManager } from "./ModulosArenaManager";
import { ConfiguracoesEvolution } from "./ConfiguracoesEvolution";
import { ConfiguracoesPagamentos } from "./ConfiguracoesPagamentos";
import { TemplatesWhatsApp } from "./TemplatesWhatsApp";
import { ConfiguracoesHorarios } from "./ConfiguracoesHorarios";
import { ArenaSelector } from "@/components/financeiro/ArenaSelector";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings } from "lucide-react";

interface ArenaConfigTabsProps {
  arenaId?: string;
  showArenaSelector?: boolean;
}

export function ArenaConfigTabs({ arenaId: propArenaId, showArenaSelector = false }: ArenaConfigTabsProps) {
  const { arenaId: contextArenaId } = useAuth();
  const [selectedArena, setSelectedArena] = useState<string>(propArenaId || "");
  const effectiveArenaId = selectedArena || propArenaId || contextArenaId;

  return (
    <div className="space-y-6">
      {showArenaSelector && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Selecione uma Arena</h2>
            <p className="text-sm text-muted-foreground">
              Gerencie as configurações específicas de cada arena
            </p>
          </div>
          <ArenaSelector value={selectedArena} onChange={setSelectedArena} />
        </div>
      )}

      {!effectiveArenaId && showArenaSelector && (
        <Alert>
          <Settings className="h-4 w-4" />
          <AlertDescription>
            Selecione uma arena acima para visualizar e editar suas configurações.
          </AlertDescription>
        </Alert>
      )}

      {effectiveArenaId && effectiveArenaId !== "all" && (
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
                <ConfiguracoesGerais arenaId={effectiveArenaId} />
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
                <MinhaAssinatura arenaId={effectiveArenaId} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="modulos">
            <Card>
              <CardHeader>
                <CardTitle>Módulos Disponíveis</CardTitle>
                <CardDescription>
                  Ative ou desative funcionalidades conforme seu plano permite
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ModulosArenaManager arenaId={effectiveArenaId} />
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
                <ConfiguracoesEvolution arenaId={effectiveArenaId} />
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
                <ConfiguracoesPagamentos arenaId={effectiveArenaId} />
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
                <TemplatesWhatsApp arenaId={effectiveArenaId} />
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
                <ConfiguracoesHorarios arenaId={effectiveArenaId} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
