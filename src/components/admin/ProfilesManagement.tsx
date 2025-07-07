import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Search, Key } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';
import { ProfileForm } from './forms/ProfileForm';
import { ResetPasswordDialog } from './ResetPasswordDialog';

type Profile = Tables<'profiles'>;

const ProfilesManagement = () => {
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [resetPasswordProfile, setResetPasswordProfile] = useState<Profile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['profiles', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,company.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
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
      toast({ title: "用户档案更新成功", description: "用户信息已成功更新" });
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
      case 'test_user': return 'destructive';
      default: return 'outline';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'owner': return '所有者';
      case 'admin': return '管理员';
      case 'member': return '成员';
      case 'viewer': return '查看者';
      case 'test_user': return '测试用户';
      default: return role;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">加载用户数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-semibold">用户档案管理</h3>
          <p className="text-sm text-muted-foreground">管理系统中的所有用户账户信息</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="搜索用户..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {profiles?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <p className="text-lg font-medium">暂无用户数据</p>
                <p className="text-sm text-muted-foreground mt-1">用户通过Supabase Auth注册后将自动出现在这里</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          profiles?.map((profile) => (
            <Card key={profile.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-lg font-semibold">{profile.full_name || '未设置姓名'}</h4>
                        <p className="text-sm text-muted-foreground">{profile.email}</p>
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
                              <Edit className="h-4 w-4 mr-1" />
                              编辑
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>编辑用户档案</DialogTitle>
                              <DialogDescription>修改用户的基本信息和权限设置</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <ProfileForm
                                profile={editingProfile}
                                onSubmit={(data) => updateMutation.mutate({ ...data, id: profile.id })}
                                buttonText="更新用户"
                                isLoading={updateMutation.isPending}
                              />
                              <div className="border-t pt-4">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setResetPasswordProfile(profile);
                                    setEditingProfile(null);
                                  }}
                                  className="w-full"
                                >
                                  <Key className="h-4 w-4 mr-2" />
                                  重置用户密码
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant={profile.is_active ? 'default' : 'secondary'}>
                        {profile.is_active ? '激活' : '未激活'}
                      </Badge>
                      <Badge variant={getRoleBadgeVariant(profile.role)}>
                        {getRoleDisplayName(profile.role)}
                      </Badge>
                      {profile.is_test_account && (
                        <Badge variant="destructive">测试账户</Badge>
                      )}
                      {profile.is_company_admin && (
                        <Badge variant="outline">公司管理员</Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                      {profile.company && (
                        <div><span className="font-medium">公司:</span> {profile.company}</div>
                      )}
                      {profile.job_title && (
                        <div><span className="font-medium">职位:</span> {profile.job_title}</div>
                      )}
                      {profile.created_at && (
                        <div><span className="font-medium">创建时间:</span> {new Date(profile.created_at).toLocaleDateString()}</div>
                      )}
                      {profile.last_login_at && (
                        <div><span className="font-medium">最后登录:</span> {new Date(profile.last_login_at).toLocaleDateString()}</div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <ResetPasswordDialog
        profile={resetPasswordProfile!}
        open={!!resetPasswordProfile}
        onOpenChange={(open) => !open && setResetPasswordProfile(null)}
        onSuccess={() => {
          toast({ title: "密码重置成功", description: "用户密码已成功重置" });
        }}
      />
    </div>
  );
};

export default ProfilesManagement;
