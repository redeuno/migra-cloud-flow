import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Arena {
  id: string;
  nome: string;
  status: string;
  data_vencimento: string;
}

interface Fatura {
  id: string;
  arena_id: string;
  numero_fatura: string;
  competencia: string;
  data_vencimento: string;
  valor: number;
  status_pagamento: string;
  arenas: {
    nome: string;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 Iniciando verificação de vencimentos de faturas...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const hoje = new Date().toISOString().split('T')[0];
    
    // 1. Buscar faturas vencidas (status pendente e vencimento passou)
    console.log('📋 Buscando faturas vencidas...');
    const { data: faturasVencidas, error: errorVencidas } = await supabase
      .from('faturas_sistema')
      .select(`
        id,
        arena_id,
        numero_fatura,
        competencia,
        data_vencimento,
        valor,
        status_pagamento,
        arenas (nome)
      `)
      .eq('status_pagamento', 'pendente')
      .lt('data_vencimento', hoje);

    if (errorVencidas) {
      throw errorVencidas;
    }

    console.log(`📊 ${faturasVencidas?.length || 0} faturas vencidas encontradas`);

    let arenasProcessadas = 0;
    let faturasMarcadas = 0;

    // 2. Para cada fatura vencida, suspender arena e notificar
    if (faturasVencidas && faturasVencidas.length > 0) {
      for (const fatura of faturasVencidas as unknown as Fatura[]) {
        try {
          // 2.1. Atualizar status da fatura para vencida
          const { error: errorUpdateFatura } = await supabase
            .from('faturas_sistema')
            .update({
              status_pagamento: 'vencido',
              historico_status: supabase.rpc('jsonb_append', {
                target: 'historico_status',
                value: {
                  status: 'vencido',
                  data: new Date().toISOString(),
                  observacao: 'Fatura vencida - verificação automática'
                }
              })
            })
            .eq('id', fatura.id);

          if (errorUpdateFatura) {
            console.error(`❌ Erro ao atualizar fatura ${fatura.numero_fatura}:`, errorUpdateFatura);
            continue;
          }

          faturasMarcadas++;

          // 2.2. Suspender arena se ainda está ativa
          const { data: arena, error: errorArena } = await supabase
            .from('arenas')
            .select('id, status')
            .eq('id', fatura.arena_id)
            .single();

          if (errorArena) {
            console.error(`❌ Erro ao buscar arena ${fatura.arena_id}:`, errorArena);
            continue;
          }

          if (arena.status === 'ativo') {
            // Suspender arena
            const { error: errorSuspender } = await supabase
              .from('arenas')
              .update({ 
                status: 'suspenso',
                updated_at: new Date().toISOString()
              })
              .eq('id', fatura.arena_id);

            if (errorSuspender) {
              console.error(`❌ Erro ao suspender arena ${fatura.arena_id}:`, errorSuspender);
              continue;
            }

            arenasProcessadas++;
            console.log(`🚫 Arena ${fatura.arenas.nome} suspensa por inadimplência`);

            // 2.3. Notificar Arena Admin
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
                  .select('id')
                  .eq('auth_id', admin.user_id)
                  .single();

                if (usuario) {
                  await supabase
                    .from('notificacoes')
                    .insert({
                      usuario_id: usuario.id,
                      arena_id: fatura.arena_id,
                      tipo: 'pagamento_vencido',
                      titulo: '🚫 Arena Suspensa por Inadimplência',
                      mensagem: `A fatura ${fatura.numero_fatura} no valor de R$ ${fatura.valor} venceu e sua arena foi suspensa. Regularize o pagamento para reativar o acesso.`,
                      link: '/configuracoes-arena',
                      metadata: {
                        fatura_id: fatura.id,
                        numero_fatura: fatura.numero_fatura,
                        valor: fatura.valor
                      }
                    });
                }
              }
            }
          }
        } catch (error) {
          console.error(`❌ Erro ao processar fatura ${fatura.numero_fatura}:`, error);
        }
      }
    }

    // 3. Registrar atividade
    await supabase
      .from('historico_atividades')
      .insert({
        usuario_id: '00000000-0000-0000-0000-000000000000', // Sistema
        tipo_acao: 'verificacao_vencimentos',
        descricao: `Verificação automática: ${faturasMarcadas} faturas marcadas como vencidas, ${arenasProcessadas} arenas suspensas`,
        metadata: {
          faturas_vencidas: faturasVencidas?.length || 0,
          faturas_marcadas: faturasMarcadas,
          arenas_suspensas: arenasProcessadas,
          data_execucao: new Date().toISOString()
        }
      });

    console.log('✅ Verificação concluída');

    return new Response(
      JSON.stringify({
        success: true,
        faturas_vencidas: faturasVencidas?.length || 0,
        faturas_marcadas: faturasMarcadas,
        arenas_suspensas: arenasProcessadas,
        message: `Verificação concluída: ${faturasMarcadas} faturas marcadas, ${arenasProcessadas} arenas suspensas`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Erro na verificação de vencimentos:', error);
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