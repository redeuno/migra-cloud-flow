import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface PerfilAccessGuardProps {
  children: React.ReactNode;
  allowedRoles: ("super_admin" | "arena_admin" | "funcionario" | "professor" | "aluno")[];
  redirectTo?: string;
}

/**
 * Guard para verificar se o perfil do usuário tem permissão
 * Diferente do ProtectedRoute, não redireciona automaticamente,
 * mas mostra uma mensagem de acesso negado
 */
export function PerfilAccessGuard({ 
  children, 
  allowedRoles, 
  redirectTo = "/" 
}: PerfilAccessGuardProps) {
  const { hasRole } = useAuth();
  const navigate = useNavigate();

  // Super admin sempre tem acesso
  const hasAccess = hasRole("super_admin") || allowedRoles.some((role) => hasRole(role));

  if (!hasAccess) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <Lock className="h-4 w-4" />
            <AlertTitle>Acesso Restrito</AlertTitle>
            <AlertDescription className="mt-2">
              Esta funcionalidade está disponível apenas para:{" "}
              {allowedRoles.map(role => {
                const roleNames: Record<string, string> = {
                  super_admin: "Super Admin",
                  arena_admin: "Administradores",
                  funcionario: "Funcionários",
                  professor: "Professores",
                  aluno: "Alunos"
                };
                return roleNames[role];
              }).join(", ")}
            </AlertDescription>
          </Alert>
          <Button 
            onClick={() => navigate(redirectTo)} 
            className="w-full mt-4"
            variant="outline"
          >
            Voltar ao Início
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
