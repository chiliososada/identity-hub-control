
-- 先删除依赖的触发器
DROP TRIGGER IF EXISTS update_password_timestamp_trigger ON public.profiles;

-- 然后删除函数
DROP FUNCTION IF EXISTS public.update_password_timestamp() CASCADE;

-- 删除相关表
DROP TABLE IF EXISTS public.jwt_keys CASCADE;
DROP TABLE IF EXISTS public.oauth_clients CASCADE;
DROP TABLE IF EXISTS public.auth_tokens CASCADE;
DROP TABLE IF EXISTS public.auth_attempts CASCADE;
DROP TABLE IF EXISTS public.password_history CASCADE;

-- 修改 profiles 表结构
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS password_hash,
DROP COLUMN IF EXISTS password_salt,
DROP COLUMN IF EXISTS password_updated_at,
DROP COLUMN IF EXISTS reset_token,
DROP COLUMN IF EXISTS reset_token_expires_at,
DROP COLUMN IF EXISTS login_attempts,
DROP COLUMN IF EXISTS locked_until,
DROP COLUMN IF EXISTS last_ip_address;

-- 添加 auth_user_id 字段关联 Supabase Auth
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 创建唯一索引确保一对一关系
CREATE UNIQUE INDEX IF NOT EXISTS profiles_auth_user_id_key ON public.profiles(auth_user_id);

-- 创建触发器函数：当 auth.users 创建时自动创建 profiles 记录
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (
    auth_user_id,
    email,
    full_name,
    role,
    is_active
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'member',
    true
  );
  RETURN NEW;
END;
$$;

-- 创建触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 创建触发器函数：同步用户基本信息更新
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    email = NEW.email,
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    updated_at = now()
  WHERE auth_user_id = NEW.id;
  RETURN NEW;
END;
$$;

-- 创建更新触发器
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

-- 更新 RLS 策略使用 auth.uid()
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth_user_id = auth.uid());

CREATE POLICY "Users can update own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth_user_id = auth.uid());

-- 管理员可以查看和管理所有用户
CREATE POLICY "Admins can manage all profiles" 
  ON public.profiles 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  );

-- 删除不再需要的函数
DROP FUNCTION IF EXISTS public.hash_password(text, text) CASCADE;
DROP FUNCTION IF EXISTS public.verify_password(text, text) CASCADE;
