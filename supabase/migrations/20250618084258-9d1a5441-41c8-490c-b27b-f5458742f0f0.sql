
-- 临时禁用profiles表的RLS，创建第一个管理员用户后再启用
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
