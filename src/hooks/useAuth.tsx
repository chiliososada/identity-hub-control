
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  role: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string, deviceName?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<{ success: boolean; error?: string }>;
  verifyToken: () => Promise<{ valid: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 登录功能
  const login = async (email: string, password: string, deviceName?: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('auth-login', {
        body: {
          email,
          password,
          device_name: deviceName || 'Web Browser'
        }
      });

      if (error) {
        console.error('Login error:', error);
        return { success: false, error: 'Login failed' };
      }

      if (data?.error) {
        return { success: false, error: data.error };
      }

      // 保存token和用户信息
      const accessToken = data.access_token;
      setToken(accessToken);
      setUser(data.user);
      
      // 保存到localStorage
      localStorage.setItem('auth_token', accessToken);
      localStorage.setItem('user_data', JSON.stringify(data.user));

      toast({
        title: "登录成功",
        description: `欢迎回来，${data.user.full_name || data.user.email}！`
      });

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: '登录失败，请重试' };
    } finally {
      setIsLoading(false);
    }
  };

  // 登出功能
  const logout = async () => {
    try {
      if (token) {
        // 调用撤销token接口
        await supabase.functions.invoke('auth-revoke', {
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: {
            all_tokens: false,
            reason: 'User logout'
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // 清除本地数据
      setUser(null);
      setToken(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      
      toast({
        title: "已登出",
        description: "您已安全登出系统"
      });
    }
  };

  // 刷新token
  const refreshToken = async () => {
    try {
      if (!token) return { success: false, error: 'No token to refresh' };

      const { data, error } = await supabase.functions.invoke('auth-refresh', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (error || data?.error) {
        console.error('Refresh token error:', error || data?.error);
        await logout(); // Token无效，登出用户
        return { success: false, error: 'Token refresh failed' };
      }

      // 更新token和用户信息
      const newToken = data.access_token;
      setToken(newToken);
      setUser(data.user);
      
      localStorage.setItem('auth_token', newToken);
      localStorage.setItem('user_data', JSON.stringify(data.user));

      return { success: true };
    } catch (error) {
      console.error('Refresh token error:', error);
      await logout();
      return { success: false, error: 'Token refresh failed' };
    }
  };

  // 验证token
  const verifyToken = async () => {
    try {
      if (!token) return { valid: false, error: 'No token' };

      const { data, error } = await supabase.functions.invoke('auth-verify', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (error || data?.error || !data?.valid) {
        return { valid: false, error: data?.error || 'Token invalid' };
      }

      return { valid: true };
    } catch (error) {
      console.error('Verify token error:', error);
      return { valid: false, error: 'Verification failed' };
    }
  };

  // 初始化时检查本地存储的token
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('user_data');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));

        // 验证token是否仍然有效
        const { valid } = await verifyToken();
        if (!valid) {
          // Token无效，清除本地数据
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
          setToken(null);
          setUser(null);
        }
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // 定期刷新token（每7小时）
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(async () => {
      await refreshToken();
    }, 7 * 60 * 60 * 1000); // 7小时

    return () => clearInterval(interval);
  }, [token]);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      login,
      logout,
      refreshToken,
      verifyToken
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
