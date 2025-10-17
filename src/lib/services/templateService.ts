import { supabase } from "@/integrations/supabase/client";

export type TemplateData = {
  id: string;
  nome: string;
  tipo: string;
  categoria: string | null;
  assunto: string | null;
  mensagem: string;
  ativo: boolean;
};

export type TemplateForm = {
  nome: string;
  tipo: string;
  categoria: string;
  assunto: string;
  mensagem: string;
};

export class TemplateService {
  /**
   * Renderiza um template substituindo as variáveis
   */
  static async renderTemplate(
    categoria: string,
    tipo: "whatsapp" | "email" | "sms",
    variaveis: Record<string, string>
  ): Promise<{ mensagem: string; assunto?: string }> {
    const { data: template, error } = await supabase
      .from("templates_notificacao")
      .select("mensagem, assunto")
      .eq("categoria", categoria)
      .eq("tipo", tipo)
      .eq("ativo", true)
      .single();
    
    if (error || !template) {
      throw new Error(`Template não encontrado: ${categoria}/${tipo}`);
    }
    
    let mensagem = template.mensagem;
    let assunto = template.assunto || "";
    
    // Substituir variáveis
    Object.entries(variaveis).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      mensagem = mensagem.replace(regex, value);
      if (assunto) {
        assunto = assunto.replace(regex, value);
      }
    });
    
    return { mensagem, assunto };
  }

  /**
   * Renderiza um preview do template com dados de exemplo
   */
  static renderPreview(
    mensagem: string,
    assunto?: string
  ): { mensagem: string; assunto?: string } {
    const exemplos: Record<string, string> = {
      "nome": "João Silva",
      "email": "joao@example.com",
      "telefone": "(11) 98765-4321",
      "valor": "R$ 150,00",
      "data_vencimento": "15/10/2025",
      "link_pagamento": "https://asaas.com/c/...",
      "professor": "Maria Santos",
      "horario": "18:00",
      "quadra": "Quadra 1",
      "data": "14/10/2025",
      "hora": "14:30",
    };
    
    let previewMensagem = mensagem;
    let previewAssunto = assunto || "";
    
    Object.entries(exemplos).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      previewMensagem = previewMensagem.replace(regex, value);
      if (previewAssunto) {
        previewAssunto = previewAssunto.replace(regex, value);
      }
    });
    
    return { mensagem: previewMensagem, assunto: previewAssunto };
  }

  /**
   * Busca templates de uma arena
   */
  static async fetchTemplates(arenaId: string | null): Promise<TemplateData[]> {
    if (!arenaId) return [];
    
    try {
      // @ts-ignore - Evita problema de inferência profunda de tipos do Supabase
      const result = await supabase
        .from("templates_notificacao")
        .select("*")
        .eq("arena_id", arenaId)
        .eq("ativo", true)
        .order("tipo");

      if (result.error) throw result.error;
      
      return (result.data || []) as TemplateData[];
    } catch (error) {
      console.error("Erro ao carregar templates:", error);
      return [];
    }
  }

  /**
   * Salva ou atualiza um template
   */
  static async saveTemplate(template: TemplateForm, arenaId: string, templateId?: string) {
    if (templateId) {
      const { error } = await supabase
        .from("templates_notificacao")
        .update(template)
        .eq("id", templateId);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("templates_notificacao")
        .insert({ ...template, arena_id: arenaId, ativo: true });
      if (error) throw error;
    }
  }

  /**
   * Desativa um template
   */
  static async deleteTemplate(id: string) {
    const { error } = await supabase
      .from("templates_notificacao")
      .update({ ativo: false })
      .eq("id", id);
    if (error) throw error;
  }
}
