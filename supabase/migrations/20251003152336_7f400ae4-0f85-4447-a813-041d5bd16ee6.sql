-- Corrigir função handle_new_user para incluir search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Por enquanto, apenas log do novo usuário
  -- TODO: Implementar lógica de criação automática
  RETURN NEW;
END;
$function$;

-- Habilitar RLS em tabelas que estão sem proteção
ALTER TABLE public.modulos_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos_sistema ENABLE ROW LEVEL SECURITY;

-- Criar policies para modulos_sistema (visível para todos autenticados)
CREATE POLICY "Modulos visiveis para autenticados"
ON public.modulos_sistema
FOR SELECT
TO authenticated
USING (true);

-- Super admin pode gerenciar modulos
CREATE POLICY "Super admin gerencia modulos"
ON public.modulos_sistema
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  )
);

-- Criar policies para planos_sistema (visível para todos autenticados)
CREATE POLICY "Planos visiveis para autenticados"
ON public.planos_sistema
FOR SELECT
TO authenticated
USING (true);

-- Super admin pode gerenciar planos
CREATE POLICY "Super admin gerencia planos"
ON public.planos_sistema
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  )
);