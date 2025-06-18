
-- 为 profiles 表添加密码哈希字段
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS password_salt TEXT,
ADD COLUMN IF NOT EXISTS password_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- 添加密码重置相关字段
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS reset_token TEXT,
ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMP WITH TIME ZONE;

-- 创建密码历史表（防止重复使用旧密码）
CREATE TABLE IF NOT EXISTS public.password_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 为密码历史表启用 RLS
ALTER TABLE public.password_history ENABLE ROW LEVEL SECURITY;

-- 创建密码历史表的 RLS 策略
CREATE POLICY "Users can view their own password history" 
  ON public.password_history 
  FOR SELECT 
  USING (user_id IN (SELECT id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "System can insert password history" 
  ON public.password_history 
  FOR INSERT 
  WITH CHECK (true);

-- 改进 JWT 密钥表结构
ALTER TABLE public.jwt_keys 
ADD COLUMN IF NOT EXISTS key_size INTEGER DEFAULT 2048,
ADD COLUMN IF NOT EXISTS key_format TEXT DEFAULT 'PKCS8';

-- 创建认证尝试日志表
CREATE TABLE IF NOT EXISTS public.auth_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT false,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 为认证尝试表启用 RLS
ALTER TABLE public.auth_attempts ENABLE ROW LEVEL SECURITY;

-- 创建认证尝试的 RLS 策略（只有系统可以访问）
CREATE POLICY "Only system can manage auth attempts" 
  ON public.auth_attempts 
  FOR ALL 
  USING (false)
  WITH CHECK (false);

-- 创建函数来生成密码哈希
CREATE OR REPLACE FUNCTION public.hash_password(password TEXT, salt TEXT DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  password_salt TEXT;
  hashed_password TEXT;
BEGIN
  -- 如果没有提供 salt，生成一个新的
  IF salt IS NULL THEN
    password_salt := encode(gen_random_bytes(32), 'base64');
  ELSE
    password_salt := salt;
  END IF;
  
  -- 使用 crypt 函数生成哈希（需要 pgcrypto 扩展）
  -- 这里使用简化版本，实际生产环境建议使用更强的哈希算法
  hashed_password := encode(digest(password || password_salt, 'sha256'), 'hex');
  
  RETURN password_salt || ':' || hashed_password;
END;
$$;

-- 创建函数来验证密码
CREATE OR REPLACE FUNCTION public.verify_password(password TEXT, stored_hash TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  password_salt TEXT;
  stored_password TEXT;
  computed_hash TEXT;
BEGIN
  -- 解析存储的哈希
  password_salt := split_part(stored_hash, ':', 1);
  stored_password := split_part(stored_hash, ':', 2);
  
  -- 计算输入密码的哈希
  computed_hash := encode(digest(password || password_salt, 'sha256'), 'hex');
  
  -- 比较哈希值
  RETURN computed_hash = stored_password;
END;
$$;

-- 确保 pgcrypto 扩展已启用（用于密码哈希）
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 创建触发器函数来更新密码更新时间
CREATE OR REPLACE FUNCTION public.update_password_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.password_hash IS DISTINCT FROM NEW.password_hash THEN
    NEW.password_updated_at := now();
  END IF;
  RETURN NEW;
END;
$$;

-- 创建触发器
DROP TRIGGER IF EXISTS update_password_timestamp_trigger ON public.profiles;
CREATE TRIGGER update_password_timestamp_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_password_timestamp();
