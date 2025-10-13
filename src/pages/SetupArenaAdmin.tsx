import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";

export default function SetupArenaAdmin() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSetup = async () => {
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('setup-arena-admin');

      if (error) throw error;

      setResult({
        success: true,
        message: data.message || 'Admin da arena criado com sucesso!'
      });
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || 'Erro ao criar admin da arena'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Setup Admin da Arena</CardTitle>
          <CardDescription>
            Criar usuário admin.arena@verana.com automaticamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm">
            <p><strong>Email:</strong> admin.arena@verana.com</p>
            <p><strong>Senha:</strong> Admin123!</p>
            <p><strong>Role:</strong> arena_admin</p>
            <p><strong>Arena:</strong> Arena Verana Demo</p>
          </div>

          <Button 
            onClick={handleSetup} 
            disabled={loading || result?.success}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {result?.success ? 'Criado com Sucesso' : 'Criar Admin da Arena'}
          </Button>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}

          {result?.success && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Agora você pode fazer login com as credenciais acima!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
