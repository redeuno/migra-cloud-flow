import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

interface RecorrenciaConfig {
  ativo: boolean;
  frequencia: "semanal" | "quinzenal" | "mensal";
  dias_semana?: number[];
  total_ocorrencias?: number;
  data_fim?: Date;
}

interface AgendamentoRecorrenteConfigProps {
  value: RecorrenciaConfig;
  onChange: (config: RecorrenciaConfig) => void;
}

const DIAS_SEMANA = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
];

export function AgendamentoRecorrenteConfig({ value, onChange }: AgendamentoRecorrenteConfigProps) {
  const [config, setConfig] = useState<RecorrenciaConfig>(value);

  const handleChange = (updates: Partial<RecorrenciaConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onChange(newConfig);
  };

  const toggleDiaSemana = (dia: number) => {
    const dias = config.dias_semana || [];
    const novos = dias.includes(dia) 
      ? dias.filter(d => d !== dia)
      : [...dias, dia].sort();
    handleChange({ dias_semana: novos });
  };

  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Agendamento Recorrente
            </CardTitle>
            <CardDescription>
              Crie múltiplos agendamentos automaticamente
            </CardDescription>
          </div>
          <Switch
            checked={config.ativo}
            onCheckedChange={(checked) => handleChange({ ativo: checked })}
          />
        </div>
      </CardHeader>

      {config.ativo && (
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Frequência</Label>
            <Select
              value={config.frequencia}
              onValueChange={(v: any) => handleChange({ frequencia: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semanal">Semanal</SelectItem>
                <SelectItem value="quinzenal">Quinzenal</SelectItem>
                <SelectItem value="mensal">Mensal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {config.frequencia === "semanal" && (
            <div className="space-y-2">
              <Label>Dias da Semana</Label>
              <div className="flex flex-wrap gap-2">
                {DIAS_SEMANA.map((dia) => (
                  <Badge
                    key={dia.value}
                    variant={(config.dias_semana || []).includes(dia.value) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleDiaSemana(dia.value)}
                  >
                    {dia.label}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Clique nos dias para selecionar
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Quantidade de Ocorrências</Label>
            <Input
              type="number"
              min="1"
              max="52"
              value={config.total_ocorrencias || 4}
              onChange={(e) => handleChange({ total_ocorrencias: parseInt(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">
              Número de agendamentos que serão criados
            </p>
          </div>

          {config.total_ocorrencias && config.total_ocorrencias > 1 && (
            <div className="rounded-md bg-muted p-3 text-sm">
              <p className="font-medium mb-1">Preview:</p>
              <p className="text-muted-foreground">
                Serão criados {config.total_ocorrencias} agendamentos {config.frequencia === "semanal" ? "semanais" : config.frequencia === "quinzenal" ? "quinzenais" : "mensais"}
                {config.dias_semana && config.dias_semana.length > 0 && (
                  <> nos dias: {config.dias_semana.map(d => DIAS_SEMANA[d].label).join(", ")}</>
                )}
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
