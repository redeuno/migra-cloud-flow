import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { CalendarioAgendamentos } from "@/components/agendamentos/CalendarioAgendamentos";
import { AgendamentosTable } from "@/components/agendamentos/AgendamentosTable";
import { AgendamentoDialog } from "@/components/agendamentos/AgendamentoDialog";
import { CheckinDialog } from "@/components/agendamentos/CheckinDialog";

export default function Agendamentos() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [checkinDialogOpen, setCheckinDialogOpen] = useState(false);
  const [selectedAgendamentoId, setSelectedAgendamentoId] = useState<string>();
  const [defaultValues, setDefaultValues] = useState<any>();

  const handleNewAgendamento = () => {
    setSelectedAgendamentoId(undefined);
    setDefaultValues(undefined);
    setDialogOpen(true);
  };

  const handleSelectSlot = (quadraId: string, data: Date, hora: string) => {
    setSelectedAgendamentoId(undefined);
    setDefaultValues({
      quadra_id: quadraId,
      data_agendamento: data,
      hora_inicio: hora,
      hora_fim: `${(parseInt(hora.split(':')[0]) + 1).toString().padStart(2, '0')}:00`,
    });
    setDialogOpen(true);
  };

  const handleSelectAgendamento = (agendamentoId: string) => {
    setSelectedAgendamentoId(agendamentoId);
    setDefaultValues(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (agendamentoId: string) => {
    setSelectedAgendamentoId(agendamentoId);
    setDefaultValues(undefined);
    setDialogOpen(true);
  };

  const handleCheckin = (agendamentoId: string) => {
    setSelectedAgendamentoId(agendamentoId);
    setCheckinDialogOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Agendamentos</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gerencie os agendamentos das quadras
            </p>
          </div>
          <Button onClick={handleNewAgendamento} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Novo Agendamento
          </Button>
        </div>

        <Tabs defaultValue="calendario" className="space-y-4">
          <TabsList>
            <TabsTrigger value="calendario">Calendário</TabsTrigger>
            <TabsTrigger value="lista">Lista</TabsTrigger>
          </TabsList>

          <TabsContent value="calendario" className="space-y-4">
            <CalendarioAgendamentos
              onSelectSlot={handleSelectSlot}
              onSelectAgendamento={handleSelectAgendamento}
            />
          </TabsContent>

          <TabsContent value="lista" className="space-y-4">
            <AgendamentosTable
              onEdit={handleEdit}
              onCheckin={handleCheckin}
            />
          </TabsContent>
        </Tabs>
      </div>

      <AgendamentoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        agendamentoId={selectedAgendamentoId}
        defaultValues={defaultValues}
      />

      {selectedAgendamentoId && (
        <CheckinDialog
          open={checkinDialogOpen}
          onOpenChange={setCheckinDialogOpen}
          agendamentoId={selectedAgendamentoId}
        />
      )}
    </Layout>
  );
}
