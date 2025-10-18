import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { arenaSchema, type ArenaFormData } from "@/lib/validations/arena";

interface ArenaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  arena?: any;
}

export function ArenaDialog({ open, onOpenChange, arena }: ArenaDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (arena?.id) {
        const { error } = await supabase
          .from("arenas")
          .update(data)
          .eq("id", arena.id);
        if (error) throw error;
      } else {
        // Para criar nova arena, precisa gerar tenant_id
        const newArenaData = {
          ...data,
          tenant_id: crypto.randomUUID(),
        };
        const { error } = await supabase.from("arenas").insert([newArenaData as any]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["arenas"] });
      toast.success(arena?.id ? "Arena atualizada!" : "Arena criada!");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao salvar arena");
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data: any = {
      nome: formData.get("nome"),
      razao_social: formData.get("razao_social"),
      cnpj: formData.get("cnpj"),
      email: formData.get("email"),
      telefone: formData.get("telefone"),
      whatsapp: formData.get("whatsapp"),
      status: formData.get("status") || "ativo",
      data_vencimento: formData.get("data_vencimento"),
      endereco_completo: {
        logradouro: formData.get("logradouro"),
        numero: formData.get("numero"),
        bairro: formData.get("bairro"),
        cidade: formData.get("cidade"),
        uf: formData.get("uf"),
        cep: formData.get("cep"),
      },
      horario_funcionamento: {
        segunda: { inicio: "08:00", fim: "22:00", ativo: true },
        terca: { inicio: "08:00", fim: "22:00", ativo: true },
        quarta: { inicio: "08:00", fim: "22:00", ativo: true },
        quinta: { inicio: "08:00", fim: "22:00", ativo: true },
        sexta: { inicio: "08:00", fim: "22:00", ativo: true },
        sabado: { inicio: "08:00", fim: "22:00", ativo: true },
        domingo: { inicio: "08:00", fim: "18:00", ativo: false },
      },
    };

    // Validar com Zod
    try {
      if (!arena?.id) {
        arenaSchema.parse(data);
      }
      await mutation.mutateAsync(data);
    } catch (error: any) {
      toast.error(error.message || "Dados inválidos");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{arena?.id ? "Editar Arena" : "Nova Arena"}</DialogTitle>
          <DialogDescription>
            {arena?.id ? "Atualize os dados da arena" : "Cadastre uma nova arena no sistema"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Arena *</Label>
              <Input
                id="nome"
                name="nome"
                defaultValue={arena?.nome}
                placeholder="Arena Beach Tennis"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="razao_social">Razão Social *</Label>
              <Input
                id="razao_social"
                name="razao_social"
                defaultValue={arena?.razao_social}
                placeholder="Arena Beach Tennis LTDA"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ *</Label>
              <Input
                id="cnpj"
                name="cnpj"
                defaultValue={arena?.cnpj}
                placeholder="00.000.000/0000-00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
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
              <Label htmlFor="telefone">Telefone *</Label>
              <Input
                id="telefone"
                name="telefone"
                defaultValue={arena?.telefone}
                placeholder="(11) 1234-5678"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp *</Label>
              <Input
                id="whatsapp"
                name="whatsapp"
                defaultValue={arena?.whatsapp}
                placeholder="(11) 98765-4321"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_vencimento">Data Vencimento *</Label>
              <Input
                id="data_vencimento"
                name="data_vencimento"
                type="date"
                defaultValue={arena?.data_vencimento}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {arena?.id ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
