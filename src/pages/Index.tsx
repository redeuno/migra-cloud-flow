import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import Dashboard from "./Dashboard";
import DashboardAluno from "./DashboardAluno";
import DashboardSuperAdmin from "./DashboardSuperAdmin";
import DashboardProfessor from "./DashboardProfessor";
import { useArenaStatus } from "@/hooks/useArenaStatus";

const Index = () => {
  const { hasRole } = useAuth();
  
  // Verificar status da arena (exceto para super_admin)
  useArenaStatus();

  // Super admin vê dashboard global
  if (hasRole("super_admin")) {
    return (
      <Layout>
        <DashboardSuperAdmin />
      </Layout>
    );
  }

  // Professores veem dashboard dedicado
  if (hasRole("professor")) {
    return (
      <Layout>
        <DashboardProfessor />
      </Layout>
    );
  }

  // Alunos veem dashboard personalizado
  if (hasRole("aluno")) {
    return (
      <Layout>
        <DashboardAluno />
      </Layout>
    );
  }

  // Arena admin e funcionário veem dashboard da arena
  return (
    <Layout>
      <Dashboard />
    </Layout>
  );
};

export default Index;
