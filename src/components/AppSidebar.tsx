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
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Arenas", url: "/arenas", icon: Building2 },
  { title: "Setup Arenas", url: "/arena-setup", icon: Settings },
  { title: "Financeiro", url: "/financeiro", icon: DollarSign },
  { title: "Config. Sistema", url: "/configuracoes-sistema", icon: Settings },
  { title: "Config. Arenas", url: "/configuracoes-arena", icon: Building2 },
];

// Menu exclusivo para Alunos
const alunoNavItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Meus Agendamentos", url: "/meus-agendamentos", icon: Calendar, module: "agendamentos" },
  { title: "Quadras Disponíveis", url: "/quadras-disponiveis", icon: SquareActivity, module: "quadras" },
  { title: "Aulas Disponíveis", url: "/aulas-disponiveis", icon: GraduationCap, module: "aulas" },
  { title: "Minhas Aulas", url: "/minhas-aulas", icon: BookOpen, module: "aulas" },
  { title: "Meu Financeiro", url: "/meu-financeiro", icon: Wallet, module: "financeiro" },
];

// Menu exclusivo para Professores (sem outros roles administrativos)
const professorNavItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Minhas Aulas", url: "/minhas-aulas-professor", icon: GraduationCap, module: "aulas" },
  { title: "Meus Alunos", url: "/meus-alunos", icon: Users, module: "aulas" },
  { title: "Comissões", url: "/comissoes", icon: DollarSign, module: "financeiro" },
];

// Menu para Arena Admin e Funcionários
const arenaStaffNavItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Quadras", url: "/quadras", icon: SquareActivity, module: "quadras" },
  { title: "Agendamentos", url: "/agendamentos", icon: Calendar, module: "agendamentos" },
  { title: "Pessoas", url: "/clientes", icon: Users, module: "clientes" },
  { title: "Professores", url: "/professores", icon: GraduationCap, module: "aulas" },
  { title: "Aulas", url: "/aulas", icon: GraduationCap, module: "aulas" },
  { title: "Torneios", url: "/torneios", icon: Trophy, module: "torneios" },
];

// Itens exclusivos para Arena Admin
const arenaAdminOnlyItems = [
  { title: "Financeiro", url: "/financeiro", icon: DollarSign, module: "financeiro" },
  { title: "Dashboard Financeiro", url: "/financeiro-dashboard", icon: BarChart3, module: "financeiro" },
  { title: "Comissões", url: "/comissoes", icon: DollarSign, module: "financeiro" },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3, module: "relatorios" },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { userRoles, arenaId } = useAuth();
  const collapsed = state === "collapsed";

  // Determinar hierarquia de roles (prioridade)
  const isSuperAdmin = userRoles.includes("super_admin");
  const isArenaAdmin = userRoles.includes("arena_admin");
  const isFuncionario = userRoles.includes("funcionario");
  const isProfessor = userRoles.includes("professor");
  const isAluno = userRoles.includes("aluno");

  // Buscar módulos ativos da arena (apenas para não super admins)
  const { data: modulosAtivos, isLoading: loadingModulosAtivos } = useQuery({
    queryKey: ["arena-modulos-ativos", arenaId],
    queryFn: async () => {
      if (!arenaId || isSuperAdmin) return null;
      
      const { data } = await supabase
        .from("arena_modulos")
        .select(`
          modulo_id,
          ativo,
          modulos_sistema (
            slug,
            nome,
            icone
          )
        `)
        .eq("arena_id", arenaId)
        .eq("ativo", true)
        .order("ordem", { foreignTable: "modulos_sistema" });
      
      return data;
    },
    enabled: !!arenaId && !isSuperAdmin,
  });

  // Mapear slugs dos módulos ativos
  const modulosAtivosMap = new Set(
    modulosAtivos?.map((m: any) => m.modulos_sistema?.slug) || []
  );

  // Função para filtrar por módulos ativos
  const filterByModule = (items: any[]) => {
    return items.filter(item => {
      // Itens sem módulo sempre aparecem
      if (!item.module) return true;
      
      // Durante carregamento, mostrar itens
      if (!arenaId || loadingModulosAtivos || !modulosAtivos) return true;
      
      // Verificar se módulo está ativo
      return modulosAtivosMap.has(item.module);
    });
  };

  // Determinar menus baseado em hierarquia de roles
  let navItems: any[] = [];
  let adminItems: any[] = [];

  if (isSuperAdmin) {
    // Super Admin: menu próprio
    navItems = superAdminItems;
  } else if (isArenaAdmin) {
    // Arena Admin: menu staff + itens exclusivos admin
    navItems = filterByModule(arenaStaffNavItems);
    adminItems = filterByModule(arenaAdminOnlyItems);
  } else if (isFuncionario) {
    // Funcionário: apenas menu staff
    navItems = filterByModule(arenaStaffNavItems);
  } else if (isProfessor && !isAluno) {
    // Professor puro: menu professor
    navItems = filterByModule(professorNavItems);
  } else if (isAluno) {
    // Aluno: menu aluno (prioridade mais baixa)
    navItems = filterByModule(alunoNavItems);
  }

  const filteredNavItems = navItems;
  const filteredAdminItems = adminItems;

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
