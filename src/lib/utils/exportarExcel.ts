import * as XLSX from "xlsx";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ExportarExcelOptions {
  dados: any[];
  nomeArquivo?: string;
  nomePlanilha?: string;
}

export function exportarExcel({
  dados,
  nomeArquivo,
  nomePlanilha = "Dados",
}: ExportarExcelOptions) {
  // Criar workbook
  const wb = XLSX.utils.book_new();

  // Formatar dados (converter datas e números)
  const dadosFormatados = dados.map((item) => {
    const itemFormatado: any = {};
    Object.keys(item).forEach((key) => {
      const valor = item[key];
      if (valor === null || valor === undefined) {
        itemFormatado[key] = "";
      } else if (valor instanceof Date) {
        itemFormatado[key] = format(valor, "dd/MM/yyyy", { locale: ptBR });
      } else if (typeof valor === "number") {
        itemFormatado[key] = valor;
      } else if (typeof valor === "boolean") {
        itemFormatado[key] = valor ? "Sim" : "Não";
      } else {
        itemFormatado[key] = String(valor);
      }
    });
    return itemFormatado;
  });

  // Criar worksheet
  const ws = XLSX.utils.json_to_sheet(dadosFormatados);

  // Ajustar largura das colunas
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
  const colWidths: any = {};
  
  for (let C = range.s.c; C <= range.e.c; ++C) {
    let maxWidth = 10;
    for (let R = range.s.r; R <= range.e.r; ++R) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[cellAddress];
      if (cell && cell.v) {
        const cellLength = String(cell.v).length;
        if (cellLength > maxWidth) {
          maxWidth = cellLength;
        }
      }
    }
    colWidths[C] = { wch: Math.min(maxWidth + 2, 50) };
  }
  ws["!cols"] = Object.values(colWidths);

  // Adicionar worksheet ao workbook
  XLSX.utils.book_append_sheet(wb, ws, nomePlanilha);

  // Gerar arquivo
  const arquivo =
    nomeArquivo ||
    `relatorio_${format(new Date(), "yyyy-MM-dd_HHmm")}.xlsx`;
  XLSX.writeFile(wb, arquivo);
}

// Exportar relatório de agendamentos
export function exportarRelatorioAgendamentosExcel(agendamentos: any[]) {
  const dadosFormatados = agendamentos.map((a) => ({
    Data: a.data_agendamento,
    "Hora Início": a.hora_inicio,
    "Hora Fim": a.hora_fim,
    Quadra: a.quadra_nome,
    Cliente: a.cliente_nome,
    Modalidade: a.modalidade,
    "Valor (R$)": Number(a.valor_total),
    Status: a.status,
    "Check-in": a.checkin_realizado ? "Sim" : "Não",
  }));

  exportarExcel({
    dados: dadosFormatados,
    nomeArquivo: `agendamentos_${format(new Date(), "yyyy-MM-dd")}.xlsx`,
    nomePlanilha: "Agendamentos",
  });
}

// Exportar relatório financeiro
export function exportarRelatorioFinanceiroExcel(movimentacoes: any[]) {
  const dadosFormatados = movimentacoes.map((m) => ({
    Data: m.data_movimentacao,
    Descrição: m.descricao,
    Categoria: m.categoria_nome || "-",
    Tipo: m.tipo,
    "Valor (R$)": Number(m.valor),
    "Forma Pagamento": m.forma_pagamento || "-",
  }));

  // Adicionar resumo
  const receitas = movimentacoes.filter((m) => m.tipo === "receita");
  const despesas = movimentacoes.filter((m) => m.tipo === "despesa");
  const totalReceitas = receitas.reduce((sum, m) => sum + Number(m.valor), 0);
  const totalDespesas = despesas.reduce((sum, m) => sum + Number(m.valor), 0);

  const resumo = [
    {},
    { Descrição: "RESUMO", "Valor (R$)": "" },
    { Descrição: "Total Receitas", "Valor (R$)": totalReceitas },
    { Descrição: "Total Despesas", "Valor (R$)": totalDespesas },
    { Descrição: "Saldo", "Valor (R$)": totalReceitas - totalDespesas },
  ];

  exportarExcel({
    dados: [...dadosFormatados, ...resumo],
    nomeArquivo: `financeiro_${format(new Date(), "yyyy-MM-dd")}.xlsx`,
    nomePlanilha: "Movimentações",
  });
}

// Exportar relatório de clientes
export function exportarRelatorioClientesExcel(clientes: any[]) {
  const dadosFormatados = clientes.map((c) => ({
    Nome: c.nome_completo,
    Email: c.email,
    CPF: c.cpf,
    Telefone: c.telefone,
    WhatsApp: c.whatsapp || "-",
    "Data Nascimento": c.data_nascimento,
    Tipo: c.tipo_usuario,
    Status: c.status,
    "Data Cadastro": c.created_at,
  }));

  exportarExcel({
    dados: dadosFormatados,
    nomeArquivo: `clientes_${format(new Date(), "yyyy-MM-dd")}.xlsx`,
    nomePlanilha: "Clientes",
  });
}
