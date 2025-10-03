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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, roles: ["super_admin", "arena_admin", "staff"] },
  { title: "Quadras", url: "/quadras", icon: SquareActivity, roles: ["super_admin", "arena_admin", "staff"] },
  { title: "Agendamentos", url: "/agendamentos", icon: Calendar, roles: ["super_admin", "arena_admin", "staff", "cliente"] },
  { title: "Clientes", url: "/clientes", icon: Users, roles: ["super_admin", "arena_admin", "staff"] },
  { title: "Financeiro", url: "/financeiro", icon: DollarSign, roles: ["super_admin", "arena_admin"] },
  { title: "Aulas", url: "/aulas", icon: GraduationCap, roles: ["super_admin", "arena_admin", "staff", "professor"] },
  { title: "Torneios", url: "/torneios", icon: Trophy, roles: ["super_admin", "arena_admin", "staff"] },
];

const adminItems = [
  { title: "Arenas", url: "/arenas", icon: Building2, roles: ["super_admin"] },
  { title: "Configurações", url: "/configuracoes", icon: Settings, roles: ["super_admin", "arena_admin"] },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { userRoles } = useAuth();
  const collapsed = state === "collapsed";

  const hasAccess = (allowedRoles: string[]) => {
    return userRoles.some(role => allowedRoles.includes(role));
  };

  const filteredNavItems = navItems.filter(item => hasAccess(item.roles));
  const filteredAdminItems = adminItems.filter(item => hasAccess(item.roles));

  // Verificar se a rota atual está no grupo principal ou admin
  const isMainGroupActive = filteredNavItems.some(item => 
    item.url === "/" ? location.pathname === "/" : location.pathname.startsWith(item.url)
  );
  const isAdminGroupActive = filteredAdminItems.some(item => 
    location.pathname.startsWith(item.url)
  );

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
        <TooltipProvider delayDuration={0}>
          <SidebarGroup>
            <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={item.url}
                            end={item.url === "/"}
                            className={({ isActive }) => getNavClass(isActive)}
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      {collapsed && (
                        <TooltipContent side="right">
                          <p>{item.title}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
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
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton asChild>
                            <NavLink
                              to={item.url}
                              className={({ isActive }) => getNavClass(isActive)}
                            >
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                            </NavLink>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        {collapsed && (
                          <TooltipContent side="right">
                            <p>{item.title}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </TooltipProvider>
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
