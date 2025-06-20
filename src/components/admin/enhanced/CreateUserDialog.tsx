
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { UserPlus } from 'lucide-react';
import { ProfileForm } from '../forms/ProfileForm';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;

interface CreateUserDialogProps {
  onUserCreated: () => void;
}

const CreateUserDialog = ({ onUserCreated }: CreateUserDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (profileData: Partial<Profile>) => {
      console.log('Creating user with data:', profileData);
      
      if (!profileData.email) {
        throw new Error('メールアドレスが必要です');
      }

      // 使用 Supabase Auth Admin API 创建用户
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: profileData.email,
        email_confirm: true, // 自动确认邮箱
        user_metadata: {
          full_name: profileData.full_name || null,
          first_name: profileData.first_name || null,
          last_name: profileData.last_name || null,
        }
      });

      if (authError) {
        console.error('Auth user creation error:', authError);
        throw new Error(`認証ユーザーの作成に失敗しました: ${authError.message}`);
      }

      if (!authUser.user) {
        throw new Error('認証ユーザーの作成に失敗しました');
      }

      console.log('Auth user created successfully:', authUser.user);

      // 由于我们有触发器，profiles 记录会自动创建
      // 但我们需要更新额外的字段
      const updateData = {
        full_name: profileData.full_name || null,
        first_name: profileData.first_name || null,
        last_name: profileData.last_name || null,
        role: profileData.role || 'member',
        company: profileData.company || null,
        job_title: profileData.job_title || null,
        is_active: profileData.is_active ?? true,
        is_company_admin: profileData.is_company_admin ?? false,
        is_test_account: profileData.is_test_account ?? false,
      };

      // 等待触发器创建 profile 记录，然后更新它
      // 使用短暂延迟确保触发器完成
      await new Promise(resolve => setTimeout(resolve, 1000));

      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('auth_user_id', authUser.user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Profile update error:', updateError);
        // 不抛出错误，因为用户已经创建成功
        console.warn('プロフィールの更新に失敗しましたが、ユーザーは作成されました');
      }

      console.log('User creation completed:', updatedProfile || authUser.user);
      return updatedProfile || { ...authUser.user, ...updateData };
    },
    onSuccess: (data) => {
      console.log('User creation mutation success:', data);
      // Invalidate multiple query keys to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ['users_dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['user_stats'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      
      setIsOpen(false);
      onUserCreated();
      
      const accountType = data.is_test_account ? 'テストアカウント' : 'ユーザー';
      toast({ 
        title: "ユーザー作成成功", 
        description: `${accountType} ${data.full_name || data.email} がシステムに正常に追加されました` 
      });
    },
    onError: (error: any) => {
      console.error('User creation mutation error:', error);
      toast({ 
        title: "作成失敗", 
        description: error.message || "ユーザー作成時にエラーが発生しました", 
        variant: "destructive" 
      });
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          ユーザーを追加
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新しいユーザーを作成</DialogTitle>
          <DialogDescription>ユーザーの基本情報を入力して新しいユーザーアカウントを作成してください。「テストアカウント」をチェックするとテストユーザーを作成できます。</DialogDescription>
        </DialogHeader>
        <ProfileForm
          onSubmit={(data) => {
            console.log('ProfileForm submitted data:', data);
            createMutation.mutate(data);
          }}
          buttonText="ユーザーを作成"
          isLoading={createMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserDialog;
