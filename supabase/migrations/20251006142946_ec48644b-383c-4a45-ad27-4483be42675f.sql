-- Fix test client auth_id to enable login and complete Phase 1

-- First, create an auth user for the test client
-- Note: In production, users should sign up via the UI
-- This is only for testing purposes
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
SELECT
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'joao.teste@example.com',
  crypt('Teste@123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"nome_completo":"João da Silva"}',
  false,
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  ''
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'joao.teste@example.com'
);

-- Update the test client with the correct auth_id
UPDATE usuarios
SET auth_id = (SELECT id FROM auth.users WHERE email = 'joao.teste@example.com')
WHERE email = 'joao.teste@example.com'
  AND auth_id IS NULL;

-- Verify the update
DO $$
DECLARE
  test_user_auth_id uuid;
BEGIN
  SELECT auth_id INTO test_user_auth_id 
  FROM usuarios 
  WHERE email = 'joao.teste@example.com';
  
  IF test_user_auth_id IS NULL THEN
    RAISE EXCEPTION 'Failed to update test client auth_id';
  ELSE
    RAISE NOTICE 'Test client João da Silva auth_id updated successfully';
  END IF;
END $$;