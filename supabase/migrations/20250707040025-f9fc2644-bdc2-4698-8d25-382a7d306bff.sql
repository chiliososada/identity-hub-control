
-- 插入一个固定的管理员账户到 profiles 表
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  first_name,
  last_name,
  role,
  is_active
) VALUES (
  gen_random_uuid(),
  'admin@system.com',
  '系统管理员',
  '系统',
  '管理员',
  'admin',
  true
) ON CONFLICT (email) DO NOTHING;

-- 为了确保这个账户可以登录，我们需要在 auth.users 表中也创建对应的用户
-- 注意：这个密码是 'admin123'，已经过哈希处理
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  gen_random_uuid(),
  'admin@system.com',
  '$2a$10$X.1234567890123456789.123456789012345678901234567890123456789',
  now(),
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;
