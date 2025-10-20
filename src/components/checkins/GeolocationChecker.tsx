import { useEffect, useState } from "react";
import { MapPin, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useGeolocation } from "@/hooks/useGeolocation";
import { cn } from "@/lib/utils";

interface GeolocationCheckerProps {
  targetLatitude: number | null;
  targetLongitude: number | null;
  radiusMeters?: number;
  className?: string;
  onStatusChange?: (status: "loading" | "within" | "outside" | "error" | "unavailable") => void;
}

export function GeolocationChecker({
  targetLatitude,
  targetLongitude,
  radiusMeters = 100,
  className,
  onStatusChange,
}: GeolocationCheckerProps) {
  const { latitude, longitude, error, loading, isWithinRadius, calculateDistance } = useGeolocation();
  const [status, setStatus] = useState<"loading" | "within" | "outside" | "error" | "unavailable">("loading");
  const [distance, setDistance] = useState<number | null>(null);

  useEffect(() => {
    if (!targetLatitude || !targetLongitude) {
      setStatus("unavailable");
      onStatusChange?.("unavailable");
      return;
    }

    if (loading) {
      setStatus("loading");
      onStatusChange?.("loading");
      return;
    }

    if (error) {
      setStatus("error");
      onStatusChange?.("error");
      return;
    }

    if (latitude && longitude) {
      const dist = calculateDistance(latitude, longitude, targetLatitude, targetLongitude);
      setDistance(dist);

      const within = isWithinRadius(targetLatitude, targetLongitude, radiusMeters);
      const newStatus = within ? "within" : "outside";
      setStatus(newStatus);
      onStatusChange?.(newStatus);
    }
  }, [latitude, longitude, error, loading, targetLatitude, targetLongitude, radiusMeters, onStatusChange, isWithinRadius, calculateDistance]);

  // Arena não tem coordenadas configuradas
  if (!targetLatitude || !targetLongitude) {
    return (
      <Alert className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Arena não tem coordenadas configuradas. Configure a localização da arena nas configurações.
        </AlertDescription>
      </Alert>
    );
  }

  // Carregando localização
  if (loading) {
    return (
      <Alert className={className}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertDescription>
          Obtendo sua localização...
        </AlertDescription>
      </Alert>
    );
  }

  // Erro ao obter localização
  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-1">
            <p className="font-medium">Não foi possível obter sua localização</p>
            <p className="text-xs">{error}</p>
            <p className="text-xs text-muted-foreground">
              Certifique-se de que o navegador tem permissão para acessar sua localização.
            </p>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Dentro do raio - sucesso
  if (status === "within") {
    return (
      <Alert className={cn("border-green-500 bg-green-50 dark:bg-green-950", className)}>
        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertDescription className="flex items-center justify-between">
          <div className="text-green-800 dark:text-green-200">
            <p className="font-medium">✓ Você está na arena</p>
            <p className="text-xs text-green-700 dark:text-green-300">
              Distância: {distance ? Math.round(distance) : 0}m
            </p>
          </div>
          <Badge variant="outline" className="border-green-500 text-green-700 dark:text-green-300">
            Dentro do raio
          </Badge>
        </AlertDescription>
      </Alert>
    );
  }

  // Fora do raio - erro
  if (status === "outside") {
    return (
      <Alert variant="destructive" className={className}>
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-1">
            <p className="font-medium">✗ Você está muito longe da arena</p>
            <p className="text-xs">
              Distância atual: <strong>{distance ? Math.round(distance) : 0}m</strong>
            </p>
            <p className="text-xs">
              Máximo permitido: <strong>{radiusMeters}m</strong>
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Aproxime-se da arena para realizar o check-in.
            </p>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
