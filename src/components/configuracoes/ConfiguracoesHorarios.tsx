import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const DIAS_SEMANA = [
  { key: "segunda", label: "Segunda-feira" },
  { key: "terca", label: "Terça-feira" },
  { key: "quarta", label: "Quarta-feira" },
  { key: "quinta", label: "Quinta-feira" },
  { key: "sexta", label: "Sexta-feira" },
  { key: "sabado", label: "Sábado" },
  { key: "domingo", label: "Domingo" },
];

export function ConfiguracoesHorarios() {
  const { arenaId } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: arena, isLoading } = useQuery({
    queryKey: ["arena-horarios", arenaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("arenas")
        .select("horario_funcionamento")
        .eq("id", arenaId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!arenaId,
  });

  const updateMutation = useMutation({
    mutationFn: async (horarios: any) => {
      const { error } = await supabase
        .from("arenas")
        .update({ horario_funcionamento: horarios })
        .eq("id", arenaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["arena-horarios", arenaId] });
      toast({
        title: "Horários atualizados",
        description: "Os horários de funcionamento foram salvos com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const horarios: any = {};

    DIAS_SEMANA.forEach(({ key }) => {
      const aberto = formData.get(`${key}_aberto`) === "on";
      horarios[key] = {
        aberto,
        abertura: aberto ? formData.get(`${key}_abertura`) : null,
        fechamento: aberto ? formData.get(`${key}_fechamento`) : null,
      };
    });

    await updateMutation.mutateAsync(horarios);
    setIsSubmitting(false);
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const horarios = arena?.horario_funcionamento || {};

  return (
    <Card>
      <CardHeader>
        <CardTitle>Horários de Funcionamento</CardTitle>
        <CardDescription>
          Configure os horários de abertura e fechamento da arena
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {DIAS_SEMANA.map(({ key, label }) => {
            const diaConfig = horarios[key] || { aberto: true, abertura: "08:00", fechamento: "22:00" };
            
            return (
              <div key={key} className="border-b pb-4 last:border-0">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-semibold">{label}</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`${key}_aberto`}
                      name={`${key}_aberto`}
                      defaultChecked={diaConfig.aberto}
                    />
                    <Label htmlFor={`${key}_aberto`}>Aberto</Label>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 ml-4">
                  <div className="space-y-2">
                    <Label htmlFor={`${key}_abertura`}>Abertura</Label>
                    <Input
                      id={`${key}_abertura`}
                      name={`${key}_abertura`}
                      type="time"
                      defaultValue={diaConfig.abertura}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${key}_fechamento`}>Fechamento</Label>
                    <Input
                      id={`${key}_fechamento`}
                      name={`${key}_fechamento`}
                      type="time"
                      defaultValue={diaConfig.fechamento}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Horários
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
