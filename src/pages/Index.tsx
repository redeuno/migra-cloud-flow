import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import Dashboard from "./Dashboard";
import DashboardAluno from "./DashboardAluno";
import DashboardSuperAdmin from "./DashboardSuperAdmin";

const Index = () => {
  const { hasRole } = useAuth();

  // Super admin vê dashboard global
  if (hasRole("super_admin")) {
    return (
      <Layout>
        <DashboardSuperAdmin />
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
