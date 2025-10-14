import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CreditCard, FileText, TrendingUp, MessageSquare, CheckCircle2, Bell, Award, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { Progress } from "@/components/ui/progress";

export default function DashboardAluno() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Links diretos Asaas (sandbox)
  const ASAAS_CHECKOUT_LINK = "https://sandbox.asaas.com/c/damx27mcxowumc0k";
  const ASAAS_SUBSCRIPTION_LINK = "https://sandbox.asaas.com/c/24rc47o7jxuw17g9";

  const handlePagarAgora = (link: string) => {
    window.open(link, '_blank');
  };

  const handleEnviarWhatsApp = (mensalidade: any, tipo: 'avulso' | 'recorrente' = 'avulso') => {
    const link = tipo === 'recorrente' ? ASAAS_SUBSCRIPTION_LINK : ASAAS_CHECKOUT_LINK;
    const tipoTexto = tipo === 'recorrente' ? 'assinatura recorrente' : 'pagamento avulso';
    const mensagem = `Olá! Aqui está o link para ${tipoTexto} da mensalidade de ${format(new Date(mensalidade.referencia), 'MMMM/yyyy', { locale: ptBR })}: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(mensagem)}`, '_blank');
    toast({
      title: "WhatsApp aberto",
      description: "Compartilhe o link de pagamento",
    });
  };

  // Buscar dados do usuário
  const { data: usuario } = useQuery({
    queryKey: ["usuario-aluno", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("usuarios")
        .select("*, arenas(nome)")
        .eq("auth_id", user?.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Buscar contratos ativos
  const { data: contratos, isLoading: loadingContratos } = useQuery({
    queryKey: ["contratos-aluno", usuario?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contratos")
        .select("*")
        .eq("usuario_id", usuario?.id)
        .eq("status", "ativo");

      if (error) throw error;
      return data;
    },
    enabled: !!usuario?.id,
  });

  // Buscar mensalidades pendentes
  const { data: mensalidadesPendentes, isLoading: loadingMensalidades } = useQuery({
    queryKey: ["mensalidades-pendentes-aluno", usuario?.id],
    queryFn: async () => {
      const contratoIds = contratos?.map(c => c.id) || [];
      if (contratoIds.length === 0) return [];

      const { data, error } = await supabase
        .from("mensalidades")
        .select("*, contratos(tipo_contrato)")
        .in("contrato_id", contratoIds)
        .eq("status_pagamento", "pendente")
        .order("data_vencimento", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!contratos && contratos.length > 0,
  });

  // Buscar próximos agendamentos
  const { data: proximosAgendamentos, isLoading: loadingAgendamentos } = useQuery({
    queryKey: ["agendamentos-aluno", usuario?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agendamentos")
        .select(`
          id,
          data_agendamento,
          hora_inicio,
          hora_fim,
          modalidade,
          checkin_realizado,
          quadras(nome)
        `)
        .eq("cliente_id", usuario?.id)
        .gte("data_agendamento", new Date().toISOString().split("T")[0])
        .order("data_agendamento", { ascending: true })
        .order("hora_inicio", { ascending: true })
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: !!usuario?.id,
  });

  // Buscar estatísticas de frequência (últimos 30 dias)
  const { data: frequenciaStats, isLoading: loadingFrequencia } = useQuery({
    queryKey: ["frequencia-aluno", usuario?.id],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString().split("T")[0];
      
      const { data, error } = await supabase
        .from("agendamentos")
        .select("id, checkin_realizado, data_agendamento")
        .eq("cliente_id", usuario?.id)
        .gte("data_agendamento", thirtyDaysAgo)
        .lte("data_agendamento", new Date().toISOString().split("T")[0]);

      if (error) throw error;

      const total = data?.length || 0;
      const comCheckin = data?.filter(a => a.checkin_realizado).length || 0;
      const percentual = total > 0 ? Math.round((comCheckin / total) * 100) : 0;

      return { total, comCheckin, percentual };
    },
    enabled: !!usuario?.id,
  });

  // Buscar notificações recentes
  const { data: notificacoesRecentes, isLoading: loadingNotif } = useQuery({
    queryKey: ["notificacoes-recentes-aluno", usuario?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notificacoes")
        .select("*")
        .eq("usuario_id", usuario?.id)
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      return data;
    },
    enabled: !!usuario?.id,
  });

  // Buscar atividade semanal (para gráfico)
  const { data: atividadeSemanal, isLoading: loadingAtividade } = useQuery({
    queryKey: ["atividade-semanal", usuario?.id],
    queryFn: async () => {
      const sevenDaysAgo = subDays(new Date(), 6).toISOString().split("T")[0];
      
      const { data, error } = await supabase
        .from("agendamentos")
        .select("data_agendamento, checkin_realizado")
        .eq("cliente_id", usuario?.id)
        .gte("data_agendamento", sevenDaysAgo)
        .order("data_agendamento", { ascending: true });

      if (error) throw error;

      const grouped = (data || []).reduce((acc: any, item: any) => {
        const dia = format(new Date(item.data_agendamento), 'EEE', { locale: ptBR });
        if (!acc[dia]) {
          acc[dia] = { dia, agendamentos: 0, checkins: 0 };
        }
        acc[dia].agendamentos += 1;
        if (item.checkin_realizado) {
          acc[dia].checkins += 1;
        }
        return acc;
      }, {});

      return Object.values(grouped);
    },
    enabled: !!usuario?.id,
  });

  const totalPendente = mensalidadesPendentes?.reduce((sum, m) => sum + Number(m.valor_final || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Olá, {usuario?.nome_completo?.split(" ")[0]}!</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Bem-vindo ao seu painel. Confira suas informações abaixo.
        </p>
      </div>

      {/* Cards de Resumo - Responsivo */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card 
          className="cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => navigate('/meu-financeiro?tab=contratos')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contratos Ativos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingContratos ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{contratos?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Clique para ver detalhes
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => navigate('/agendamentos')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos Agendamentos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingAgendamentos ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{proximosAgendamentos?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Clique para ver agenda
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => navigate('/meu-financeiro?tab=pendentes')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensalidades Pendentes</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingMensalidades ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{mensalidadesPendentes?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Total: R$ {totalPendente.toFixed(2)}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Frequência (30d)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingFrequencia ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{frequenciaStats?.percentual || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  {frequenciaStats?.comCheckin || 0} de {frequenciaStats?.total || 0} agendamentos
                </p>
                <Progress value={frequenciaStats?.percentual || 0} className="mt-2 h-1" />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Seção de Gráficos e Atividade */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Minha Atividade Semanal</CardTitle>
            <CardDescription>Agendamentos e check-ins dos últimos 7 dias</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingAtividade ? (
              <Skeleton className="h-[200px] w-full" />
            ) : atividadeSemanal && atividadeSemanal.length > 0 ? (
              <ChartContainer
                config={{
                  agendamentos: {
                    label: "Agendamentos",
                    color: "hsl(var(--primary))",
                  },
                  checkins: {
                    label: "Check-ins",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-[180px] sm:h-[200px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={atividadeSemanal}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="dia" className="text-xs" />
                    <YAxis className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="agendamentos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="checkins" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <EmptyState
                icon={Activity}
                title="Sem dados"
                description="Nenhuma atividade registrada nos últimos 7 dias"
                className="py-8"
              />
            )}
          </CardContent>
        </Card>

        {/* Notificações Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notificações
            </CardTitle>
            <CardDescription>Últimas atualizações</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingNotif ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : notificacoesRecentes && notificacoesRecentes.length > 0 ? (
              <div className="space-y-3">
                {notificacoesRecentes.map((notif: any) => (
                  <div key={notif.id} className="flex items-start gap-2 border-b pb-2 last:border-0">
                    <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${notif.lida ? 'bg-muted' : 'bg-primary'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{notif.titulo}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{notif.mensagem}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(notif.created_at), "dd/MM HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Bell}
                title="Sem notificações"
                description="Você está em dia"
                className="py-4"
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {/* Próximos Agendamentos */}
        <Card>
          <CardHeader>
            <CardTitle>Meus Próximos Agendamentos</CardTitle>
            <CardDescription>Seus agendamentos futuros</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingAgendamentos ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : !proximosAgendamentos || proximosAgendamentos.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="Nenhum agendamento"
                description="Você não tem agendamentos futuros"
                className="py-8"
              />
            ) : (
              <div className="space-y-3">
                {proximosAgendamentos.map((agend: any) => (
                  <div key={agend.id} className="flex items-center justify-between border-b pb-3 last:border-0 hover:bg-accent/50 -mx-2 px-2 py-2 rounded transition-colors cursor-pointer"
                    onClick={() => navigate('/agendamentos')}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{agend.quadras?.nome}</p>
                        {agend.checkin_realizado && (
                          <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(agend.data_agendamento), "dd/MMM", { locale: ptBR })} • {agend.hora_inicio.slice(0, 5)} - {agend.hora_fim.slice(0, 5)}
                      </p>
                    </div>
                    <Badge variant="outline" className="flex-shrink-0">{agend.modalidade}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mensalidades Pendentes */}
        <Card>
          <CardHeader>
            <CardTitle>Mensalidades Pendentes</CardTitle>
            <CardDescription>Pagamentos em aberto</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingMensalidades ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : !mensalidadesPendentes || mensalidadesPendentes.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                title="Tudo em dia!"
                description="Você não tem mensalidades pendentes"
                className="py-8"
              />
            ) : (
              <div className="space-y-4">
                {mensalidadesPendentes.map((mens: any) => (
                  <div key={mens.id} className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">
                          {mens.contratos?.tipo_contrato?.replace("_", " ")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Vence em {format(new Date(mens.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">R$ {Number(mens.valor_final).toFixed(2)}</p>
                        <Badge variant="secondary">Pendente</Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <Button 
                        onClick={() => handlePagarAgora(ASAAS_CHECKOUT_LINK)}
                        size="sm"
                        className="w-full"
                      >
                        <CreditCard className="h-3 w-3 mr-1" />
                        À vista
                      </Button>
                      <Button 
                        onClick={() => handlePagarAgora(ASAAS_SUBSCRIPTION_LINK)}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <Calendar className="h-3 w-3 mr-1" />
                        Recorrente
                      </Button>
                      <Button 
                        onClick={() => handleEnviarWhatsApp(mens, 'avulso')}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        WhatsApp
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Informações do Contrato */}
      {contratos && contratos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Meus Contratos</CardTitle>
            <CardDescription>Informações dos seus contratos ativos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {contratos.map((contrato: any) => (
                <div key={contrato.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">
                        {contrato.tipo_contrato.replace("_", " ").toUpperCase()}
                      </p>
                      <p className="text-sm text-muted-foreground">{contrato.numero_contrato}</p>
                    </div>
                    <Badge variant="default">Ativo</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Valor Mensal</p>
                      <p className="font-semibold">R$ {Number(contrato.valor_mensal).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Dia de Vencimento</p>
                      <p className="font-semibold">Dia {contrato.dia_vencimento}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
