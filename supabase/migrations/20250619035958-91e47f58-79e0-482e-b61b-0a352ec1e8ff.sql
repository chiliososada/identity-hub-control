
-- 创建一个测试管理员账户
INSERT INTO public.profiles (
  email, 
  password_hash, 
  full_name, 
  first_name,
  last_name,
  role, 
  is_active,
  is_test_account
) VALUES (
  'admin@test.com',
  public.hash_password('admin123'),
  '测试管理员',
  '测试',
  '管理员',
  'admin',
  true,
  true
);

-- 创建一个普通测试用户账户
INSERT INTO public.profiles (
  email, 
  password_hash, 
  full_name, 
  first_name,
  last_name,
  role, 
  is_active,
  is_test_account
) VALUES (
  'user@test.com',
  public.hash_password('user123'),
  '测试用户',
  '测试',
  '用户',
  'member',
  true,
  true
);
