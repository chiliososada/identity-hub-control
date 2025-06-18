
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;

const ProfilesManagement = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (profileData: Partial<Profile>) => {
      const { data, error } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      setIsCreateOpen(false);
      toast({ title: "用户档案创建成功" });
    },
    onError: (error: any) => {
      toast({ title: "创建失败", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...profileData }: Partial<Profile> & { id: string }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      setEditingProfile(null);
      toast({ title: "用户档案更新成功" });
    },
    onError: (error: any) => {
      toast({ title: "更新失败", description: error.message, variant: "destructive" });
    },
  });

  const ProfileForm = ({ profile, onSubmit, buttonText }: {
    profile?: Profile | null;
    onSubmit: (data: any) => void;
    buttonText: string;
  }) => {
    const [formData, setFormData] = useState({
      email: profile?.email || '',
      full_name: profile?.full_name || '',
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      role: profile?.role || 'member',
      company: profile?.company || '',
      job_title: profile?.job_title || '',
      is_active: profile?.is_active ?? true,
      is_company_admin: profile?.is_company_admin ?? false,
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="full_name">全名</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="first_name">名</Label>
            <Input
              id="first_name"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="last_name">姓</Label>
            <Input
              id="last_name"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="role">角色</Label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full border border-input bg-background px-3 py-2 rounded-md"
            >
              <option value="member">成员</option>
              <option value="admin">管理员</option>
              <option value="owner">所有者</option>
              <option value="viewer">查看者</option>
            </select>
          </div>
          <div>
            <Label htmlFor="company">公司</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="job_title">职位</Label>
            <Input
              id="job_title"
              value={formData.job_title}
              onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
            />
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: !!checked })}
            />
            <Label htmlFor="is_active">激活状态</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_company_admin"
              checked={formData.is_company_admin}
              onCheckedChange={(checked) => setFormData({ ...formData, is_company_admin: !!checked })}
            />
            <Label htmlFor="is_company_admin">公司管理员</Label>
          </div>
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
        <h3 className="text-lg font-semibold">用户档案列表</h3>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              添加用户
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>创建新用户档案</DialogTitle>
            </DialogHeader>
            <ProfileForm
              onSubmit={(data) => createMutation.mutate(data)}
              buttonText="创建用户"
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {profiles?.map((profile) => (
          <div key={profile.id} className="border rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold">{profile.full_name || '未设置姓名'}</h4>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant={profile.is_active ? 'default' : 'secondary'}>
                    {profile.is_active ? '激活' : '未激活'}
                  </Badge>
                  <Badge variant="outline">{profile.role}</Badge>
                  {profile.is_company_admin && (
                    <Badge variant="secondary">公司管理员</Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Dialog open={editingProfile?.id === profile.id} onOpenChange={(open) => {
                  if (!open) setEditingProfile(null);
                }}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingProfile(profile)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>编辑用户档案</DialogTitle>
                    </DialogHeader>
                    <ProfileForm
                      profile={editingProfile}
                      onSubmit={(data) => updateMutation.mutate({ ...data, id: profile.id })}
                      buttonText="更新用户"
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            {profile.company && (
              <p className="text-sm"><strong>公司:</strong> {profile.company}</p>
            )}
            {profile.job_title && (
              <p className="text-sm"><strong>职位:</strong> {profile.job_title}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfilesManagement;
