import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  onClick?: () => void;
  comparativo?: {
    percentual: number;
    periodo: string; // Ex: "vs. mês anterior"
  };
  loading?: boolean;
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  description,
  onClick,
  comparativo,
  loading = false,
}: MetricCardProps) {
  const getTendencia = () => {
    if (!comparativo || comparativo.percentual === 0) {
      return { icon: Minus, color: "text-muted-foreground", bgColor: "bg-muted/50" };
    }
    if (comparativo.percentual > 0) {
      return { icon: TrendingUp, color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-950" };
    }
    return { icon: TrendingDown, color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-950" };
  };

  const { icon: TrendIcon, color, bgColor } = getTendencia();

  return (
    <Card 
      className={cn(
        "transition-all hover:shadow-md",
        onClick && "cursor-pointer hover:bg-accent/50"
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div className="flex-1">
            <div className="text-2xl font-bold">{value}</div>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>
          {comparativo && (
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
              bgColor
            )}>
              <TrendIcon className={cn("h-3 w-3", color)} />
              <span className={color}>
                {comparativo.percentual > 0 ? '+' : ''}{comparativo.percentual.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
