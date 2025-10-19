import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader2, MapPin } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface ConfiguracoesGeraisProps {
  arenaId?: string;
}

export function ConfiguracoesGerais({ arenaId: propArenaId }: ConfiguracoesGeraisProps) {
  const { arenaId: contextArenaId } = useAuth();
  const effectiveArenaId = propArenaId || contextArenaId;
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: arena, isLoading } = useQuery({
    queryKey: ["arena-config", effectiveArenaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("arenas")
        .select("*")
        .eq("id", effectiveArenaId!)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!effectiveArenaId,
  });

  const updateMutation = useMutation({
    mutationFn: async (formData: any) => {
      const { error } = await supabase
        .from("arenas")
        .update(formData)
        .eq("id", effectiveArenaId!);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["arena-config", effectiveArenaId] });
      toast({
        title: "Configurações atualizadas",
        description: "As informações da arena foram salvas com sucesso.",
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
    const data = {
      nome: formData.get("nome"),
      razao_social: formData.get("razao_social"),
      cnpj: formData.get("cnpj"),
      email: formData.get("email"),
      telefone: formData.get("telefone"),
      whatsapp: formData.get("whatsapp"),
      endereco_completo: {
        logradouro: formData.get("logradouro"),
        numero: formData.get("numero"),
        complemento: formData.get("complemento"),
        bairro: formData.get("bairro"),
        cidade: formData.get("cidade"),
        estado: formData.get("estado"),
        cep: formData.get("cep"),
      },
      // Configurações de check-in
      janela_checkin_minutos_antes: parseInt(formData.get("janela_checkin_minutos_antes") as string) || 30,
      janela_checkin_minutos_depois: parseInt(formData.get("janela_checkin_minutos_depois") as string) || 15,
      coordenadas_latitude: formData.get("coordenadas_latitude") ? parseFloat(formData.get("coordenadas_latitude") as string) : null,
      coordenadas_longitude: formData.get("coordenadas_longitude") ? parseFloat(formData.get("coordenadas_longitude") as string) : null,
      raio_checkin_metros: parseInt(formData.get("raio_checkin_metros") as string) || 100,
    };

    await updateMutation.mutateAsync(data);
    setIsSubmitting(false);
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const endereco = (arena?.endereco_completo as any) || {};

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações Gerais</CardTitle>
        <CardDescription>
          Configure as informações básicas da sua arena e regras de check-in
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Arena</Label>
              <Input
                id="nome"
                name="nome"
                defaultValue={arena?.nome}
                placeholder="Arena Beach Tennis"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="razao_social">Razão Social</Label>
              <Input
                id="razao_social"
                name="razao_social"
                defaultValue={arena?.razao_social}
                placeholder="Arena Beach Tennis LTDA"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                name="cnpj"
                defaultValue={arena?.cnpj}
                placeholder="00.000.000/0000-00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={arena?.email}
                placeholder="contato@arena.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                name="telefone"
                defaultValue={arena?.telefone}
                placeholder="(11) 1234-5678"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                name="whatsapp"
                defaultValue={arena?.whatsapp}
                placeholder="(11) 98765-4321"
                required
              />
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-4">Endereço</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="logradouro">Logradouro</Label>
                <Input
                  id="logradouro"
                  name="logradouro"
                  defaultValue={endereco.logradouro}
                  placeholder="Rua, Avenida, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numero">Número</Label>
                <Input
                  id="numero"
                  name="numero"
                  defaultValue={endereco.numero}
                  placeholder="123"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento"
                  name="complemento"
                  defaultValue={endereco.complemento}
                  placeholder="Apto, Sala, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  name="bairro"
                  defaultValue={endereco.bairro}
                  placeholder="Centro"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  name="cidade"
                  defaultValue={endereco.cidade}
                  placeholder="São Paulo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  name="estado"
                  defaultValue={endereco.estado}
                  placeholder="SP"
                  maxLength={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  name="cep"
                  defaultValue={endereco.cep}
                  placeholder="00000-000"
                />
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Configurações de Check-in</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="janela_checkin_minutos_antes">
                  Check-in disponível (minutos antes)
                </Label>
                <Input
                  id="janela_checkin_minutos_antes"
                  name="janela_checkin_minutos_antes"
                  type="number"
                  min="0"
                  max="120"
                  defaultValue={arena?.janela_checkin_minutos_antes || 30}
                  placeholder="30"
                />
                <p className="text-xs text-muted-foreground">
                  Quantos minutos antes do horário o check-in pode ser feito
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="janela_checkin_minutos_depois">
                  Check-in disponível (minutos depois)
                </Label>
                <Input
                  id="janela_checkin_minutos_depois"
                  name="janela_checkin_minutos_depois"
                  type="number"
                  min="0"
                  max="60"
                  defaultValue={arena?.janela_checkin_minutos_depois || 15}
                  placeholder="15"
                />
                <p className="text-xs text-muted-foreground">
                  Quantos minutos depois do horário o check-in ainda é permitido
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coordenadas_latitude">
                  Latitude da Arena (opcional)
                </Label>
                <Input
                  id="coordenadas_latitude"
                  name="coordenadas_latitude"
                  type="number"
                  step="0.000001"
                  defaultValue={arena?.coordenadas_latitude || ""}
                  placeholder="-23.550520"
                />
                <p className="text-xs text-muted-foreground">
                  Para validação de check-in por geolocalização
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coordenadas_longitude">
                  Longitude da Arena (opcional)
                </Label>
                <Input
                  id="coordenadas_longitude"
                  name="coordenadas_longitude"
                  type="number"
                  step="0.000001"
                  defaultValue={arena?.coordenadas_longitude || ""}
                  placeholder="-46.633308"
                />
                <p className="text-xs text-muted-foreground">
                  Para validação de check-in por geolocalização
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="raio_checkin_metros">
                  Raio de Check-in (metros)
                </Label>
                <Input
                  id="raio_checkin_metros"
                  name="raio_checkin_metros"
                  type="number"
                  min="50"
                  max="1000"
                  defaultValue={arena?.raio_checkin_metros || 100}
                  placeholder="100"
                />
                <p className="text-xs text-muted-foreground">
                  Distância máxima permitida da arena para check-in
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Configurações
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
