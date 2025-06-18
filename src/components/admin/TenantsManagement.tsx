
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

type Tenant = Tables<'tenants'>;

const TenantsManagement = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tenants, isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (tenantData: TablesInsert<'tenants'>) => {
      const { data, error } = await supabase
        .from('tenants')
        .insert(tenantData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setIsCreateOpen(false);
      toast({ title: "租户创建成功" });
    },
    onError: (error: any) => {
      toast({ title: "创建失败", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...tenantData }: Partial<Tenant> & { id: string }) => {
      const { data, error } = await supabase
        .from('tenants')
        .update(tenantData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setEditingTenant(null);
      toast({ title: "租户更新成功" });
    },
    onError: (error: any) => {
      toast({ title: "更新失败", description: error.message, variant: "destructive" });
    },
  });

  const TenantForm = ({ tenant, onSubmit, buttonText }: {
    tenant?: Tenant | null;
    onSubmit: (data: TablesInsert<'tenants'>) => void;
    buttonText: string;
  }) => {
    const [formData, setFormData] = useState({
      name: tenant?.name || '',
      company_name: tenant?.company_name || '',
      company_email: tenant?.company_email || '',
      contact_email: tenant?.contact_email || '',
      contact_phone: tenant?.contact_phone || '',
      domain: tenant?.domain || '',
      tenant_type: tenant?.tenant_type || 'personal' as const,
      subscription_plan: tenant?.subscription_plan || 'free',
      max_users: tenant?.max_users || 5,
      is_active: tenant?.is_active ?? true,
      time_zone: tenant?.time_zone || 'Asia/Tokyo',
      locale: tenant?.locale || 'ja_JP',
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const submitData: TablesInsert<'tenants'> = {
        name: formData.name,
        tenant_type: formData.tenant_type,
        company_name: formData.company_name || null,
        company_email: formData.company_email || null,
        contact_email: formData.contact_email || null,
        contact_phone: formData.contact_phone || null,
        domain: formData.domain || null,
        subscription_plan: formData.subscription_plan || null,
        max_users: formData.max_users || null,
        is_active: formData.is_active,
        time_zone: formData.time_zone || null,
        locale: formData.locale || null,
      };
      onSubmit(submitData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">租户名称</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="company_name">公司名称</Label>
            <Input
              id="company_name"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="company_email">公司邮箱</Label>
            <Input
              id="company_email"
              type="email"
              value={formData.company_email}
              onChange={(e) => setFormData({ ...formData, company_email: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="contact_email">联系邮箱</Label>
            <Input
              id="contact_email"
              type="email"
              value={formData.contact_email}
              onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="contact_phone">联系电话</Label>
            <Input
              id="contact_phone"
              value={formData.contact_phone}
              onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="domain">域名</Label>
            <Input
              id="domain"
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="tenant_type">租户类型</Label>
            <select
              id="tenant_type"
              value={formData.tenant_type}
              onChange={(e) => setFormData({ ...formData, tenant_type: e.target.value as any })}
              className="w-full border border-input bg-background px-3 py-2 rounded-md"
            >
              <option value="personal">个人</option>
              <option value="enterprise">企业</option>
            </select>
          </div>
          <div>
            <Label htmlFor="subscription_plan">订阅计划</Label>
            <Input
              id="subscription_plan"
              value={formData.subscription_plan}
              onChange={(e) => setFormData({ ...formData, subscription_plan: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="max_users">最大用户数</Label>
            <Input
              id="max_users"
              type="number"
              value={formData.max_users}
              onChange={(e) => setFormData({ ...formData, max_users: parseInt(e.target.value) })}
            />
          </div>
          <div>
            <Label htmlFor="time_zone">时区</Label>
            <Input
              id="time_zone"
              value={formData.time_zone}
              onChange={(e) => setFormData({ ...formData, time_zone: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="locale">语言环境</Label>
            <Input
              id="locale"
              value={formData.locale}
              onChange={(e) => setFormData({ ...formData, locale: e.target.value })}
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: !!checked })}
          />
          <Label htmlFor="is_active">激活状态</Label>
        </div>
        <Button type="submit" className="w-full">
          {buttonText}
        </Button>
      </form>
    );
  };

  if (isLoading) {
    return <div>加载中...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">租户列表</h3>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              添加租户
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>创建新租户</DialogTitle>
            </DialogHeader>
            <TenantForm
              onSubmit={(data) => createMutation.mutate(data)}
              buttonText="创建租户"
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {tenants?.map((tenant) => (
          <div key={tenant.id} className="border rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold">{tenant.name}</h4>
                <p className="text-sm text-muted-foreground">{tenant.company_name}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant={tenant.is_active ? 'default' : 'secondary'}>
                    {tenant.is_active ? '激活' : '未激活'}
                  </Badge>
                  <Badge variant="outline">{tenant.tenant_type}</Badge>
                  <Badge variant="secondary">{tenant.subscription_plan}</Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Dialog open={editingTenant?.id === tenant.id} onOpenChange={(open) => {
                  if (!open) setEditingTenant(null);
                }}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingTenant(tenant)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>编辑租户</DialogTitle>
                    </DialogHeader>
                    <TenantForm
                      tenant={editingTenant}
                      onSubmit={(data) => updateMutation.mutate({ ...data, id: tenant.id })}
                      buttonText="更新租户"
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {tenant.company_email && (
                <p><strong>公司邮箱:</strong> {tenant.company_email}</p>
              )}
              {tenant.contact_email && (
                <p><strong>联系邮箱:</strong> {tenant.contact_email}</p>
              )}
              {tenant.domain && (
                <p><strong>域名:</strong> {tenant.domain}</p>
              )}
              <p><strong>最大用户数:</strong> {tenant.max_users}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TenantsManagement;
