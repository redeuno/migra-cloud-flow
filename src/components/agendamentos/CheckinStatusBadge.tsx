import { CheckCircle, Clock, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CheckinStatusBadgeProps {
  checkinRealizado: boolean;
  dataCheckin?: string | null;
  podeCheckin?: boolean;
  className?: string;
}

export function CheckinStatusBadge({
  checkinRealizado,
  dataCheckin,
  podeCheckin = false,
  className,
}: CheckinStatusBadgeProps) {
  if (checkinRealizado && dataCheckin) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "bg-green-500/20 text-green-700 border-green-500/30",
          className
        )}
      >
        <CheckCircle className="mr-1 h-3 w-3" />
        Check-in realizado
      </Badge>
    );
  }

  if (podeCheckin) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "bg-blue-500/20 text-blue-700 border-blue-500/30 animate-pulse",
          className
        )}
      >
        <Clock className="mr-1 h-3 w-3" />
        Check-in disponível
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "bg-muted text-muted-foreground",
        className
      )}
    >
      <XCircle className="mr-1 h-3 w-3" />
      Sem check-in
    </Badge>
  );
}
