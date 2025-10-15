import { useArenaAccess } from "@/hooks/useArenaAccess";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ArenaAccessGuardProps {
  children: React.ReactNode;
}

export function ArenaAccessGuard({ children }: ArenaAccessGuardProps) {
  const { podeAcessar, mensagem, diasAteVencimento, isLoading } = useArenaAccess();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  // Arena bloqueada
  if (!podeAcessar) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <Lock className="h-4 w-4" />
            <AlertTitle>Acesso Bloqueado</AlertTitle>
            <AlertDescription className="mt-2">
              {mensagem}
            </AlertDescription>
          </Alert>
          <Button 
            onClick={() => navigate("/configuracoes")} 
            className="w-full mt-4"
            variant="outline"
          >
            Ir para Configurações
          </Button>
        </div>
      </div>
    );
  }

  // Aviso de vencimento próximo
  if (diasAteVencimento !== undefined && diasAteVencimento <= 7 && diasAteVencimento > 0) {
    return (
      <div className="space-y-4">
        <Alert variant="default" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800 dark:text-yellow-200">
            Atenção: Assinatura próxima do vencimento
          </AlertTitle>
          <AlertDescription className="text-yellow-700 dark:text-yellow-300">
            {mensagem}
          </AlertDescription>
        </Alert>
        {children}
      </div>
    );
  }

  return <>{children}</>;
}
