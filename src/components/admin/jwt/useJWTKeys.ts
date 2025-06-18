
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { JWTKey } from './types';

export const useJWTKeys = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 获取JWT密钥对列表
  const { data: jwtKeys = [], isLoading, error } = useQuery({
    queryKey: ['jwt-keys'],
    queryFn: async () => {
      console.log('Fetching JWT keys...');
      
      const { data, error } = await supabase
        .from('jwt_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching JWT keys:', error);
        throw error;
      }

      console.log('Fetched JWT keys:', data?.length || 0);
      return data as JWTKey[];
    }
  });

  // 生成新的密钥对
  const generateKeyPairMutation = useMutation({
    mutationFn: async ({ 
      keyName, 
      expiryDays,
      description 
    }: { 
      keyName: string; 
      expiryDays: number;
      description?: string;
    }) => {
      console.log('Generating new JWT key pair:', { keyName, expiryDays });

      // 生成RSA密钥对的模拟数据
      const mockPublicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4f5wg5l2hKsTeNem/V41
fGnJm6gOdrj8ym3rFkEjWT2btf06nmZpjgp2Q8y+8t3l+bJgK2I9FbZN9ZqHE5y1
mKNKr8+HKsTeNem/V41fGnJm6gOdrj8ym3rFkEjWT2btf06nmZpjgp2Q8y+8t3l+
-----END PUBLIC KEY-----`;

      const mockPrivateKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDh/nCDmXaEqxN4
16b9XjV8acmbqA52uPzKbesWQSNZPZu1/TqeZmmOCnZDzL7y3eX5smArYj0Vtk31
mocTnLWYo0qvz4cqxN416b9XjV8acmbqA52uPzKbesWQSNZPZu1/TqeZmmOCnZDz
-----END PRIVATE KEY-----`;

      const keyId = `key-${Date.now()}`;
      const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('jwt_keys')
        .insert({
          key_name: keyName,
          key_id: keyId,
          algorithm: 'RS256',
          private_key: mockPrivateKey,
          public_key: mockPublicKey,
          is_active: true,
          is_primary: false,
          usage_count: 0,
          expires_at: expiresAt.toISOString(),
          description: description || null
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating JWT key:', error);
        throw error;
      }

      console.log('Created JWT key:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jwt-keys'] });
      toast({
        title: "密钥对生成成功",
        description: "新的JWT密钥对已创建并保存到数据库"
      });
    },
    onError: (error) => {
      console.error('Error generating key pair:', error);
      toast({
        title: "生成失败",
        description: "生成密钥对时发生错误",
        variant: "destructive"
      });
    }
  });

  // 删除密钥对
  const deleteKeyMutation = useMutation({
    mutationFn: async (keyId: string) => {
      console.log('Deleting JWT key:', keyId);

      const { error } = await supabase
        .from('jwt_keys')
        .delete()
        .eq('id', keyId);

      if (error) {
        console.error('Error deleting JWT key:', error);
        throw error;
      }

      console.log('Deleted JWT key:', keyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jwt-keys'] });
      toast({
        title: "删除成功",
        description: "密钥对已从数据库中删除"
      });
    },
    onError: (error) => {
      console.error('Error deleting key:', error);
      toast({
        title: "删除失败",
        description: "删除密钥对时发生错误",
        variant: "destructive"
      });
    }
  });

  // 切换密钥状态
  const toggleKeyStatusMutation = useMutation({
    mutationFn: async ({ keyId, isActive }: { keyId: string; isActive: boolean }) => {
      console.log('Toggling JWT key status:', { keyId, isActive });

      const { error } = await supabase
        .from('jwt_keys')
        .update({ is_active: isActive })
        .eq('id', keyId);

      if (error) {
        console.error('Error updating JWT key status:', error);
        throw error;
      }

      console.log('Updated JWT key status:', { keyId, isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jwt-keys'] });
      toast({
        title: "状态更新成功",
        description: "密钥对状态已更新"
      });
    },
    onError: (error) => {
      console.error('Error updating key status:', error);
      toast({
        title: "更新失败",
        description: "更新密钥状态时发生错误",
        variant: "destructive"
      });
    }
  });

  return {
    jwtKeys,
    isLoading,
    error,
    generateKeyPair: generateKeyPairMutation.mutate,
    isGenerating: generateKeyPairMutation.isPending,
    deleteKey: deleteKeyMutation.mutate,
    isDeleting: deleteKeyMutation.isPending,
    toggleKeyStatus: toggleKeyStatusMutation.mutate,
    isUpdating: toggleKeyStatusMutation.isPending
  };
};
