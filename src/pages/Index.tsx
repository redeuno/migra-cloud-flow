import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import Dashboard from "./Dashboard";
import DashboardAluno from "./DashboardAluno";

const Index = () => {
  const { hasRole } = useAuth();

  // Alunos veem dashboard personalizado
  if (hasRole("aluno")) {
    return (
      <Layout>
        <DashboardAluno />
      </Layout>
    );
  }

  // Staff e admins veem dashboard administrativo
  return (
    <Layout>
      <Dashboard />
    </Layout>
  );
};

export default Index;
