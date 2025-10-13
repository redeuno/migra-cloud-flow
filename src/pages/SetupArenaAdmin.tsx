import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Loader2, AlertCircle, Database, Users, Calendar, GraduationCap } from "lucide-react";

interface SetupSummary {
  adminLinked: boolean;
  roleSet: boolean;
  brunoRoleFixed: boolean;
  quadrasCreated: number;
  professorCreated: boolean;
  agendamentosCreated: number;
  aulasCreated: number;
}

export default function SetupArenaAdmin() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; summary?: SetupSummary } | null>(null);

  const handleSetup = async () => {
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('setup-arena-admin');

      if (error) throw error;

      setResult({
        success: true,
        message: data.message || 'Configuração completa!',
        summary: data.summary
      });
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || 'Erro na configuração'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Setup Completo da Arena</CardTitle>
          <CardDescription>
            Configurar admin, popular dados de exemplo e corrigir roles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Email:</strong> admin.arena@verana.com</p>
              <p><strong>Senha:</strong> Admin123!</p>
            </div>
            <div>
              <p><strong>Role:</strong> arena_admin</p>
              <p><strong>Arena:</strong> Arena Verana Demo</p>
            </div>
          </div>

          <Button 
            onClick={handleSetup} 
            disabled={loading || result?.success}
            className="w-full"
            size="lg"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {result?.success ? 'Configuração Completa!' : 'Executar Configuração e Popular Dados'}
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

          {result?.success && result.summary && (
            <div className="pt-4 border-t space-y-3">
              <h3 className="font-semibold">Resumo das Ações:</h3>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-600" />
                  <span>Admin vinculado: {result.summary.adminLinked ? '✓' : '✗'}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Role configurada: {result.summary.roleSet ? '✓' : '✗'}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-green-600" />
                  <span>Bruno corrigido: {result.summary.brunoRoleFixed ? '✓' : '✗'}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-blue-600" />
                  <span>Quadras criadas: {result.summary.quadrasCreated}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-purple-600" />
                  <span>Professor criado: {result.summary.professorCreated ? '✓' : '✗'}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-orange-600" />
                  <span>Agendamentos: {result.summary.agendamentosCreated}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-indigo-600" />
                  <span>Aulas criadas: {result.summary.aulasCreated}</span>
                </div>
              </div>

              <div className="pt-3 border-t">
                <p className="text-sm text-muted-foreground">
                  ✓ Agora você pode fazer login com <strong>admin.arena@verana.com</strong>
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
