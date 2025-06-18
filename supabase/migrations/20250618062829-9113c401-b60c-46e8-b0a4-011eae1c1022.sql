
-- 为管理员创建RLS策略，允许管理所有数据

-- 首先为profiles表启用RLS并创建策略
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 管理员可以查看所有profiles
CREATE POLICY "Admins can view all profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'owner')
    )
  );

-- 管理员可以更新所有profiles
CREATE POLICY "Admins can update all profiles" 
  ON public.profiles 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'owner')
    )
  );

-- 管理员可以创建新profiles
CREATE POLICY "Admins can create profiles" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'owner')
    )
  );

-- 为tenants表启用RLS并创建策略
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- 管理员可以查看所有tenants
CREATE POLICY "Admins can view all tenants" 
  ON public.tenants 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'owner')
    )
  );

-- 管理员可以更新所有tenants
CREATE POLICY "Admins can update all tenants" 
  ON public.tenants 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'owner')
    )
  );

-- 管理员可以创建新tenants
CREATE POLICY "Admins can create tenants" 
  ON public.tenants 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'owner')
    )
  );

-- 为oauth_clients表启用RLS并创建策略
ALTER TABLE public.oauth_clients ENABLE ROW LEVEL SECURITY;

-- 管理员可以查看所有oauth_clients
CREATE POLICY "Admins can view all oauth_clients" 
  ON public.oauth_clients 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'owner')
    )
  );

-- 管理员可以更新所有oauth_clients
CREATE POLICY "Admins can update all oauth_clients" 
  ON public.oauth_clients 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'owner')
    )
  );

-- 管理员可以创建新oauth_clients
CREATE POLICY "Admins can create oauth_clients" 
  ON public.oauth_clients 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'owner')
    )
  );

-- 为tenant_members表启用RLS并创建策略
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;

-- 管理员可以查看所有tenant_members
CREATE POLICY "Admins can view all tenant_members" 
  ON public.tenant_members 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'owner')
    )
  );

-- 管理员可以更新所有tenant_members
CREATE POLICY "Admins can update all tenant_members" 
  ON public.tenant_members 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'owner')
    )
  );

-- 管理员可以创建新tenant_members
CREATE POLICY "Admins can create tenant_members" 
  ON public.tenant_members 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'owner')
    )
  );
