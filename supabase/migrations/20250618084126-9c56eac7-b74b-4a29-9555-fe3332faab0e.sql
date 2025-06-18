
-- 首先删除有问题的策略
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can create profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all tenants" ON public.tenants;
DROP POLICY IF EXISTS "Admins can update all tenants" ON public.tenants;
DROP POLICY IF EXISTS "Admins can create tenants" ON public.tenants;
DROP POLICY IF EXISTS "Admins can view all oauth_clients" ON public.oauth_clients;
DROP POLICY IF EXISTS "Admins can update all oauth_clients" ON public.oauth_clients;
DROP POLICY IF EXISTS "Admins can create oauth_clients" ON public.oauth_clients;
DROP POLICY IF EXISTS "Admins can view all tenant_members" ON public.tenant_members;
DROP POLICY IF EXISTS "Admins can update all tenant_members" ON public.tenant_members;
DROP POLICY IF EXISTS "Admins can create tenant_members" ON public.tenant_members;

-- 创建一个安全定义器函数来检查用户角色，避免递归
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- 为profiles表创建新的策略
CREATE POLICY "Admins can view all profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (public.get_current_user_role() IN ('admin', 'owner'));

CREATE POLICY "Admins can update all profiles" 
  ON public.profiles 
  FOR UPDATE 
  USING (public.get_current_user_role() IN ('admin', 'owner'));

CREATE POLICY "Admins can create profiles" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (public.get_current_user_role() IN ('admin', 'owner'));

-- 为tenants表创建新的策略
CREATE POLICY "Admins can view all tenants" 
  ON public.tenants 
  FOR SELECT 
  USING (public.get_current_user_role() IN ('admin', 'owner'));

CREATE POLICY "Admins can update all tenants" 
  ON public.tenants 
  FOR UPDATE 
  USING (public.get_current_user_role() IN ('admin', 'owner'));

CREATE POLICY "Admins can create tenants" 
  ON public.tenants 
  FOR INSERT 
  WITH CHECK (public.get_current_user_role() IN ('admin', 'owner'));

-- 为oauth_clients表创建新的策略
CREATE POLICY "Admins can view all oauth_clients" 
  ON public.oauth_clients 
  FOR SELECT 
  USING (public.get_current_user_role() IN ('admin', 'owner'));

CREATE POLICY "Admins can update all oauth_clients" 
  ON public.oauth_clients 
  FOR UPDATE 
  USING (public.get_current_user_role() IN ('admin', 'owner'));

CREATE POLICY "Admins can create oauth_clients" 
  ON public.oauth_clients 
  FOR INSERT 
  WITH CHECK (public.get_current_user_role() IN ('admin', 'owner'));

-- 为tenant_members表创建新的策略
CREATE POLICY "Admins can view all tenant_members" 
  ON public.tenant_members 
  FOR SELECT 
  USING (public.get_current_user_role() IN ('admin', 'owner'));

CREATE POLICY "Admins can update all tenant_members" 
  ON public.tenant_members 
  FOR UPDATE 
  USING (public.get_current_user_role() IN ('admin', 'owner'));

CREATE POLICY "Admins can create tenant_members" 
  ON public.tenant_members 
  FOR INSERT 
  WITH CHECK (public.get_current_user_role() IN ('admin', 'owner'));
