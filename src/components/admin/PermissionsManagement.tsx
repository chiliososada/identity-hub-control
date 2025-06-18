
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Edit, Search, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';

type TenantMember = Tables<'tenant_members'>;
type Profile = Tables<'profiles'>;
type Tenant = Tables<'tenants'>;

type EnhancedTenantMember = TenantMember & {
  tenant_name?: string;
  user_email?: string;
  user_full_name?: string;
};

const PermissionsManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: permissions, isLoading } = useQuery({
    queryKey: ['tenant_members_permissions', searchTerm, roleFilter, statusFilter],
    queryFn: async () => {
      // First get all tenant members
      let memberQuery = supabase
        .from('tenant_members')
        .select('*')
        .order('joined_at', { ascending: false });
      
      if (roleFilter !== 'all') {
        memberQuery = memberQuery.eq('role', roleFilter);
      }
      
      if (statusFilter !== 'all') {
        memberQuery = memberQuery.eq('is_active', statusFilter === 'active');
      }
      
      const { data: members, error: membersError } = await memberQuery;
      if (membersError) throw membersError;

      if (!members) return [];

      // Get tenant and profile data separately
      const tenantIds = [...new Set(members.map(m => m.tenant_id))];
      const userIds = [...new Set(members.map(m => m.user_id))];

      const [tenantsResult, profilesResult] = await Promise.all([
        supabase.from('tenants').select('id, name').in('id', tenantIds),
        supabase.from('profiles').select('id, email, full_name').in('id', userIds)
      ]);

      const tenants = tenantsResult.data || [];
      const profiles = profilesResult.data || [];

      // Combine the data
      const enhancedMembers: EnhancedTenantMember[] = members.map(member => {
        const tenant = tenants.find(t => t.id === member.tenant_id);
        const profile = profiles.find(p => p.id === member.user_id);
        
        return {
          ...member,
          tenant_name: tenant?.name,
          user_email: profile?.email || '',
          user_full_name: profile?.full_name || '未设置姓名'
        };
      });

      // Apply search filter
      if (searchTerm) {
        return enhancedMembers.filter(member =>
          member.tenant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.user_full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      return enhancedMembers;
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: Tables<'tenant_members'>['role'] }) => {
      const { data, error } = await supabase
        .from('tenant_members')
        .update({ role })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant_members_permissions'] });
      toast({ title: "角色更新成功", description: "用户角色已成功更新" });
    },
    onError: (error: any) => {
      toast({ title: "更新失败", description: error.message, variant: "destructive" });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('tenant_members')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant_members_permissions'] });
      toast({ title: "状态更新成功", description: "用户状态已成功更新" });
    },
    onError: (error: any) => {
      toast({ title: "更新失败", description: error.message, variant: "destructive" });
    },
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner': return 'default';
      case 'admin': return 'secondary';
      case 'member': return 'outline';
      case 'viewer': return 'outline';
      case 'developer': return 'outline';
      case 'test_user': return 'outline';
      default: return 'outline';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'owner': return '所有者';
      case 'admin': return '管理员';
      case 'member': return '成员';
      case 'viewer': return '查看者';
      case 'developer': return '开发者';
      case 'test_user': return '测试用户';
      default: return role;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">加载权限数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-semibold">权限管理</h3>
          <p className="text-sm text-muted-foreground">管理用户在不同租户中的角色和权限</p>
        </div>
      </div>

      {/* 筛选器 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            筛选和搜索
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="搜索用户或租户..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="筛选角色" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有角色</SelectItem>
                <SelectItem value="owner">所有者</SelectItem>
                <SelectItem value="admin">管理员</SelectItem>
                <SelectItem value="member">成员</SelectItem>
                <SelectItem value="viewer">查看者</SelectItem>
                <SelectItem value="developer">开发者</SelectItem>
                <SelectItem value="test_user">测试用户</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="筛选状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有状态</SelectItem>
                <SelectItem value="active">激活</SelectItem>
                <SelectItem value="inactive">未激活</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 权限表格 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            用户权限列表
          </CardTitle>
          <CardDescription>
            查看和管理所有用户在各租户中的角色权限
          </CardDescription>
        </CardHeader>
        <CardContent>
          {permissions?.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">暂无权限数据</p>
              <p className="text-sm text-muted-foreground">用户加入租户后将在此显示</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>用户</TableHead>
                    <TableHead>租户</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>加入时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissions?.map((permission) => (
                    <TableRow key={permission.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {permission.user_full_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {permission.user_email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {permission.tenant_name || '未知租户'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(permission.role)}>
                          {getRoleDisplayName(permission.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={permission.is_active ? 'default' : 'secondary'}>
                          {permission.is_active ? '激活' : '未激活'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(permission.joined_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Select
                            value={permission.role}
                            onValueChange={(role) => updateRoleMutation.mutate({ 
                              id: permission.id, 
                              role: role as Tables<'tenant_members'>['role']
                            })}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="owner">所有者</SelectItem>
                              <SelectItem value="admin">管理员</SelectItem>
                              <SelectItem value="member">成员</SelectItem>
                              <SelectItem value="viewer">查看者</SelectItem>
                              <SelectItem value="developer">开发者</SelectItem>
                              <SelectItem value="test_user">测试用户</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleStatusMutation.mutate({ 
                              id: permission.id, 
                              is_active: !permission.is_active 
                            })}
                          >
                            {permission.is_active ? '禁用' : '启用'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PermissionsManagement;
