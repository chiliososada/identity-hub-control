
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
    mutationFn: async (profileData: Partial<Profile & { password: string }>) => {
      console.log('Creating user with data:', { ...profileData, password: '***' });
      
      if (!profileData.email) {
        throw new Error('邮箱地址是必填项');
      }

      if (!profileData.password) {
        throw new Error('密码是必填项');
      }

      // 调用新的 Edge Function
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: profileData.email,
          password: profileData.password,
          full_name: profileData.full_name || null,
          first_name: profileData.first_name || null,
          last_name: profileData.last_name || null,
          role: profileData.role || 'member',
          company: profileData.company || null,
          job_title: profileData.job_title || null,
          is_active: profileData.is_active ?? true,
          is_company_admin: profileData.is_company_admin ?? false,
          is_test_account: profileData.is_test_account ?? false,
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'ユーザー作成時にエラーが発生しました');
      }

      if (!data.success) {
        throw new Error(data.error || 'ユーザー作成に失敗しました');
      }

      console.log('User creation completed:', data.user);
      return data.user;
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
        description: `${accountType} ${data.full_name || data.email} がシステムに正常に追加されました。新用户现在可以使用设置的密码登录。` 
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
          <DialogDescription>ユーザーの基本情報と密码を入力して新しいユーザーアカウントを作成してください。「テストアカウント」をチェックするとテストユーザーを作成できます。</DialogDescription>
        </DialogHeader>
        <ProfileForm
          onSubmit={(data) => {
            console.log('ProfileForm submitted data:', { ...data, password: '***' });
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
