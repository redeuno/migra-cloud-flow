-- PASSO 1: Criar Arena Demo
INSERT INTO public.arenas (
  id,
  tenant_id,
  nome,
  razao_social,
  cnpj,
  telefone,
  whatsapp,
  email,
  endereco_completo,
  horario_funcionamento,
  status,
  data_vencimento
) VALUES (
  gen_random_uuid(),
  gen_random_uuid(),
  'Arena Verana Demo',
  'Verana Beach Tennis LTDA',
  '00.000.000/0001-00',
  '(11) 99999-9999',
  '(11) 99999-9999',
  'mantovani.bruno@gmail.com',
  '{"rua": "Rua Demo", "numero": "100", "bairro": "Centro", "cidade": "São Paulo", "estado": "SP", "cep": "01000-000"}'::jsonb,
  '{"segunda": {"inicio": "06:00", "fim": "23:00"}, "terca": {"inicio": "06:00", "fim": "23:00"}, "quarta": {"inicio": "06:00", "fim": "23:00"}, "quinta": {"inicio": "06:00", "fim": "23:00"}, "sexta": {"inicio": "06:00", "fim": "23:00"}, "sabado": {"inicio": "07:00", "fim": "22:00"}, "domingo": {"inicio": "07:00", "fim": "20:00"}}'::jsonb,
  'ativo',
  CURRENT_DATE + INTERVAL '30 days'
);

-- PASSO 2: Criar Usuário na tabela usuarios
INSERT INTO public.usuarios (
  id,
  auth_id,
  arena_id,
  nome_completo,
  email,
  telefone,
  cpf,
  data_nascimento,
  tipo_usuario,
  aceite_termos
) VALUES (
  gen_random_uuid(),
  'f9840ebc-8402-42f1-a3cc-735fe22a565b'::uuid,
  (SELECT id FROM public.arenas WHERE email = 'mantovani.bruno@gmail.com'),
  'Bruno Mantovani',
  'mantovani.bruno@gmail.com',
  '(11) 99999-9999',
  '000.000.000-00',
  '1990-01-01',
  'super_admin',
  true
);

-- PASSO 3: Atribuir role SUPER_ADMIN
INSERT INTO public.user_roles (
  user_id,
  arena_id,
  role
) VALUES (
  'f9840ebc-8402-42f1-a3cc-735fe22a565b'::uuid,
  (SELECT id FROM public.arenas WHERE email = 'mantovani.bruno@gmail.com'),
  'super_admin'
);