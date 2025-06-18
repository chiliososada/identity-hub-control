
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useTokenOperations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const revokeTokenMutation = useMutation({
    mutationFn: async ({ tokenId, reason }: { tokenId: string; reason?: string }) => {
      const { error } = await supabase
        .from('auth_tokens')
        .update({
          is_revoked: true,
          revoked_at: new Date().toISOString(),
          revoked_reason: reason || '管理员撤销'
        })
        .eq('id', tokenId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth-tokens'] });
      toast({ title: "Token已撤销", description: "指定的Token已被成功撤销" });
    },
    onError: (error) => {
      console.error('Error revoking token:', error);
      toast({ title: "撤销失败", description: "撤销Token时发生错误", variant: "destructive" });
    }
  });

  const batchRevokeTokensMutation = useMutation({
    mutationFn: async ({ tokenIds, reason }: { tokenIds: string[]; reason?: string }) => {
      const { error } = await supabase
        .from('auth_tokens')
        .update({
          is_revoked: true,
          revoked_at: new Date().toISOString(),
          revoked_reason: reason || '批量撤销'
        })
        .in('id', tokenIds);

      if (error) throw error;
    },
    onSuccess: (_, { tokenIds }) => {
      queryClient.invalidateQueries({ queryKey: ['auth-tokens'] });
      toast({ 
        title: "批量撤销成功", 
        description: `已成功撤销 ${tokenIds.length} 个Token` 
      });
    },
    onError: (error) => {
      console.error('Error batch revoking tokens:', error);
      toast({ title: "批量撤销失败", description: "批量撤销Token时发生错误", variant: "destructive" });
    }
  });

  return {
    revokeTokenMutation,
    batchRevokeTokensMutation
  };
};
