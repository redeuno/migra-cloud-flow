import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { user, signOut, userRoles, arenaId } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="mb-4 text-4xl font-bold">Verana Beach Tennis</h1>
        <p className="text-xl text-muted-foreground">
          Bem-vindo, {user?.email}
        </p>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>Roles: {userRoles.join(", ") || "Nenhum"}</p>
          <p>Arena ID: {arenaId || "N/A"}</p>
        </div>
        <Button onClick={signOut}>Sair</Button>
      </div>
    </div>
  );
};

export default Index;
