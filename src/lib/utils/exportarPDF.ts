import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ExportarPDFOptions {
  titulo: string;
  subtitulo?: string;
  dados: any[];
  colunas: { header: string; dataKey: string }[];
  orientacao?: "portrait" | "landscape";
  nomeArquivo?: string;
}

export function exportarPDF({
  titulo,
  subtitulo,
  dados,
  colunas,
  orientacao = "portrait",
  nomeArquivo,
}: ExportarPDFOptions) {
  const doc = new jsPDF({
    orientation: orientacao,
    unit: "mm",
    format: "a4",
  });

  // Cabeçalho
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(titulo, 14, 15);

  if (subtitulo) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(subtitulo, 14, 22);
  }

  // Data de geração
  const dataGeracao = format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
    locale: ptBR,
  });
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Gerado em: ${dataGeracao}`, 14, subtitulo ? 28 : 22);

  // Tabela
  autoTable(doc, {
    startY: subtitulo ? 32 : 26,
    head: [colunas.map((col) => col.header)],
    body: dados.map((item) =>
      colunas.map((col) => {
        const valor = item[col.dataKey];
        // Formatação de valores
        if (valor === null || valor === undefined) return "-";
        if (typeof valor === "number") {
          return valor.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
        }
        if (valor instanceof Date) {
          return format(valor, "dd/MM/yyyy", { locale: ptBR });
        }
        return String(valor);
      })
    ),
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { top: 10 },
  });

  // Rodapé
  const pageCount = (doc as any).internal.getNumberOfPages();
  doc.setFontSize(8);
  doc.setTextColor(100);
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  // Salvar
  const arquivo = nomeArquivo || `${titulo.toLowerCase().replace(/\s/g, "_")}_${format(new Date(), "yyyy-MM-dd_HHmm")}.pdf`;
  doc.save(arquivo);
}

// Exportar relatório de agendamentos
export function exportarRelatorioAgendamentosPDF(agendamentos: any[]) {
  exportarPDF({
    titulo: "Relatório de Agendamentos",
    subtitulo: "Lista completa de agendamentos do período",
    dados: agendamentos,
    colunas: [
      { header: "Data", dataKey: "data_agendamento" },
      { header: "Horário", dataKey: "hora_inicio" },
      { header: "Quadra", dataKey: "quadra_nome" },
      { header: "Cliente", dataKey: "cliente_nome" },
      { header: "Modalidade", dataKey: "modalidade" },
      { header: "Valor (R$)", dataKey: "valor_total" },
      { header: "Status", dataKey: "status" },
    ],
    orientacao: "landscape",
  });
}

// Exportar relatório financeiro
export function exportarRelatorioFinanceiroPDF(movimentacoes: any[]) {
  const receitas = movimentacoes.filter((m) => m.tipo === "receita");
  const despesas = movimentacoes.filter((m) => m.tipo === "despesa");
  const totalReceitas = receitas.reduce((sum, m) => sum + Number(m.valor), 0);
  const totalDespesas = despesas.reduce((sum, m) => sum + Number(m.valor), 0);
  const saldo = totalReceitas - totalDespesas;

  const doc = new jsPDF({ orientation: "landscape" });

  // Cabeçalho
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Relatório Financeiro", 14, 15);

  // Resumo
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Total de Receitas: R$ ${totalReceitas.toFixed(2)}`, 14, 25);
  doc.text(`Total de Despesas: R$ ${totalDespesas.toFixed(2)}`, 14, 32);
  doc.setFont("helvetica", "bold");
  doc.text(`Saldo: R$ ${saldo.toFixed(2)}`, 14, 39);

  // Tabela
  autoTable(doc, {
    startY: 45,
    head: [["Data", "Descrição", "Categoria", "Tipo", "Valor (R$)"]],
    body: movimentacoes.map((m) => [
      format(new Date(m.data_movimentacao), "dd/MM/yyyy"),
      m.descricao,
      m.categoria_nome || "-",
      m.tipo,
      Number(m.valor).toFixed(2),
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  doc.save(`relatorio_financeiro_${format(new Date(), "yyyy-MM-dd")}.pdf`);
}

// Exportar relatório de clientes
export function exportarRelatorioClientesPDF(clientes: any[]) {
  exportarPDF({
    titulo: "Relatório de Clientes",
    subtitulo: "Lista de clientes cadastrados",
    dados: clientes,
    colunas: [
      { header: "Nome", dataKey: "nome_completo" },
      { header: "Email", dataKey: "email" },
      { header: "Telefone", dataKey: "telefone" },
      { header: "Tipo", dataKey: "tipo_usuario" },
      { header: "Status", dataKey: "status" },
      { header: "Data Cadastro", dataKey: "created_at" },
    ],
    orientacao: "landscape",
  });
}
