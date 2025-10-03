import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Financeiro() {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
            <p className="text-muted-foreground">
              Gerencie as movimentações financeiras
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Movimentação
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Em Construção</CardTitle>
            <CardDescription>
              Esta página está em desenvolvimento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Em breve você poderá visualizar e gerenciar todas as movimentações financeiras aqui.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
