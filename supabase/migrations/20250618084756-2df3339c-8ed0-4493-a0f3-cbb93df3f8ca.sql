
-- 临时禁用tenants表的RLS，创建管理员用户和初始租户后再启用
ALTER TABLE public.tenants DISABLE ROW LEVEL SECURITY;

-- 同时也禁用其他相关表的RLS，确保管理功能正常工作
ALTER TABLE public.oauth_clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_members DISABLE ROW LEVEL SECURITY;
