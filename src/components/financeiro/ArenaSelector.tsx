import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building2 } from "lucide-react";

interface ArenaSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function ArenaSelector({ value, onChange }: ArenaSelectorProps) {
  const { data: arenas, isLoading } = useQuery({
    queryKey: ["arenas-selector"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("arenas")
        .select("id, nome")
        .eq("status", "ativo")
        .order("nome");

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Building2 className="h-4 w-4 animate-pulse" />
        <span>Carregando...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[280px]">
          <SelectValue placeholder="Selecione uma arena" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <span className="font-semibold">📊 Visão Consolidada (Todas)</span>
          </SelectItem>
          {arenas?.map((arena) => (
            <SelectItem key={arena.id} value={arena.id}>
              {arena.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
