import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  SquareActivity,
  Calendar,
  Users,
  DollarSign,
  GraduationCap,
  Trophy,
  Settings,
  Building2,
  BarChart3,
  BookOpen,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

// Menu para Super Admin (visão global do sistema)
const superAdminItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, roles: ["super_admin"] },
  { title: "Arenas", url: "/arenas", icon: Building2, roles: ["super_admin"] },
  { title: "Financeiro", url: "/financeiro", icon: DollarSign, roles: ["super_admin"] },
  { title: "Config. Sistema", url: "/configuracoes-sistema", icon: Settings, roles: ["super_admin"] },
];

// Menu para Arena Admin e Staff (visão da arena)
const arenaNavItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, roles: ["arena_admin", "funcionario", "aluno"] },
  { title: "Quadras", url: "/quadras", icon: SquareActivity, roles: ["arena_admin", "funcionario"] },
  { title: "Agendamentos", url: "/agendamentos", icon: Calendar, roles: ["arena_admin", "funcionario", "aluno"] },
  { title: "Clientes", url: "/clientes", icon: Users, roles: ["arena_admin", "funcionario"] },
  { title: "Financeiro", url: "/financeiro", icon: DollarSign, roles: ["arena_admin"] },
  { title: "Meu Financeiro", url: "/meu-financeiro", icon: Wallet, roles: ["aluno"] },
  { title: "Aulas", url: "/aulas", icon: GraduationCap, roles: ["arena_admin", "funcionario", "professor"] },
  { title: "Minhas Aulas", url: "/minhas-aulas", icon: BookOpen, roles: ["aluno"] },
  { title: "Torneios", url: "/torneios", icon: Trophy, roles: ["arena_admin", "funcionario", "aluno"] },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3, roles: ["arena_admin"] },
];

const arenaAdminItems = [
  { title: "Configurações", url: "/configuracoes", icon: Settings, roles: ["arena_admin"] },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { userRoles, arenaId } = useAuth();
  const collapsed = state === "collapsed";

  const hasAccess = (allowedRoles: string[]) => {
    return userRoles.some(role => allowedRoles.includes(role));
  };

  // Determinar qual menu exibir baseado na role
  const isSuperAdmin = userRoles.includes("super_admin");

  // Buscar módulos ativos da arena (apenas para não super admins)
  const { data: modulosAtivos } = useQuery({
    queryKey: ["arena-modulos-ativos", arenaId],
    queryFn: async () => {
      if (!arenaId || isSuperAdmin) return null;
      
      const { data } = await supabase
        .from("arena_modulos")
        .select(`
          modulo_id,
          modulos_sistema (
            slug,
            nome,
            icone
          )
        `)
        .eq("arena_id", arenaId)
        .eq("ativo", true)
        .order("modulos_sistema(ordem)");
      
      return data;
    },
    enabled: !!arenaId && !isSuperAdmin,
  });

  // Mapear slugs dos módulos ativos
  const modulosAtivosMap = new Set(
    modulosAtivos?.map((m: any) => m.modulos_sistema?.slug) || []
  );

  // Filtrar itens de navegação baseado em módulos ativos (apenas para não super admins)
  let filteredNavItems = isSuperAdmin 
    ? superAdminItems.filter(item => hasAccess(item.roles))
    : arenaNavItems.filter(item => {
        // Verificar role
        if (!hasAccess(item.roles)) return false;
        
        // Se não há módulos carregados ainda, não mostrar nada (evitar flicker)
        if (!isSuperAdmin && arenaId && !modulosAtivos) return false;
        
        // Mapear URLs para slugs de módulos
        const urlToModuleMap: Record<string, string> = {
          "/quadras": "quadras",
          "/agendamentos": "agendamentos",
          "/clientes": "clientes",
          "/financeiro": "financeiro",
          "/aulas": "aulas",
          "/torneios": "torneios",
          "/relatorios": "relatorios",
        };
        
        const moduleSlug = urlToModuleMap[item.url];
        
        // Se não tem mapeamento de módulo, sempre mostrar (Dashboard, etc)
        if (!moduleSlug) return true;
        
        // Verificar se o módulo está ativo
        return modulosAtivosMap.has(moduleSlug);
      });

  const filteredAdminItems = isSuperAdmin ? [] : arenaAdminItems.filter(item => hasAccess(item.roles));

  const getNavClass = (isActive: boolean) =>
    isActive
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
      : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <SquareActivity className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold">Verana</span>
              <span className="text-xs text-muted-foreground">Beach Tennis</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{isSuperAdmin ? "Sistema" : "Menu Principal"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className={({ isActive }) => getNavClass(isActive)}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {filteredAdminItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Administração</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredAdminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <NavLink
                        to={item.url}
                        className={({ isActive }) => getNavClass(isActive)}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        {!collapsed && (
          <div className="text-xs text-muted-foreground">
            v1.0.0
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
