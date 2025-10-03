import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, DollarSign, Users, SquareActivity } from "lucide-react";

export default function Dashboard() {
  const { user, userRoles, arenaId } = useAuth();

  const stats = [
    {
      title: "Agendamentos Hoje",
      value: "12",
      icon: Calendar,
      description: "+2 desde ontem",
    },
    {
      title: "Receita do Mês",
      value: "R$ 15.420",
      icon: DollarSign,
      description: "+18% em relação ao mês anterior",
    },
    {
      title: "Clientes Ativos",
      value: "248",
      icon: Users,
      description: "+12 novos este mês",
    },
    {
      title: "Quadras Ativas",
      value: "4",
      icon: SquareActivity,
      description: "100% de ocupação",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Bem-vindo de volta! Aqui está o resumo de hoje.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Próximos Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <p className="font-medium">Quadra 1 - Beach Tennis</p>
                  <p className="text-sm text-muted-foreground">14:00 - 15:00</p>
                </div>
                <div className="text-sm text-muted-foreground">João Silva</div>
              </div>
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <p className="font-medium">Quadra 2 - Beach Tennis</p>
                  <p className="text-sm text-muted-foreground">15:00 - 16:00</p>
                </div>
                <div className="text-sm text-muted-foreground">Maria Santos</div>
              </div>
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <p className="font-medium">Quadra 3 - Beach Tennis</p>
                  <p className="text-sm text-muted-foreground">16:00 - 17:00</p>
                </div>
                <div className="text-sm text-muted-foreground">Pedro Costa</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Informações do Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Roles</p>
              <p className="font-medium">{userRoles.join(", ") || "Nenhuma"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Arena ID</p>
              <p className="font-mono text-xs break-all">{arenaId || "N/A"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
