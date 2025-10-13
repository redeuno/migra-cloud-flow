-- FASE 1.1: Correção de tipo_usuario para admin arena
-- Corrigir admin.arena@verana.com de 'cliente' para 'funcionario'
UPDATE public.usuarios
SET tipo_usuario = 'funcionario'
WHERE email = 'admin.arena@verana.com';

-- FASE 1.5: Criar índices para performance
-- Índice para agendamentos por arena e data
CREATE INDEX IF NOT EXISTS idx_agendamentos_arena_data 
ON public.agendamentos(arena_id, data_agendamento);

-- Índice para mensalidades por contrato
CREATE INDEX IF NOT EXISTS idx_mensalidades_contrato_ref 
ON public.mensalidades(contrato_id, referencia);

-- Índice para user_roles por user_id e role
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role 
ON public.user_roles(user_id, role);

-- FASE 1.5: Trigger automático para novos usuários
-- Implementar handle_new_user() function melhorada
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log do novo usuário para debug
  RAISE LOG 'Novo usuário criado: %', NEW.id;
  
  -- Por enquanto apenas log
  -- Em futuro: criar registro em usuarios automaticamente
  -- baseado em raw_user_meta_data
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Não bloquear signup em caso de erro
    RAISE WARNING 'Erro em handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();