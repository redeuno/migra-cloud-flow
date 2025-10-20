-- ============================================
-- MIGRATION COMPLETA: FASES 2-5
-- Correção Estrutural do Sistema de Roles
-- ============================================

BEGIN;

-- ============================================
-- FASE 1: LIMPEZA DE DADOS (Preparação)
-- ============================================

-- Remover usuários órfãos sem auth_id (se existirem)
DELETE FROM usuarios WHERE auth_id IS NULL;

-- Remover user_roles órfãos
DELETE FROM user_roles 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Remover duplicatas em user_roles (manter o mais antigo)
DELETE FROM user_roles a
USING user_roles b
WHERE a.id > b.id 
  AND a.user_id = b.user_id 
  AND a.role = b.role 
  AND a.arena_id IS NOT DISTINCT FROM b.arena_id;


-- ============================================
-- FASE 2: CONSTRAINTS & FOREIGN KEYS
-- ============================================

-- 2.1: Adicionar UNIQUE constraint em usuarios.auth_id
ALTER TABLE usuarios 
  DROP CONSTRAINT IF EXISTS usuarios_auth_id_key;
  
ALTER TABLE usuarios 
  ADD CONSTRAINT usuarios_auth_id_key UNIQUE (auth_id);

-- 2.2: Adicionar NOT NULL constraint em usuarios.auth_id
ALTER TABLE usuarios 
  ALTER COLUMN auth_id SET NOT NULL;

-- 2.3: Adicionar Foreign Key usuarios.auth_id -> auth.users(id)
ALTER TABLE usuarios 
  DROP CONSTRAINT IF EXISTS usuarios_auth_id_fkey;
  
ALTER TABLE usuarios 
  ADD CONSTRAINT usuarios_auth_id_fkey 
  FOREIGN KEY (auth_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- 2.4: Função de validação arena_id
CREATE OR REPLACE FUNCTION validate_usuario_arena_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_super_admin BOOLEAN;
BEGIN
  -- Verificar se usuário é super_admin
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = NEW.auth_id 
      AND role = 'super_admin'
  ) INTO v_is_super_admin;

  -- Super admin pode ter arena_id NULL
  IF v_is_super_admin THEN
    RETURN NEW;
  END IF;

  -- Outros usuários DEVEM ter arena_id
  IF NEW.arena_id IS NULL THEN
    RAISE EXCEPTION 'arena_id é obrigatório para usuários não super_admin';
  END IF;

  RETURN NEW;
END;
$$;

-- 2.5: Trigger de validação arena_id
DROP TRIGGER IF EXISTS trg_validate_usuario_arena_id ON usuarios;

CREATE TRIGGER trg_validate_usuario_arena_id
  BEFORE INSERT OR UPDATE ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION validate_usuario_arena_id();


-- ============================================
-- FASE 3: TRIGGERS FUNCIONÁRIOS
-- ============================================

-- 3.1: Auto-criação de funcionário
CREATE OR REPLACE FUNCTION auto_create_funcionario()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.tipo_usuario = 'funcionario' THEN
    INSERT INTO funcionarios (
      usuario_id,
      arena_id,
      cargo,
      data_admissao,
      horario_trabalho,
      permissoes,
      status
    ) VALUES (
      NEW.id,
      NEW.arena_id,
      'Funcionário', -- Cargo padrão
      CURRENT_DATE,
      '{}'::jsonb,
      '[]'::jsonb,
      NEW.status
    )
    ON CONFLICT (usuario_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- 3.2: Trigger auto-criação funcionário
DROP TRIGGER IF EXISTS trigger_auto_create_funcionario ON usuarios;

CREATE TRIGGER trigger_auto_create_funcionario
  AFTER INSERT OR UPDATE ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_funcionario();

-- 3.3: Sincronização user_role para funcionário
CREATE OR REPLACE FUNCTION sync_user_role_funcionario()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT auth_id INTO v_auth_id FROM usuarios WHERE id = NEW.usuario_id;
    IF v_auth_id IS NOT NULL THEN
      INSERT INTO user_roles (user_id, arena_id, role)
      VALUES (v_auth_id, NEW.arena_id, 'funcionario'::app_role)
      ON CONFLICT (user_id, role, arena_id) DO NOTHING;
    END IF;
    RETURN NEW;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Remove role antiga se arena mudou
    SELECT auth_id INTO v_auth_id FROM usuarios WHERE id = OLD.usuario_id;
    IF v_auth_id IS NOT NULL AND OLD.arena_id IS DISTINCT FROM NEW.arena_id THEN
      DELETE FROM user_roles 
      WHERE user_id = v_auth_id 
        AND arena_id = OLD.arena_id 
        AND role = 'funcionario'::app_role;
    END IF;

    -- Adiciona nova role
    SELECT auth_id INTO v_auth_id FROM usuarios WHERE id = NEW.usuario_id;
    IF v_auth_id IS NOT NULL AND (NEW.status IS NULL OR NEW.status <> 'inativo') THEN
      INSERT INTO user_roles (user_id, arena_id, role)
      VALUES (v_auth_id, NEW.arena_id, 'funcionario'::app_role)
      ON CONFLICT (user_id, role, arena_id) DO NOTHING;
    END IF;
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    SELECT auth_id INTO v_auth_id FROM usuarios WHERE id = OLD.usuario_id;
    IF v_auth_id IS NOT NULL THEN
      DELETE FROM user_roles 
      WHERE user_id = v_auth_id 
        AND arena_id = OLD.arena_id 
        AND role = 'funcionario'::app_role;
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- 3.4: Trigger sincronização funcionário
DROP TRIGGER IF EXISTS trg_sync_user_role_funcionario ON funcionarios;

CREATE TRIGGER trg_sync_user_role_funcionario
  AFTER INSERT OR UPDATE OR DELETE ON funcionarios
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_role_funcionario();


-- ============================================
-- FASE 4: INDEXES DE PERFORMANCE
-- ============================================

-- Indexes em usuarios
CREATE INDEX IF NOT EXISTS idx_usuarios_auth_id 
  ON usuarios(auth_id);
  
CREATE INDEX IF NOT EXISTS idx_usuarios_arena_id 
  ON usuarios(arena_id) 
  WHERE arena_id IS NOT NULL;
  
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo_usuario 
  ON usuarios(tipo_usuario);

-- Indexes em user_roles (se não existirem)
CREATE INDEX IF NOT EXISTS idx_user_roles_arena_id 
  ON user_roles(arena_id) 
  WHERE arena_id IS NOT NULL;
  
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id 
  ON user_roles(user_id);
  
CREATE INDEX IF NOT EXISTS idx_user_roles_composite 
  ON user_roles(user_id, arena_id);

-- Indexes em professores
CREATE INDEX IF NOT EXISTS idx_professores_usuario_id 
  ON professores(usuario_id);

-- Indexes em funcionarios
CREATE INDEX IF NOT EXISTS idx_funcionarios_usuario_id 
  ON funcionarios(usuario_id);


-- ============================================
-- FASE 5: SIGNUP AUTOMATION
-- ============================================

-- 5.1: Reescrever handle_new_user para criar usuarios automaticamente
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tipo_usuario text;
  v_arena_id uuid;
  v_role app_role;
  v_usuario_id uuid;
BEGIN
  -- Extrair metadados do signup
  v_tipo_usuario := COALESCE(
    NEW.raw_user_meta_data->>'tipo_usuario',
    'aluno'
  );
  
  v_arena_id := (NEW.raw_user_meta_data->>'arena_id')::uuid;

  -- Super admin não precisa de arena_id
  IF v_tipo_usuario = 'super_admin' THEN
    v_arena_id := NULL;
  END IF;

  -- Validar arena_id para outros tipos
  IF v_tipo_usuario <> 'super_admin' AND v_arena_id IS NULL THEN
    RAISE WARNING 'arena_id ausente para tipo_usuario: %', v_tipo_usuario;
    -- Não bloquear signup, apenas avisar
  END IF;

  -- Criar registro em usuarios
  INSERT INTO usuarios (
    auth_id,
    arena_id,
    nome_completo,
    email,
    telefone,
    tipo_usuario,
    status
  ) VALUES (
    NEW.id,
    v_arena_id,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', NEW.email),
    NEW.email,
    NEW.raw_user_meta_data->>'telefone',
    v_tipo_usuario,
    'ativo'
  )
  RETURNING id INTO v_usuario_id;

  -- Mapear tipo_usuario para app_role
  CASE v_tipo_usuario
    WHEN 'super_admin' THEN v_role := 'super_admin'::app_role;
    WHEN 'arena_admin' THEN v_role := 'arena_admin'::app_role;
    WHEN 'funcionario' THEN v_role := 'funcionario'::app_role;
    WHEN 'professor' THEN v_role := 'professor'::app_role;
    WHEN 'aluno' THEN v_role := 'aluno'::app_role;
    ELSE v_role := 'aluno'::app_role;
  END CASE;

  -- Criar user_role
  INSERT INTO user_roles (user_id, arena_id, role)
  VALUES (NEW.id, v_arena_id, v_role)
  ON CONFLICT (user_id, role, arena_id) DO NOTHING;

  -- Triggers de professores/funcionarios já cuidam da criação automática

  RAISE LOG 'Usuário criado com sucesso: % (tipo: %, role: %)', 
    NEW.email, v_tipo_usuario, v_role;

  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Não bloquear signup em caso de erro
    RAISE WARNING 'Erro em handle_new_user para %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$;

-- 5.2: Recriar trigger no auth.users (se não existir)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();


-- ============================================
-- VALIDAÇÕES FINAIS
-- ============================================

-- Validar que todos os usuarios têm auth_id
DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count FROM usuarios WHERE auth_id IS NULL;
  IF v_count > 0 THEN
    RAISE EXCEPTION 'Ainda existem % usuários sem auth_id', v_count;
  END IF;
  
  RAISE NOTICE '✅ Validação: Todos os usuários têm auth_id';
END $$;

-- Validar que non-super-admins têm arena_id
DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count 
  FROM usuarios u
  WHERE u.arena_id IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = u.auth_id 
        AND ur.role = 'super_admin'
    );
    
  IF v_count > 0 THEN
    RAISE WARNING 'Existem % usuários não-super-admin sem arena_id', v_count;
  ELSE
    RAISE NOTICE '✅ Validação: Todos os não-super-admins têm arena_id';
  END IF;
END $$;

COMMIT;

-- ============================================
-- RESUMO DA MIGRATION
-- ============================================
-- ✅ FASE 1: Dados limpos
-- ✅ FASE 2: Constraints e FK em usuarios.auth_id + validação arena_id
-- ✅ FASE 3: Triggers completos para funcionarios
-- ✅ FASE 4: 8 indexes de performance criados
-- ✅ FASE 5: handle_new_user() completo com signup automation
-- ============================================