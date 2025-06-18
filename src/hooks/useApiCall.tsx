
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useApiCall = () => {
  const { token, refreshToken, logout } = useAuth();

  // 通用API调用函数，自动处理token
  const apiCall = async (
    functionName: string, 
    options: {
      body?: any;
      headers?: Record<string, string>;
      retryOnUnauthorized?: boolean;
    } = {}
  ) => {
    const { body, headers = {}, retryOnUnauthorized = true } = options;

    if (!token) {
      throw new Error('No authentication token available');
    }

    // 准备请求头
    const requestHeaders = {
      ...headers,
      Authorization: `Bearer ${token}`
    };

    try {
      // 调用Supabase Edge Function
      const { data, error } = await supabase.functions.invoke(functionName, {
        body,
        headers: requestHeaders
      });

      // 检查是否有认证错误
      if (error && error.message?.includes('401')) {
        if (retryOnUnauthorized) {
          // 尝试刷新token
          const refreshResult = await refreshToken();
          if (refreshResult.success) {
            // 重新尝试请求
            return apiCall(functionName, { ...options, retryOnUnauthorized: false });
          } else {
            // 刷新失败，登出用户
            await logout();
            throw new Error('Authentication failed');
          }
        } else {
          // 已经重试过，登出用户
          await logout();
          throw new Error('Authentication failed');
        }
      }

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data;
    } catch (error) {
      console.error(`API call to ${functionName} failed:`, error);
      throw error;
    }
  };

  // 获取用户信息
  const getUserInfo = async () => {
    try {
      const data = await apiCall('auth-user');
      return { success: true, data };
    } catch (error) {
      console.error('Get user info failed:', error);
      return { success: false, error: error.message };
    }
  };

  // 撤销token
  const revokeToken = async (tokenToRevoke?: string, reason?: string) => {
    try {
      const data = await apiCall('auth-revoke', {
        body: {
          token: tokenToRevoke,
          reason: reason || 'Token revoked by user'
        }
      });
      
      toast({
        title: "Token已撤销",
        description: data.message
      });
      
      return { success: true, data };
    } catch (error) {
      console.error('Revoke token failed:', error);
      toast({
        title: "撤销失败",
        description: error.message,
        variant: "destructive"
      });
      return { success: false, error: error.message };
    }
  };

  // 撤销所有token
  const revokeAllTokens = async (reason?: string) => {
    try {
      const data = await apiCall('auth-revoke', {
        body: {
          all_tokens: true,
          reason: reason || 'All tokens revoked by user'
        }
      });
      
      toast({
        title: "所有Token已撤销",
        description: data.message
      });
      
      // 撤销所有token后自动登出
      await logout();
      
      return { success: true, data };
    } catch (error) {
      console.error('Revoke all tokens failed:', error);
      toast({
        title: "撤销失败",
        description: error.message,
        variant: "destructive"
      });
      return { success: false, error: error.message };
    }
  };

  return {
    apiCall,
    getUserInfo,
    revokeToken,
    revokeAllTokens
  };
};
