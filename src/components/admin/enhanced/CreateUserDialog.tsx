
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
      const { data, error } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users_dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['user_stats'] });
      setIsOpen(false);
      onUserCreated();
      toast({ title: "用户创建成功", description: "新用户已成功添加到系统中" });
    },
    onError: (error: any) => {
      toast({ title: "创建失败", description: error.message, variant: "destructive" });
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
          <DialogDescription>填写用户基本信息来创建新的用户账户</DialogDescription>
        </DialogHeader>
        <ProfileForm
          onSubmit={(data) => createMutation.mutate(data)}
          buttonText="创建用户"
          isLoading={createMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserDialog;
