import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QrCode, Camera, MapPin } from "lucide-react";
import QRCodeLib from "qrcode";
import { Html5Qrcode } from "html5-qrcode";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface QRCodeCheckinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agendamentoId?: string;
  mode: "generate" | "scan";
}

export function QRCodeCheckinDialog({
  open,
  onOpenChange,
  agendamentoId,
  mode,
}: QRCodeCheckinDialogProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [scanning, setScanning] = useState(false);
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { latitude, longitude, error: geoError, isWithinRadius } = useGeolocation();

  // Gerar QR Code
  useEffect(() => {
    if (mode === "generate" && agendamentoId && open) {
      const checkinData = {
        agendamento_id: agendamentoId,
        timestamp: new Date().toISOString(),
      };
      
      QRCodeLib.toDataURL(JSON.stringify(checkinData), {
        width: 300,
        margin: 2,
      })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => {
          console.error("Erro ao gerar QR Code:", err);
          toast.error("Erro ao gerar QR Code");
        });
    }
  }, [mode, agendamentoId, open]);

  // Inicializar scanner
  useEffect(() => {
    if (mode === "scan" && open && scannerRef.current) {
      const html5QrCode = new Html5Qrcode("qr-reader");
      setScanner(html5QrCode);

      return () => {
        if (html5QrCode.isScanning) {
          html5QrCode.stop().catch(console.error);
        }
      };
    }
  }, [mode, open]);

  const startScanning = async () => {
    if (!scanner) return;

    setScanning(true);
    try {
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          try {
            const data = JSON.parse(decodedText);
            await handleCheckinFromQRCode(data.agendamento_id);
            await scanner.stop();
            setScanning(false);
            onOpenChange(false);
          } catch (err) {
            toast.error("QR Code inválido");
          }
        },
        (errorMessage) => {
          // Ignorar erros de scanning contínuo
        }
      );
    } catch (err) {
      console.error("Erro ao iniciar scanner:", err);
      toast.error("Erro ao acessar câmera");
      setScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scanner && scanner.isScanning) {
      await scanner.stop();
      setScanning(false);
    }
  };

  const handleCheckinFromQRCode = async (agendamentoIdFromQR: string) => {
    try {
      // Buscar dados do agendamento e arena
      const { data: agendamento, error: agendamentoError } = await supabase
        .from("agendamentos")
        .select(`
          *,
          arenas(
            coordenadas_latitude,
            coordenadas_longitude,
            raio_checkin_metros,
            janela_checkin_minutos_antes,
            janela_checkin_minutos_depois
          )
        `)
        .eq("id", agendamentoIdFromQR)
        .single();

      if (agendamentoError) throw agendamentoError;

      // Validar geolocalização se configurada
      if (
        agendamento.arenas?.coordenadas_latitude &&
        agendamento.arenas?.coordenadas_longitude
      ) {
        if (!latitude || !longitude) {
          toast.error("Habilite a localização para fazer check-in");
          return;
        }

        const dentroDoRaio = isWithinRadius(
          agendamento.arenas.coordenadas_latitude,
          agendamento.arenas.coordenadas_longitude,
          agendamento.arenas.raio_checkin_metros || 100
        );

        if (!dentroDoRaio) {
          toast.error("Você não está próximo à arena para fazer check-in");
          return;
        }
      }

      // Validar janela de tempo
      const agora = new Date();
      const dataAgendamento = new Date(agendamento.data_agendamento);
      const [horaInicio, minInicio] = agendamento.hora_inicio.split(":");
      const horarioAgendamento = new Date(dataAgendamento);
      horarioAgendamento.setHours(parseInt(horaInicio), parseInt(minInicio), 0);

      const minutosAntes = agendamento.arenas?.janela_checkin_minutos_antes || 30;
      const minutosDepois = agendamento.arenas?.janela_checkin_minutos_depois || 15;

      const inicioJanela = new Date(horarioAgendamento.getTime() - minutosAntes * 60000);
      const fimJanela = new Date(horarioAgendamento.getTime() + minutosDepois * 60000);

      if (agora < inicioJanela || agora > fimJanela) {
        toast.error("Check-in fora do horário permitido");
        return;
      }

      // Realizar check-in
      const { error: updateError } = await supabase
        .from("agendamentos")
        .update({
          checkin_realizado: true,
          data_checkin: new Date().toISOString(),
          status: "confirmado",
        })
        .eq("id", agendamentoIdFromQR);

      if (updateError) throw updateError;

      // Registrar no histórico
      const { error: checkinError } = await supabase.from("checkins").insert({
        agendamento_id: agendamentoIdFromQR,
        usuario_id: agendamento.cliente_id,
        tipo_checkin: "qrcode",
      });

      if (checkinError) throw checkinError;

      queryClient.invalidateQueries({ queryKey: ["agendamentos-calendario"] });
      queryClient.invalidateQueries({ queryKey: ["agendamentos-tabela"] });

      toast.success("✅ Check-in realizado com sucesso!");
    } catch (error: any) {
      console.error("Erro no check-in:", error);
      toast.error("Erro ao realizar check-in");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            {mode === "generate" ? "QR Code Check-in" : "Escanear Check-in"}
          </DialogTitle>
          <DialogDescription>
            {mode === "generate"
              ? "Mostre este QR Code para o cliente fazer check-in"
              : "Aponte a câmera para o QR Code do agendamento"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {mode === "generate" ? (
            <div className="flex flex-col items-center gap-4">
              {qrCodeUrl ? (
                <>
                  <img src={qrCodeUrl} alt="QR Code Check-in" className="w-64 h-64" />
                  <p className="text-sm text-muted-foreground text-center">
                    O cliente pode escanear este código para fazer check-in automaticamente
                  </p>
                </>
              ) : (
                <div className="w-64 h-64 flex items-center justify-center border rounded-lg">
                  <p className="text-muted-foreground">Gerando QR Code...</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {geoError && (
                <Alert variant="destructive">
                  <MapPin className="h-4 w-4" />
                  <AlertDescription>
                    Erro de geolocalização: {geoError}. O check-in pode não funcionar se a arena exigir validação de localização.
                  </AlertDescription>
                </Alert>
              )}

              <div
                id="qr-reader"
                ref={scannerRef}
                className="w-full rounded-lg overflow-hidden border"
                style={{ minHeight: scanning ? "300px" : "0" }}
              />

              {!scanning ? (
                <Button onClick={startScanning} className="w-full">
                  <Camera className="mr-2 h-4 w-4" />
                  Iniciar Scanner
                </Button>
              ) : (
                <Button onClick={stopScanning} variant="outline" className="w-full">
                  Parar Scanner
                </Button>
              )}

              <p className="text-xs text-muted-foreground text-center">
                Permita o acesso à câmera quando solicitado
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
