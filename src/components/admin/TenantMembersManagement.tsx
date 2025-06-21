
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { Skeleton } from '@/components/ui/skeleton';

type TenantMember = Tables<'tenant_members'>;

const TenantMembersManagement = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TenantMember | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: members, isLoading, error } = useQuery({
    queryKey: ['tenant_members'],
    queryFn: async () => {
      console.log('Fetching tenant members...');
      const { data, error } = await supabase
        .from('tenant_members')
        .select(`
          *,
          tenants!tenant_members_tenant_id_fkey(id, name),
          profiles!tenant_members_user_id_fkey(id, full_name, email)
        `)
        .order('joined_at', { ascending: false });
      
      console.log('Tenant members query result:', { data, error });
      if (error) {
        console.error('Error fetching tenant members:', error);
        throw error;
      }
      return data;
    },
  });

  const { data: tenants } = useQuery({
    queryKey: ['tenants_for_members'],
    queryFn: async () => {
      console.log('Fetching tenants for members...');
      const { data, error } = await supabase
        .from('tenants')
        .select('id, name')
        .eq('is_active', true);
      
      console.log('Tenants query result:', { data, error });
      if (error) {
        console.error('Error fetching tenants:', error);
        throw error;
      }
      return data;
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ['profiles_for_members'],
    queryFn: async () => {
      console.log('Fetching profiles for members...');
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, company, created_at')
        .eq('is_active', true);
      
      console.log('Profiles query result:', { data, error });
      if (error) {
        console.error('Error fetching profiles:', error);
        throw error;
      }
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (memberData: TablesInsert<'tenant_members'>) => {
      console.log('Creating tenant member:', memberData);
      
      // 开始事务操作
      const { data: memberResult, error: memberError } = await supabase
        .from('tenant_members')
        .insert(memberData)
        .select()
        .single();
      
      if (memberError) {
        console.error('Error creating tenant member:', memberError);
        throw memberError;
      }

      // 同时更新 profiles 表的 tenant_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ tenant_id: memberData.tenant_id })
        .eq('id', memberData.user_id);

      if (profileError) {
        console.error('Error updating profile tenant_id:', profileError);
        // 如果更新 profile 失败，删除刚创建的 tenant_member 记录
        await supabase
          .from('tenant_members')
          .delete()
          .eq('id', memberResult.id);
        throw new Error('更新用户租户信息失败');
      }

      console.log('Created tenant member and updated profile:', memberResult);
      return memberResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant_members'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      setIsCreateOpen(false);
      toast({ title: "租户成员添加成功，用户租户信息已同步更新" });
    },
    onError: (error: any) => {
      console.error('Create mutation error:', error);
      toast({ title: "添加失败", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...memberData }: Partial<TenantMember> & { id: string }) => {
      console.log('Updating tenant member:', { id, memberData });
      
      const { data: updatedMember, error: memberError } = await supabase
        .from('tenant_members')
        .update(memberData)
        .eq('id', id)
        .select()
        .single();
      
      if (memberError) {
        console.error('Error updating tenant member:', memberError);
        throw memberError;
      }

      // 如果更新了 tenant_id，同时更新 profiles 表
      if (memberData.tenant_id) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ tenant_id: memberData.tenant_id })
          .eq('id', updatedMember.user_id);

        if (profileError) {
          console.error('Error updating profile tenant_id:', profileError);
          throw new Error('更新用户租户信息失败');
        }
      }

      console.log('Updated tenant member and profile:', updatedMember);
      return updatedMember;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant_members'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      setEditingMember(null);
      toast({ title: "租户成员更新成功，用户租户信息已同步更新" });
    },
    onError: (error: any) => {
      console.error('Update mutation error:', error);
      toast({ title: "更新失败", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (memberId: string) => {
      console.log('Deleting tenant member:', memberId);
      
      // 先获取要删除的成员信息
      const { data: memberToDelete, error: fetchError } = await supabase
        .from('tenant_members')
        .select('user_id, tenant_id')
        .eq('id', memberId)
        .single();

      if (fetchError) {
        console.error('Error fetching member to delete:', fetchError);
        throw fetchError;
      }

      // 删除租户成员记录
      const { error: deleteError } = await supabase
        .from('tenant_members')
        .delete()
        .eq('id', memberId);
      
      if (deleteError) {
        console.error('Error deleting tenant member:', deleteError);
        throw deleteError;
      }

      // 检查用户是否还有其他租户关系
      const { data: otherMemberships, error: checkError } = await supabase
        .from('tenant_members')
        .select('tenant_id')
        .eq('user_id', memberToDelete.user_id)
        .limit(1);

      if (checkError) {
        console.error('Error checking other memberships:', checkError);
        throw checkError;
      }

      // 如果用户没有其他租户关系，清空 profiles.tenant_id
      // 如果有其他关系，设置为第一个租户的 ID
      const newTenantId = otherMemberships && otherMemberships.length > 0 
        ? otherMemberships[0].tenant_id 
        : null;

      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ tenant_id: newTenantId })
        .eq('id', memberToDelete.user_id);

      if (profileUpdateError) {
        console.error('Error updating profile after deletion:', profileUpdateError);
        throw new Error('删除后更新用户租户信息失败');
      }

      console.log('Deleted tenant member and updated profile:', memberId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant_members'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast({ title: "租户成员删除成功，用户租户信息已同步更新" });
    },
    onError: (error: any) => {
      console.error('Delete mutation error:', error);
      toast({ title: "删除失败", description: error.message, variant: "destructive" });
    },
  });

  const TenantMemberForm = ({ member, onSubmit, buttonText }: {
    member?: TenantMember | null;
    onSubmit: (data: TablesInsert<'tenant_members'>) => void;
    buttonText: string;
  }) => {
    const [formData, setFormData] = useState({
      tenant_id: member?.tenant_id || '',
      user_id: member?.user_id || '',
      role: member?.role || 'member' as const,
      is_active: member?.is_active ?? true,
      invited_by: member?.invited_by || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const submitData: TablesInsert<'tenant_members'> = {
        tenant_id: formData.tenant_id,
        user_id: formData.user_id,
        role: formData.role,
        is_active: formData.is_active,
        invited_by: formData.invited_by || null,
      };
      console.log('Submitting form data:', submitData);
      onSubmit(submitData);
    };

    // Helper function to format user display name
    const formatUserDisplayName = (profile: any) => {
      const name = profile.full_name || '无姓名';
      const email = profile.email || '无邮箱';
      const company = profile.company ? ` (${profile.company})` : '';
      const createdDate = profile.created_at ? 
        ` - 创建于${new Date(profile.created_at).toLocaleDateString()}` : '';
      
      return `${name} - ${email}${company}${createdDate}`;
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="tenant_id">租户</Label>
          <select
            id="tenant_id"
            value={formData.tenant_id}
            onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
            className="w-full border border-input bg-background px-3 py-2 rounded-md"
            required
          >
            <option value="">选择租户</option>
            {tenants?.map(tenant => (
              <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="user_id">用户</Label>
          <select
            id="user_id"
            value={formData.user_id}
            onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
            className="w-full border border-input bg-background px-3 py-2 rounded-md text-sm"
            required
          >
            <option value="">选择用户</option>
            {profiles?.map(profile => (
              <option key={profile.id} value={profile.id} title={formatUserDisplayName(profile)}>
                {formatUserDisplayName(profile)}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            显示格式：姓名 - 邮箱 (公司) - 创建时间
          </p>
        </div>
        <div>
          <Label htmlFor="role">角色</Label>
          <select
            id="role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
            className="w-full border border-input bg-background px-3 py-2 rounded-md"
          >
            <option value="owner">所有者</option>
            <option value="admin">管理员</option>
            <option value="member">成员</option>
            <option value="viewer">查看者</option>
            <option value="developer">开发者</option>
            <option value="test_user">测试用户</option>
          </select>
        </div>
        <div>
          <Label htmlFor="invited_by">邀请人</Label>
          <select
            id="invited_by"
            value={formData.invited_by}
            onChange={(e) => setFormData({ ...formData, invited_by: e.target.value })}
            className="w-full border border-input bg-background px-3 py-2 rounded-md text-sm"
          >
            <option value="">无邀请人</option>
            {profiles?.map(profile => (
              <option key={profile.id} value={profile.id} title={formatUserDisplayName(profile)}>
                {formatUserDisplayName(profile)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: !!checked })}
          />
          <Label htmlFor="is_active">激活状态</Label>
        </div>
        <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
          {createMutation.isPending || updateMutation.isPending ? '处理中...' : buttonText}
        </Button>
      </form>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">租户成员列表</h3>
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">租户成员列表</h3>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                添加成员
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>添加租户成员</DialogTitle>
              </DialogHeader>
              <TenantMemberForm
                onSubmit={(data) => createMutation.mutate(data)}
                buttonText="添加成员"
              />
            </DialogContent>
          </Dialog>
        </div>
        <div className="text-center py-8">
          <p className="text-red-500 mb-2">加载租户成员数据时出错</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">租户成员列表</h3>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              添加成员
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加租户成员</DialogTitle>
            </DialogHeader>
            <TenantMemberForm
              onSubmit={(data) => createMutation.mutate(data)}
              buttonText="添加成员"
            />
          </DialogContent>
        </Dialog>
      </div>

      {!members || members.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">暂无租户成员数据</p>
          <p className="text-sm text-muted-foreground mb-4">
            请先创建用户和租户，然后添加成员关系
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {members.map((member: any) => (
            <div key={member.id} className="border rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">
                    {member.profiles?.full_name || member.profiles?.email || '未知用户'}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    租户: {member.tenants?.name || '未知租户'}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant={member.is_active ? 'default' : 'secondary'}>
                      {member.is_active ? '激活' : '未激活'}
                    </Badge>
                    <Badge variant="outline">{member.role}</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Dialog open={editingMember?.id === member.id} onOpenChange={(open) => {
                    if (!open) setEditingMember(null);
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingMember(member)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>编辑租户成员</DialogTitle>
                      </DialogHeader>
                      <TenantMemberForm
                        member={editingMember}
                        onSubmit={(data) => updateMutation.mutate({ ...data, id: member.id })}
                        buttonText="更新成员"
                      />
                    </DialogContent>
                  </Dialog>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确认删除</AlertDialogTitle>
                        <AlertDialogDescription>
                          你确定要将用户 "{member.profiles?.full_name || member.profiles?.email || '未知用户'}" 
                          从租户 "{member.tenants?.name || '未知租户'}" 中移除吗？此操作无法撤销。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(member.id)}
                          className="bg-red-600 hover:bg-red-700"
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending ? '删除中...' : '确认删除'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>加入时间: {new Date(member.joined_at).toLocaleDateString()}</p>
                {member.profiles?.email && (
                  <p>邮箱: {member.profiles.email}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TenantMembersManagement;
