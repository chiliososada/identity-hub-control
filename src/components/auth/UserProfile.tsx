
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, RefreshCw, Shield } from 'lucide-react';
import { useState } from 'react';

export const UserProfile = () => {
  const { user, logout, refreshToken, verifyToken } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!user) return null;

  const handleRefreshToken = async () => {
    setIsRefreshing(true);
    const result = await refreshToken();
    setIsRefreshing(false);
    
    if (result.success) {
      console.log('Token refreshed successfully');
    } else {
      console.error('Token refresh failed:', result.error);
    }
  };

  const handleVerifyToken = async () => {
    setIsVerifying(true);
    const result = await verifyToken();
    setIsVerifying(false);
    
    console.log('Token verification:', result);
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return email ? email[0].toUpperCase() : 'U';
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={user.avatar_url} />
            <AvatarFallback>
              {getInitials(user.full_name, user.email)}
            </AvatarFallback>
          </Avatar>
          用户信息
        </CardTitle>
        <CardDescription>
          当前登录用户的详细信息
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p><strong>邮箱:</strong> {user.email}</p>
          {user.full_name && (
            <p><strong>姓名:</strong> {user.full_name}</p>
          )}
          <div className="flex items-center gap-2">
            <strong>角色:</strong>
            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
              {user.role}
            </Badge>
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            onClick={handleRefreshToken}
            disabled={isRefreshing}
            className="w-full"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            刷新Token
          </Button>
          
          <Button
            variant="outline"
            onClick={handleVerifyToken}
            disabled={isVerifying}
            className="w-full"
          >
            <Shield className="mr-2 h-4 w-4" />
            验证Token
          </Button>
          
          <Button
            variant="destructive"
            onClick={logout}
            className="w-full"
          >
            <LogOut className="mr-2 h-4 w-4" />
            登出
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
