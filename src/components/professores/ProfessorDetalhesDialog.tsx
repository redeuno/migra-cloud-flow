import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Star, Users, DollarSign } from "lucide-react";
import { GerenciarAlunosProfessor } from "./GerenciarAlunosProfessor";

interface ProfessorDetalhesDialogProps {
  professor: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfessorDetalhesDialog({
  professor,
  open,
  onOpenChange,
}: ProfessorDetalhesDialogProps) {
  if (!professor) return null;

  const usuario = professor.usuarios;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <GraduationCap className="h-6 w-6" />
            <div>
              <div className="text-xl">{usuario?.nome_completo || "Professor"}</div>
              <div className="text-sm font-normal text-muted-foreground">
                {usuario?.email}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="alunos">Alunos Vinculados</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Avaliação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {professor.avaliacao_media?.toFixed(1) || "0.0"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {professor.total_avaliacoes || 0} avaliações
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant={professor.status === "ativo" ? "default" : "secondary"}>
                    {professor.status || "inativo"}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Comissão
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {professor.percentual_comissao_padrao || 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    R$ {(professor.valor_hora_aula || 0).toFixed(2)}/hora
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informações de Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{usuario?.email || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Telefone:</span>
                  <span className="font-medium">{usuario?.telefone || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CPF:</span>
                  <span className="font-medium">{usuario?.cpf || "—"}</span>
                </div>
              </CardContent>
            </Card>

            {professor.especialidades && professor.especialidades.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Especialidades</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {professor.especialidades.map((esp: string, idx: number) => (
                      <Badge key={idx} variant="secondary">
                        {esp}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {professor.observacoes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Observações</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {professor.observacoes}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="alunos" className="mt-4">
            <GerenciarAlunosProfessor
              professorId={professor.id}
              professorNome={usuario?.nome_completo}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
