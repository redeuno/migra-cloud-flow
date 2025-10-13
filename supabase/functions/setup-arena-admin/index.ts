import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    console.log('Creating auth user for admin.arena@verana.com...');

    // 1. Criar usuário auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: 'admin.arena@verana.com',
      password: 'Admin123!',
      email_confirm: true,
      user_metadata: {
        nome_completo: 'Admin Arena Verana'
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      throw authError;
    }

    console.log('Auth user created:', authUser.user.id);

    // 2. Atualizar tabela usuarios com auth_id
    const { error: updateError } = await supabaseAdmin
      .from('usuarios')
      .update({ auth_id: authUser.user.id })
      .eq('email', 'admin.arena@verana.com');

    if (updateError) {
      console.error('Error updating usuarios:', updateError);
      throw updateError;
    }

    console.log('Updated usuarios table with auth_id');

    // 3. Inserir role arena_admin
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: authUser.user.id,
        role: 'arena_admin',
        arena_id: '53b6b586-7482-466f-8bf6-290f814d43d9'
      });

    if (roleError) {
      console.error('Error inserting role:', roleError);
      throw roleError;
    }

    console.log('Role arena_admin added successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Admin da arena criado com sucesso',
        user: {
          id: authUser.user.id,
          email: authUser.user.email
        }
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
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
