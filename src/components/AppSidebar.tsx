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
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
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
  { title: "Configurações", url: "/configuracoes", icon: Settings, roles: ["super_admin"] },
];

// Menu para Arena Admin e Staff (visão da arena)
const arenaNavItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, roles: ["arena_admin", "funcionario"] },
  { title: "Quadras", url: "/quadras", icon: SquareActivity, roles: ["arena_admin", "funcionario"] },
  { title: "Agendamentos", url: "/agendamentos", icon: Calendar, roles: ["arena_admin", "funcionario", "aluno"] },
  { title: "Clientes", url: "/clientes", icon: Users, roles: ["arena_admin", "funcionario"] },
  { title: "Financeiro", url: "/financeiro", icon: DollarSign, roles: ["arena_admin"] },
  { title: "Meu Financeiro", url: "/meu-financeiro", icon: DollarSign, roles: ["aluno"] },
  { title: "Aulas", url: "/aulas", icon: GraduationCap, roles: ["arena_admin", "funcionario", "professor"] },
  { title: "Torneios", url: "/torneios", icon: Trophy, roles: ["arena_admin", "funcionario"] },
];

const arenaAdminItems = [
  { title: "Configurações", url: "/configuracoes", icon: Settings, roles: ["arena_admin"] },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { userRoles } = useAuth();
  const collapsed = state === "collapsed";

  const hasAccess = (allowedRoles: string[]) => {
    return userRoles.some(role => allowedRoles.includes(role));
  };

  // Determinar qual menu exibir baseado na role
  const isSuperAdmin = userRoles.includes("super_admin");
  
  const navItems = isSuperAdmin ? superAdminItems : arenaNavItems;
  const adminItems = isSuperAdmin ? [] : arenaAdminItems;

  const filteredNavItems = navItems.filter(item => hasAccess(item.roles));
  const filteredAdminItems = adminItems.filter(item => hasAccess(item.roles));

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
                  <SidebarMenuButton asChild tooltip={collapsed ? item.title : undefined}>
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
                    <SidebarMenuButton asChild tooltip={collapsed ? item.title : undefined}>
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
