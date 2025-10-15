import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle, QrCode, MapPin, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QRCodeCheckinDialog } from "./QRCodeCheckinDialog";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CheckinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agendamentoId: string;
}

export function CheckinDialog({
  open,
  onOpenChange,
  agendamentoId,
}: CheckinDialogProps) {
  const queryClient = useQueryClient();
  const [observacoes, setObservacoes] = useState("");
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [checkinMethod, setCheckinMethod] = useState<"manual" | "qrcode" | "geolocation">("manual");
  const { latitude, longitude, error: geoError, isWithinRadius, calculateDistance } = useGeolocation();

  const { data: agendamento, isLoading } = useQuery({
    queryKey: ["agendamento-checkin", agendamentoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agendamentos")
        .select(`
          *,
          quadras(nome, numero),
          usuarios!agendamentos_cliente_id_fkey(nome_completo, email, telefone),
          arenas(
            coordenadas_latitude,
            coordenadas_longitude,
            raio_checkin_metros,
            janela_checkin_minutos_antes,
            janela_checkin_minutos_depois
          )
        `)
        .eq("id", agendamentoId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!agendamentoId && open,
  });

  const checkinMutation = useMutation({
    mutationFn: async () => {
      // Validar geolocalização se necessário
      if (checkinMethod === "geolocation") {
        if (!agendamento?.arenas?.coordenadas_latitude || !agendamento?.arenas?.coordenadas_longitude) {
          throw new Error("Arena não tem coordenadas configuradas");
        }

        if (!latitude || !longitude) {
          throw new Error("Não foi possível obter sua localização");
        }

        const dentroDoRaio = isWithinRadius(
          agendamento.arenas.coordenadas_latitude,
          agendamento.arenas.coordenadas_longitude,
          agendamento.arenas.raio_checkin_metros || 100
        );

        if (!dentroDoRaio) {
          const distancia = calculateDistance(
            latitude,
            longitude,
            agendamento.arenas.coordenadas_latitude,
            agendamento.arenas.coordenadas_longitude
          );
          throw new Error(`Você está a ${Math.round(distancia)}m da arena. É necessário estar a ${agendamento.arenas.raio_checkin_metros || 100}m`);
        }
      }

      // Validar janela de tempo
      const agora = new Date();
      const dataAgendamento = new Date(agendamento!.data_agendamento);
      const [horaInicio, minInicio] = agendamento!.hora_inicio.split(":");
      const horarioAgendamento = new Date(dataAgendamento);
      horarioAgendamento.setHours(parseInt(horaInicio), parseInt(minInicio), 0);

      const minutosAntes = agendamento?.arenas?.janela_checkin_minutos_antes || 30;
      const minutosDepois = agendamento?.arenas?.janela_checkin_minutos_depois || 15;

      const inicioJanela = new Date(horarioAgendamento.getTime() - minutosAntes * 60000);
      const fimJanela = new Date(horarioAgendamento.getTime() + minutosDepois * 60000);

      if (agora < inicioJanela) {
        throw new Error(`Check-in disponível a partir de ${format(inicioJanela, "HH:mm")}`);
      }
      if (agora > fimJanela) {
        throw new Error(`Janela de check-in encerrada às ${format(fimJanela, "HH:mm")}`);
      }

      // Atualizar agendamento
      const { error: agendamentoError } = await supabase
        .from("agendamentos")
        .update({
          checkin_realizado: true,
          data_checkin: new Date().toISOString(),
          status: "confirmado",
        })
        .eq("id", agendamentoId);

      if (agendamentoError) throw agendamentoError;

      // Registrar check-in na tabela de checkins
      const { error: checkinError } = await supabase.from("checkins").insert({
        agendamento_id: agendamentoId,
        usuario_id: agendamento?.cliente_id,
        tipo_checkin: checkinMethod,
        observacoes: observacoes || null,
      });

      if (checkinError) throw checkinError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agendamentos-calendario"] });
      queryClient.invalidateQueries({ queryKey: ["agendamentos-tabela"] });
      toast.success("✅ Presença confirmada!", {
        description: `${agendamento?.usuarios?.nome_completo} está registrado para este horário. O agendamento foi confirmado e está ativo.`,
      });
      onOpenChange(false);
      setObservacoes("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao realizar check-in");
      if (import.meta.env.DEV) console.error("Erro ao realizar check-in:", error);
    },
  });

  const handleCheckin = () => {
    checkinMutation.mutate();
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check-in</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!agendamento) return null;

  const jaTemCheckin = agendamento.checkin_realizado;

  // Verificar se está na janela de check-in
  const agora = new Date();
  const dataAgendamento = new Date(agendamento.data_agendamento);
  const [horaInicio, minInicio] = agendamento.hora_inicio.split(":");
  const horarioAgendamento = new Date(dataAgendamento);
  horarioAgendamento.setHours(parseInt(horaInicio), parseInt(minInicio), 0);

  const minutosAntes = agendamento.arenas?.janela_checkin_minutos_antes || 30;
  const minutosDepois = agendamento.arenas?.janela_checkin_minutos_depois || 15;

  const inicioJanela = new Date(horarioAgendamento.getTime() - minutosAntes * 60000);
  const fimJanela = new Date(horarioAgendamento.getTime() + minutosDepois * 60000);

  const dentroJanelaCheckin = agora >= inicioJanela && agora <= fimJanela;

  // Verificar distância da arena
  const arenaTemGeolocalizacao =
    agendamento.arenas?.coordenadas_latitude && agendamento.arenas?.coordenadas_longitude;

  let distanciaArena: number | null = null;
  let dentroDoRaio = false;

  if (arenaTemGeolocalizacao && latitude && longitude) {
    distanciaArena = calculateDistance(
      latitude,
      longitude,
      agendamento.arenas.coordenadas_latitude,
      agendamento.arenas.coordenadas_longitude
    );
    dentroDoRaio = isWithinRadius(
      agendamento.arenas.coordenadas_latitude,
      agendamento.arenas.coordenadas_longitude,
      agendamento.arenas.raio_checkin_metros || 100
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Check-in do Agendamento
          </DialogTitle>
          <DialogDescription>
            {jaTemCheckin
              ? "Este agendamento já teve check-in realizado. A presença do cliente foi registrada com sucesso."
              : "Confirme a presença do cliente para registrar que ele compareceu neste horário"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações do Agendamento */}
          <div className="space-y-2 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Data</span>
              <span className="font-medium">
                {format(new Date(agendamento.data_agendamento), "dd/MM/yyyy", {
                  locale: ptBR,
                })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Horário</span>
              <span className="font-medium">
                {agendamento.hora_inicio.substring(0, 5)} -{" "}
                {agendamento.hora_fim.substring(0, 5)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Quadra</span>
              <span className="font-medium">
                Quadra {agendamento.quadras?.numero} - {agendamento.quadras?.nome}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Cliente</span>
              <span className="font-medium">
                {agendamento.usuarios?.nome_completo || "Sem cliente"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status Pagamento</span>
              <Badge
                variant={
                  agendamento.status_pagamento === "pago" ? "default" : "secondary"
                }
              >
                {agendamento.status_pagamento}
              </Badge>
            </div>
          </div>

          {jaTemCheckin ? (
            <div className="rounded-lg bg-green-50 p-4 text-green-800 dark:bg-green-950 dark:text-green-200">
              <p className="flex items-center gap-2 font-medium">
                <CheckCircle className="h-4 w-4" />
                Check-in realizado em{" "}
                {format(new Date(agendamento.data_checkin!), "dd/MM/yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
              </p>
            </div>
          ) : (
            <>
              {/* Avisos de validação */}
              {!dentroJanelaCheckin && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    Check-in disponível de {format(inicioJanela, "HH:mm")} até {format(fimJanela, "HH:mm")}
                  </AlertDescription>
                </Alert>
              )}

              {geoError && arenaTemGeolocalizacao && (
                <Alert variant="destructive">
                  <MapPin className="h-4 w-4" />
                  <AlertDescription>
                    Erro ao obter localização: {geoError}
                  </AlertDescription>
                </Alert>
              )}

              {arenaTemGeolocalizacao && distanciaArena !== null && (
                <Alert variant={dentroDoRaio ? "default" : "destructive"}>
                  <MapPin className="h-4 w-4" />
                  <AlertDescription>
                    {dentroDoRaio
                      ? `✓ Você está a ${Math.round(distanciaArena)}m da arena`
                      : `✗ Você está a ${Math.round(distanciaArena)}m da arena (máximo ${agendamento.arenas?.raio_checkin_metros || 100}m)`}
                  </AlertDescription>
                </Alert>
              )}

              {/* Métodos de check-in */}
              <Tabs value={checkinMethod} onValueChange={(v) => setCheckinMethod(v as any)}>
                <TabsList className="grid w-full grid-cols-3 h-auto">
                  <TabsTrigger value="manual">Manual</TabsTrigger>
                  <TabsTrigger value="qrcode">QR Code</TabsTrigger>
                  {arenaTemGeolocalizacao && (
                    <TabsTrigger value="geolocation">
                      <MapPin className="h-3 w-3 sm:mr-1" />
                      <span className="hidden sm:inline">Localização</span>
                    </TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="manual" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="observacoes">Observações (opcional)</Label>
                    <Textarea
                      id="observacoes"
                      placeholder="Ex: Cliente chegou 10 minutos atrasado"
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleCheckin}
                      disabled={checkinMutation.isPending || !dentroJanelaCheckin}
                    >
                      {checkinMutation.isPending ? "Confirmando..." : "Confirmar Check-in"}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="qrcode" className="space-y-4">
                  <div className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Gere um QR Code para o cliente escanear ou escaneie o código dele
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setQrDialogOpen(true)}
                      >
                        <QrCode className="mr-2 h-4 w-4" />
                        Gerar QR Code
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="geolocation" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="observacoes-geo">Observações (opcional)</Label>
                    <Textarea
                      id="observacoes-geo"
                      placeholder="Ex: Cliente chegou 10 minutos atrasado"
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleCheckin}
                      disabled={
                        checkinMutation.isPending ||
                        !dentroJanelaCheckin ||
                        !dentroDoRaio ||
                        !latitude ||
                        !longitude
                      }
                    >
                      {checkinMutation.isPending
                        ? "Confirmando..."
                        : "Check-in com Localização"}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </DialogContent>

      <QRCodeCheckinDialog
        open={qrDialogOpen}
        onOpenChange={setQrDialogOpen}
        agendamentoId={agendamentoId}
        mode="generate"
      />
    </Dialog>
  );
}
