import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_EMAIL = 'admin.arena@verana.com';
const DEFAULT_ARENA_ID = '53b6b586-7482-466f-8bf6-290f814d43d9';
const BRUNO_EMAIL = 'mantovani.bruno@gmail.com';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const body = await req.json().catch(() => ({}));
    const email = body.email || DEFAULT_EMAIL;
    const arenaId = body.arenaId || DEFAULT_ARENA_ID;

    console.log(`Setup for ${email} in arena ${arenaId}`);

    const summary = {
      adminLinked: false,
      roleSet: false,
      brunoRoleFixed: false,
      quadrasCreated: 0,
      professorCreated: false,
      agendamentosCreated: 0,
      aulasCreated: 0
    };

    // 1. Obter ou criar usuário no Auth
    let authUserId: string;
    
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: 'Admin123!',
      email_confirm: true,
      user_metadata: { nome_completo: 'Admin Arena Verana' }
    });

    if (createError) {
      if (createError.message.includes('already registered')) {
        console.log('User already exists, finding by email...');
        
        // Procurar usuário existente
        let found = false;
        let page = 1;
        
        while (!found && page < 10) {
          const { data: listData } = await supabaseAdmin.auth.admin.listUsers({
            page,
            perPage: 1000
          });
          
          const existingUser = listData?.users?.find(u => u.email === email);
          if (existingUser) {
            authUserId = existingUser.id;
            found = true;
            console.log('Found existing user:', authUserId);
          } else {
            page++;
          }
        }
        
        if (!found) {
          throw new Error('User exists in Auth but could not be located');
        }
      } else {
        throw createError;
      }
    } else {
      authUserId = createData.user.id;
      console.log('Created new auth user:', authUserId);
    }

    // 2. Upsert em usuarios
    const { data: existingUsuario } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUsuario) {
      await supabaseAdmin
        .from('usuarios')
        .update({ auth_id: authUserId, arena_id: arenaId })
        .eq('email', email);
      console.log('Updated existing usuario');
    } else {
      await supabaseAdmin
        .from('usuarios')
        .insert({
          auth_id: authUserId,
          email,
          nome_completo: 'Admin Arena Verana',
          cpf: '12345678900',
          telefone: '11999999999',
          data_nascimento: '1990-01-01',
          tipo_usuario: 'funcionario',
          arena_id: arenaId,
          status: 'ativo',
          aceite_termos: true
        });
      console.log('Inserted new usuario');
    }
    summary.adminLinked = true;

    // 3. Garantir role arena_admin (remover duplicadas)
    await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', authUserId)
      .eq('role', 'arena_admin');

    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: authUserId,
        role: 'arena_admin',
        arena_id: arenaId
      });

    if (!roleError) {
      summary.roleSet = true;
      console.log('Role arena_admin set');
    }

    // 4. Corrigir role do Bruno
    const { data: brunoUsuario } = await supabaseAdmin
      .from('usuarios')
      .select('auth_id')
      .eq('email', BRUNO_EMAIL)
      .single();

    if (brunoUsuario?.auth_id) {
      const { error: deleteRoleError } = await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', brunoUsuario.auth_id)
        .eq('role', 'arena_admin');

      if (!deleteRoleError) {
        summary.brunoRoleFixed = true;
        console.log('Bruno role fixed');
      }
    }

    // 5. Popular quadras (se não existirem)
    const { count: quadrasCount } = await supabaseAdmin
      .from('quadras')
      .select('*', { count: 'exact', head: true })
      .eq('arena_id', arenaId);

    if (!quadrasCount || quadrasCount === 0) {
      const quadras = [
        { nome: 'Quadra Central', numero: 1, tipo_esporte: 'beach_tennis', tipo_piso: 'areia', valor_hora_normal: 100, valor_hora_pico: 150, cobertura: true, iluminacao: true },
        { nome: 'Quadra Norte', numero: 2, tipo_esporte: 'beach_tennis', tipo_piso: 'areia', valor_hora_normal: 80, valor_hora_pico: 120, cobertura: false, iluminacao: true },
        { nome: 'Quadra Sul', numero: 3, tipo_esporte: 'beach_tennis', tipo_piso: 'areia', valor_hora_normal: 80, valor_hora_pico: 120, cobertura: false, iluminacao: false },
        { nome: 'Quadra VIP', numero: 4, tipo_esporte: 'beach_tennis', tipo_piso: 'areia_premium', valor_hora_normal: 200, valor_hora_pico: 250, cobertura: true, iluminacao: true }
      ];

      for (const quadra of quadras) {
        await supabaseAdmin.from('quadras').insert({ ...quadra, arena_id: arenaId, status: 'ativa', capacidade_jogadores: 4 });
        summary.quadrasCreated++;
      }
      console.log('Created 4 quadras');
    }

    // 6. Garantir professor
    const { data: joaoUsuario } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('email', 'joao.teste@example.com')
      .single();

    if (joaoUsuario) {
      const { count: professorCount } = await supabaseAdmin
        .from('professores')
        .select('*', { count: 'exact', head: true })
        .eq('arena_id', arenaId);

      if (!professorCount || professorCount === 0) {
        await supabaseAdmin.from('professores').insert({
          arena_id: arenaId,
          usuario_id: joaoUsuario.id,
          valor_hora_aula: 150,
          status: 'ativo',
          especialidades: ['iniciante', 'intermediario'],
          disponibilidade: {}
        });
        summary.professorCreated = true;
        console.log('Created professor');
      }
    }

    // 7. Popular agendamentos (se não existirem)
    const { count: agendamentosCount } = await supabaseAdmin
      .from('agendamentos')
      .select('*', { count: 'exact', head: true })
      .eq('arena_id', arenaId);

    if (!agendamentosCount || agendamentosCount === 0) {
      const { data: quadras } = await supabaseAdmin
        .from('quadras')
        .select('id')
        .eq('arena_id', arenaId)
        .limit(4);

      if (quadras && quadras.length > 0 && joaoUsuario) {
        for (let i = 0; i < 10; i++) {
          const randomQuadra = quadras[Math.floor(Math.random() * quadras.length)];
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + i);

          await supabaseAdmin.from('agendamentos').insert({
            arena_id: arenaId,
            quadra_id: randomQuadra.id,
            cliente_id: joaoUsuario.id,
            data_agendamento: futureDate.toISOString().split('T')[0],
            hora_inicio: '09:00',
            hora_fim: '10:00',
            modalidade: 'beach_tennis',
            tipo_agendamento: 'avulso',
            valor_total: 100,
            status: 'confirmado',
            status_pagamento: 'pago'
          });
          summary.agendamentosCreated++;
        }
        console.log('Created 10 agendamentos');
      }
    }

    // 8. Popular aulas (se não existirem)
    const { count: aulasCount } = await supabaseAdmin
      .from('aulas')
      .select('*', { count: 'exact', head: true })
      .eq('arena_id', arenaId);

    if (!aulasCount || aulasCount === 0) {
      const { data: professor } = await supabaseAdmin
        .from('professores')
        .select('id')
        .eq('arena_id', arenaId)
        .limit(1)
        .single();

      const { data: quadra } = await supabaseAdmin
        .from('quadras')
        .select('id')
        .eq('arena_id', arenaId)
        .limit(1)
        .single();

      if (professor && quadra) {
        const aulas = [
          { titulo: 'Aula de Beach Tennis - Iniciantes', tipo_aula: 'grupo', dias: 1, hora_inicio: '10:00', hora_fim: '11:00', duracao: 60, max_alunos: 8, valor: 50 },
          { titulo: 'Aula Particular - Avançado', tipo_aula: 'particular', dias: 2, hora_inicio: '14:00', hora_fim: '15:00', duracao: 60, max_alunos: 1, valor: 150 },
          { titulo: 'Aula em Grupo - Intermediário', tipo_aula: 'grupo', dias: 3, hora_inicio: '16:00', hora_fim: '17:30', duracao: 90, max_alunos: 6, valor: 75 }
        ];

        for (const aula of aulas) {
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + aula.dias);

          await supabaseAdmin.from('aulas').insert({
            arena_id: arenaId,
            professor_id: professor.id,
            quadra_id: quadra.id,
            titulo: aula.titulo,
            tipo_aula: aula.tipo_aula,
            data_aula: futureDate.toISOString().split('T')[0],
            hora_inicio: aula.hora_inicio,
            hora_fim: aula.hora_fim,
            duracao_minutos: aula.duracao,
            max_alunos: aula.max_alunos,
            valor_por_aluno: aula.valor,
            status: 'agendada'
          });
          summary.aulasCreated++;
        }
        console.log('Created 3 aulas');
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Configuração completa executada com sucesso',
        summary
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in setup-arena-admin:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
