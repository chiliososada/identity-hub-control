
-- 清空所有表的数据，保持表结构
TRUNCATE TABLE public.audit_logs CASCADE;
TRUNCATE TABLE public.tenant_members CASCADE;
TRUNCATE TABLE public.system_configs CASCADE;
TRUNCATE TABLE public.tenants CASCADE;
TRUNCATE TABLE public.profiles CASCADE;

-- 重置序列（如果有的话）
-- 注意：UUID主键不需要重置序列
