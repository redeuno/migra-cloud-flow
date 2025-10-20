import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Edit2, Trash2, MessageSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TemplateService, TemplateData, TemplateForm } from "@/lib/services/templateService";

interface TemplatesWhatsAppProps {
  arenaId?: string;
}

export function TemplatesWhatsApp({ arenaId: propArenaId }: TemplatesWhatsAppProps) {
  const { arenaId: contextArenaId } = useAuth();
  const effectiveArenaId = propArenaId || contextArenaId;
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateData | null>(null);
  const [formData, setFormData] = useState<TemplateForm>({
    nome: "",
    tipo: "",
    categoria: "",
    assunto: "",
    mensagem: "",
  });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["templates-whatsapp"],
    queryFn: () => TemplateService.fetchTemplates(),
  });

  const saveMutation = useMutation({
    mutationFn: async (data: TemplateForm) => {
      await TemplateService.saveTemplate(data, editingTemplate?.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates-whatsapp"] });
      toast.success(editingTemplate ? "Template atualizado!" : "Template criado!");
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao salvar template");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: TemplateService.deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates-whatsapp"] });
      toast.success("Template removido!");
    },
  });

  const handleSave = () => {
    if (!formData.nome || !formData.tipo || !formData.mensagem) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    saveMutation.mutate(formData);
  };

  const handleEdit = (template: TemplateData) => {
    setEditingTemplate(template);
    setFormData({
      nome: template.nome,
      tipo: template.tipo,
      categoria: template.categoria || "",
      assunto: template.assunto || "",
      mensagem: template.mensagem,
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTemplate(null);
    setFormData({
      nome: "",
      tipo: "",
      categoria: "",
      assunto: "",
      mensagem: "",
    });
  };

  const variaveis = [
    "{{nome}}",
    "{{valor}}",
    "{{data_vencimento}}",
    "{{link_pagamento}}",
    "{{horario}}",
    "{{quadra}}",
    "{{data}}",
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Templates de WhatsApp</h3>
          <p className="text-sm text-muted-foreground">
            Personalize as mensagens automáticas enviadas aos clientes
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingTemplate(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? "Editar Template" : "Novo Template"}
              </DialogTitle>
              <DialogDescription>
                Crie mensagens personalizadas usando as variáveis disponíveis
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome do Template *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Lembrete de Pagamento"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipo">Tipo *</Label>
                  <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lembrete_pagamento">Lembrete de Pagamento</SelectItem>
                      <SelectItem value="confirmacao_pagamento">Confirmação de Pagamento</SelectItem>
                      <SelectItem value="lembrete_agendamento">Lembrete de Agendamento</SelectItem>
                      <SelectItem value="confirmacao_agendamento">Confirmação de Agendamento</SelectItem>
                      <SelectItem value="cancelamento">Cancelamento</SelectItem>
                      <SelectItem value="boas_vindas">Boas-vindas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="categoria">Categoria</Label>
                  <Input
                    id="categoria"
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    placeholder="Ex: Financeiro"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="assunto">Assunto</Label>
                <Input
                  id="assunto"
                  value={formData.assunto}
                  onChange={(e) => setFormData({ ...formData, assunto: e.target.value })}
                  placeholder="Assunto da mensagem"
                />
              </div>

              <div>
                <Label htmlFor="mensagem">Mensagem *</Label>
                <Textarea
                  id="mensagem"
                  value={formData.mensagem}
                  onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
                  rows={6}
                  placeholder="Digite a mensagem usando as variáveis disponíveis"
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Variáveis Disponíveis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {variaveis.map((variavel) => (
                      <Button
                        key={variavel}
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            mensagem: formData.mensagem + " " + variavel,
                          })
                        }
                      >
                        {variavel}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Clique para inserir a variável na mensagem
                  </p>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button type="button" onClick={handleSave} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground">Carregando templates...</p>
      ) : templates.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      {template.nome}
                    </CardTitle>
                    <CardDescription>{template.tipo.replace(/_/g, " ")}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(template)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {template.mensagem}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Nenhum template cadastrado. Crie seu primeiro template!
          </CardContent>
        </Card>
      )}
    </div>
  );
}
