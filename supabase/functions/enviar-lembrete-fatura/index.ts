import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Fatura {
  id: string;
  arena_id: string;
  numero_fatura: string;
  competencia: string;
  data_vencimento: string;
  valor: number;
  status_pagamento: string;
  linha_digitavel: string | null;
  pix_copy_paste: string | null;
  asaas_invoice_url: string | null;
  arenas: {
    nome: string;
    email: string;
    whatsapp: string;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔔 Iniciando envio de lembretes de vencimento...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Calcular data de 3 dias no futuro
    const dataLembrete = new Date();
    dataLembrete.setDate(dataLembrete.getDate() + 3);
    const dataLembreteStr = dataLembrete.toISOString().split('T')[0];

    // Buscar faturas que vencem em 3 dias e ainda estão pendentes
    console.log(`📅 Buscando faturas que vencem em ${dataLembreteStr}...`);
    const { data: faturas, error: errorFaturas } = await supabase
      .from('faturas_sistema')
      .select(`
        id,
        arena_id,
        numero_fatura,
        competencia,
        data_vencimento,
        valor,
        status_pagamento,
        linha_digitavel,
        pix_copy_paste,
        asaas_invoice_url,
        arenas (
          nome,
          email,
          whatsapp
        )
      `)
      .eq('status_pagamento', 'pendente')
      .eq('data_vencimento', dataLembreteStr);

    if (errorFaturas) {
      throw errorFaturas;
    }

    console.log(`📊 ${faturas?.length || 0} faturas encontradas para lembrete`);

    let notificacoesEnviadas = 0;
    let erros = 0;

    if (faturas && faturas.length > 0) {
      for (const fatura of faturas as unknown as Fatura[]) {
        try {
          // Buscar Arena Admins
          const { data: admins } = await supabase
            .from('user_roles')
            .select('user_id')
            .eq('arena_id', fatura.arena_id)
            .in('role', ['arena_admin', 'super_admin']);

          if (admins && admins.length > 0) {
            for (const admin of admins) {
              // Buscar usuario_id a partir de auth_id
              const { data: usuario } = await supabase
                .from('usuarios')
                .select('id, nome_completo')
                .eq('auth_id', admin.user_id)
                .single();

              if (usuario) {
                // Formatar valor
                const valorFormatado = new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(fatura.valor);

                // Formatar data
                const dataVencimentoFormatada = new Date(fatura.data_vencimento)
                  .toLocaleDateString('pt-BR');

                // Montar mensagem
                let linkPagamento = fatura.asaas_invoice_url || '';
                let formaPagamento = '';
                
                if (fatura.pix_copy_paste) {
                  formaPagamento = 'PIX';
                } else if (fatura.linha_digitavel) {
                  formaPagamento = 'Boleto';
                }

                const mensagem = `Sua fatura ${fatura.numero_fatura} no valor de ${valorFormatado} vence em 3 dias (${dataVencimentoFormatada}). ${formaPagamento ? `Forma de pagamento: ${formaPagamento}.` : ''} Evite a suspensão da arena pagando em dia.`;

                // Criar notificação
                await supabase
                  .from('notificacoes')
                  .insert({
                    usuario_id: usuario.id,
                    arena_id: fatura.arena_id,
                    tipo: 'lembrete_pagamento',
                    titulo: '⏰ Lembrete: Fatura Vence em 3 Dias',
                    mensagem: mensagem,
                    link: '/configuracoes-arena',
                    metadata: {
                      fatura_id: fatura.id,
                      numero_fatura: fatura.numero_fatura,
                      valor: fatura.valor,
                      data_vencimento: fatura.data_vencimento,
                      link_pagamento: linkPagamento
                    }
                  });

                notificacoesEnviadas++;
                console.log(`✅ Notificação enviada para ${usuario.nome_completo} - Arena ${fatura.arenas.nome}`);

                // TODO: Integrar com WhatsApp via Evolution API se configurado
                // const { data: config } = await supabase
                //   .from('configuracoes_arena')
                //   .select('notificacoes_whatsapp_enabled, evolution_api_enabled')
                //   .eq('arena_id', fatura.arena_id)
                //   .single();
              }
            }
          }

          // Atualizar fatura para marcar que lembrete foi enviado
          await supabase
            .from('faturas_sistema')
            .update({
              historico_status: supabase.rpc('jsonb_append', {
                target: 'historico_status',
                value: {
                  status: 'lembrete_enviado',
                  data: new Date().toISOString(),
                  observacao: 'Lembrete de vencimento enviado (3 dias antes)'
                }
              })
            })
            .eq('id', fatura.id);

        } catch (error) {
          console.error(`❌ Erro ao processar fatura ${fatura.numero_fatura}:`, error);
          erros++;
        }
      }
    }

    // Registrar atividade
    await supabase
      .from('historico_atividades')
      .insert({
        usuario_id: '00000000-0000-0000-0000-000000000000', // Sistema
        tipo_acao: 'envio_lembretes',
        descricao: `Lembretes enviados: ${notificacoesEnviadas} notificações, ${erros} erros`,
        metadata: {
          faturas_encontradas: faturas?.length || 0,
          notificacoes_enviadas: notificacoesEnviadas,
          erros: erros,
          data_vencimento: dataLembreteStr,
          data_execucao: new Date().toISOString()
        }
      });

    console.log('✅ Envio de lembretes concluído');

    return new Response(
      JSON.stringify({
        success: true,
        faturas_encontradas: faturas?.length || 0,
        notificacoes_enviadas: notificacoesEnviadas,
        erros: erros,
        message: `Lembretes enviados: ${notificacoesEnviadas} notificações`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Erro no envio de lembretes:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        success: false
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});