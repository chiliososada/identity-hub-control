
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Search, Building } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { TenantForm } from './forms/TenantForm';

type Tenant = Tables<'tenants'>;

const TenantsManagement = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tenants, isLoading } = useQuery({
    queryKey: ['tenants', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%,domain.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query;
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
      toast({ title: "租户创建成功", description: "新租户已成功添加到系统中" });
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
      toast({ title: "租户更新成功", description: "租户信息已成功更新" });
    },
    onError: (error: any) => {
      toast({ title: "更新失败", description: error.message, variant: "destructive" });
    },
  });

  const getPlanBadgeVariant = (plan: string) => {
    switch (plan) {
      case 'enterprise': return 'default';
      case 'pro': return 'secondary';
      case 'basic': return 'outline';
      case 'free': return 'outline';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">加载租户数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-semibold">租户管理</h3>
          <p className="text-sm text-muted-foreground">管理系统中的所有租户组织</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="搜索租户..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                添加租户
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>创建新租户</DialogTitle>
                <DialogDescription>填写租户组织信息来创建新的租户</DialogDescription>
              </DialogHeader>
              <TenantForm
                onSubmit={(data) => createMutation.mutate(data)}
                buttonText="创建租户"
                isLoading={createMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4">
        {tenants?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building className="h-12 w-12 text-muted-foreground mb-4" />
              <div className="text-center">
                <p className="text-lg font-medium">暂无租户数据</p>
                <p className="text-sm text-muted-foreground mt-1">点击上方按钮创建第一个租户</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          tenants?.map((tenant) => (
            <Card key={tenant.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-lg font-semibold flex items-center gap-2">
                          <Building className="h-5 w-5 text-muted-foreground" />
                          {tenant.name}
                        </h4>
                        {tenant.company_name && (
                          <p className="text-sm text-muted-foreground">{tenant.company_name}</p>
                        )}
                      </div>
                      
                      <Dialog open={editingTenant?.id === tenant.id} onOpenChange={(open) => {
                        if (!open) setEditingTenant(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingTenant(tenant)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            编辑
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>编辑租户</DialogTitle>
                            <DialogDescription>修改租户的基本信息和配置</DialogDescription>
                          </DialogHeader>
                          <TenantForm
                            tenant={editingTenant}
                            onSubmit={(data) => updateMutation.mutate({ ...data, id: tenant.id })}
                            buttonText="更新租户"
                            isLoading={updateMutation.isPending}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant={tenant.is_active ? 'default' : 'secondary'}>
                        {tenant.is_active ? '激活' : '未激活'}
                      </Badge>
                      <Badge variant="outline">
                        {tenant.tenant_type === 'enterprise' ? '企业' : '个人'}
                      </Badge>
                      <Badge variant={getPlanBadgeVariant(tenant.subscription_plan || 'free')}>
                        {tenant.subscription_plan === 'enterprise' ? '企业版' :
                         tenant.subscription_plan === 'pro' ? '专业版' :
                         tenant.subscription_plan === 'basic' ? '基础版' : '免费版'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                      {tenant.company_email && (
                        <div>
                          <span className="font-medium text-muted-foreground">公司邮箱:</span>
                          <p className="text-foreground">{tenant.company_email}</p>
                        </div>
                      )}
                      {tenant.contact_email && (
                        <div>
                          <span className="font-medium text-muted-foreground">联系邮箱:</span>
                          <p className="text-foreground">{tenant.contact_email}</p>
                        </div>
                      )}
                      {tenant.domain && (
                        <div>
                          <span className="font-medium text-muted-foreground">域名:</span>
                          <p className="text-foreground">{tenant.domain}</p>
                        </div>
                      )}
                      <div>
                        <span className="font-medium text-muted-foreground">最大用户数:</span>
                        <p className="text-foreground">{tenant.max_users}</p>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">时区:</span>
                        <p className="text-foreground">{tenant.time_zone}</p>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">创建时间:</span>
                        <p className="text-foreground">{new Date(tenant.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default TenantsManagement;
