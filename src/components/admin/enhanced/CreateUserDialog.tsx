
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
      
      // Ensure we have valid data structure for insert
      const insertData = {
        email: profileData.email,
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
      
      const { data, error } = await supabase
        .from('profiles')
        .insert([insertData])
        .select()
        .single();
      
      if (error) {
        console.error('User creation error:', error);
        throw error;
      }
      
      console.log('User created successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('User creation mutation success:', data);
      // Invalidate multiple query keys to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ['users_dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['user_stats'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      
      setIsOpen(false);
      onUserCreated();
      
      const accountType = data.is_test_account ? '测试账户' : '用户';
      toast({ 
        title: "用户创建成功", 
        description: `${accountType} ${data.full_name || data.email} 已成功添加到系统中` 
      });
    },
    onError: (error: any) => {
      console.error('User creation mutation error:', error);
      toast({ 
        title: "创建失败", 
        description: error.message || "创建用户时发生错误", 
        variant: "destructive" 
      });
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          添加用户
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>创建新用户</DialogTitle>
          <DialogDescription>填写用户基本信息来创建新的用户账户。勾选"测试账户"可创建测试用户。</DialogDescription>
        </DialogHeader>
        <ProfileForm
          onSubmit={(data) => {
            console.log('ProfileForm submitted data:', data);
            createMutation.mutate(data);
          }}
          buttonText="创建用户"
          isLoading={createMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserDialog;
