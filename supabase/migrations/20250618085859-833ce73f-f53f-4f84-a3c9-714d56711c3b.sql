
-- Add foreign key relationship between tenant_members and profiles
ALTER TABLE public.tenant_members 
ADD CONSTRAINT tenant_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
