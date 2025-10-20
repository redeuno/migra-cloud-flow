import { supabase } from "@/integrations/supabase/client";
import { TemplateService } from "@/lib/services/templateService";

type NotificarInscricaoParams = {
  aulaId: string;
  alunoId: string;
  arenaId: string;
};

export async function notificarInscricaoAula({
  aulaId,
  alunoId,
  arenaId,
}: NotificarInscricaoParams) {
  try {
    // Buscar dados da aula, aluno e professor
    const { data: aula, error: aulaError } = await supabase
      .from("aulas")
      .select(`
        *,
        professores (
          id,
          usuario_id,
          usuarios (
            nome_completo
          )
        ),
        quadras (
          numero,
          nome
        )
      `)
      .eq("id", aulaId)
      .single();

    if (aulaError || !aula) {
      console.error("Erro ao buscar aula:", aulaError);
      return;
    }

    const { data: aluno, error: alunoError } = await supabase
      .from("usuarios")
      .select("nome_completo")
      .eq("id", alunoId)
      .single();

    if (alunoError || !aluno) {
      console.error("Erro ao buscar aluno:", alunoError);
      return;
    }

    const professorNome = aula.professores?.usuarios?.nome_completo || "N/A";
    const quadraInfo = aula.quadras
      ? `Quadra ${aula.quadras.numero} - ${aula.quadras.nome}`
      : "N/A";

    // Notificar aluno
    const { error: notifAlunoError } = await supabase
      .from("notificacoes")
      .insert([{
        usuario_id: alunoId,
        arena_id: arenaId,
        tipo: "aula_confirmada" as any,
        titulo: "Inscrição Confirmada",
        mensagem: `Sua inscrição na aula "${aula.titulo}" foi confirmada. Data: ${new Date(
          aula.data_aula
        ).toLocaleDateString("pt-BR")}, Horário: ${aula.hora_inicio}. Professor: ${professorNome}.`,
        link: "/minhas-aulas",
        metadata: {
          aula_id: aulaId,
          tipo: "inscricao_aula",
        } as any,
      }]);

    if (notifAlunoError) {
      console.error("Erro ao notificar aluno:", notifAlunoError);
    }

    // Notificar professor
    if (aula.professores?.usuario_id) {
      const { error: notifProfError } = await supabase
        .from("notificacoes")
        .insert([{
          usuario_id: aula.professores.usuario_id,
          arena_id: arenaId,
          tipo: "novo_aluno" as any,
          titulo: "Novo Aluno na Aula",
          mensagem: `${aluno.nome_completo} se inscreveu na aula "${aula.titulo}" em ${new Date(
            aula.data_aula
          ).toLocaleDateString("pt-BR")} às ${aula.hora_inicio}.`,
          link: "/minhas-aulas-professor",
          metadata: {
            aula_id: aulaId,
            aluno_id: alunoId,
            tipo: "inscricao_aula",
          } as any,
        }]);

      if (notifProfError) {
        console.error("Erro ao notificar professor:", notifProfError);
      }
    }
  } catch (error) {
    console.error("Erro geral ao notificar inscrição:", error);
  }
}
