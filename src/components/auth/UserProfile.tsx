
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut } from 'lucide-react';

export const UserProfile = () => {
  const { user, profile, signOut } = useAuth();

  if (!user) return null;

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
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback>
              {getInitials(profile?.full_name, user.email)}
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
          {profile?.full_name && (
            <p><strong>姓名:</strong> {profile.full_name}</p>
          )}
          <div className="flex items-center gap-2">
            <strong>角色:</strong>
            <Badge variant={profile?.role === 'admin' ? 'default' : 'secondary'}>
              {profile?.role || 'member'}
            </Badge>
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          <Button
            variant="destructive"
            onClick={signOut}
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
