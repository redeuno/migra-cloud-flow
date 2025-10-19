import { useParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { PerfilAccessGuard } from "@/components/PerfilAccessGuard";
import { ArenaConfigTabs } from "@/components/configuracoes/ArenaConfigTabs";
import { Building2 } from "lucide-react";

export default function ConfiguracoesArena() {
  const { id } = useParams<{ id: string }>();

  return (
    <Layout>
      <PerfilAccessGuard allowedRoles={["super_admin"]}>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Configurações de Arena</h1>
              <p className="text-sm text-muted-foreground">
                Gerencie as configurações específicas de cada arena
              </p>
            </div>
          </div>
          
          <ArenaConfigTabs arenaId={id} showArenaSelector={!id} />
        </div>
      </PerfilAccessGuard>
    </Layout>
  );
}
