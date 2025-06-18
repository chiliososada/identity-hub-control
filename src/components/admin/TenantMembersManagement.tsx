
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';

type TenantMember = Tables<'tenant_members'>;

const TenantMembersManagement = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TenantMember | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: members, isLoading } = useQuery({
    queryKey: ['tenant_members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenant_members')
        .select(`
          *,
          tenants(name),
          profiles!tenant_members_user_id_fkey(full_name, email)
        `)
        .order('joined_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: tenants } = useQuery({
    queryKey: ['tenants_for_members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('id, name')
        .eq('is_active', true);
      
      if (error) throw error;
      return data;
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ['profiles_for_members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('is_active', true);
      
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (memberData: Partial<TenantMember>) => {
      const { data, error } = await supabase
        .from('tenant_members')
        .insert([memberData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant_members'] });
      setIsCreateOpen(false);
      toast({ title: "租户成员添加成功" });
    },
    onError: (error: any) => {
      toast({ title: "添加失败", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...memberData }: Partial<TenantMember> & { id: string }) => {
      const { data, error } = await supabase
        .from('tenant_members')
        .update(memberData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant_members'] });
      setEditingMember(null);
      toast({ title: "租户成员更新成功" });
    },
    onError: (error: any) => {
      toast({ title: "更新失败", description: error.message, variant: "destructive" });
    },
  });

  const TenantMemberForm = ({ member, onSubmit, buttonText }: {
    member?: TenantMember | null;
    onSubmit: (data: any) => void;
    buttonText: string;
  }) => {
    const [formData, setFormData] = useState({
      tenant_id: member?.tenant_id || '',
      user_id: member?.user_id || '',
      role: member?.role || 'member',
      is_active: member?.is_active ?? true,
      invited_by: member?.invited_by || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const submitData = {
        ...formData,
        invited_by: formData.invited_by || null,
      };
      onSubmit(submitData);
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
            className="w-full border border-input bg-background px-3 py-2 rounded-md"
            required
          >
            <option value="">选择用户</option>
            {profiles?.map(profile => (
              <option key={profile.id} value={profile.id}>
                {profile.full_name || profile.email}
              </option>
            ))}
          </select>
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
            className="w-full border border-input bg-background px-3 py-2 rounded-md"
          >
            <option value="">无邀请人</option>
            {profiles?.map(profile => (
              <option key={profile.id} value={profile.id}>
                {profile.full_name || profile.email}
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

      <div className="grid gap-4">
        {members?.map((member: any) => (
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
    </div>
  );
};

export default TenantMembersManagement;
