import { Layout } from "@/components/Layout";
import { PerfilAccessGuard } from "@/components/PerfilAccessGuard";
import { ArenaConfigTabs } from "@/components/configuracoes/ArenaConfigTabs";

export default function Configuracoes() {
  return (
    <Layout>
      <PerfilAccessGuard allowedRoles={["arena_admin"]}>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Configurações</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gerencie as configurações da sua arena
            </p>
          </div>

          <ArenaConfigTabs />
        </div>
      </PerfilAccessGuard>
    </Layout>
  );
}
