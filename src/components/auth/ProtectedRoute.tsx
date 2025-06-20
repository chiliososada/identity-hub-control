
import { useAuth } from '@/hooks/useAuth';
import { LoginForm } from './LoginForm';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: string;
}

export const ProtectedRoute = ({ children, requireRole }: ProtectedRouteProps) => {
  const { user, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <LoginForm />
      </div>
    );
  }

  // 检查角色权限
  if (requireRole && profile?.role !== requireRole && profile?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">访问被拒绝</h1>
          <p className="text-muted-foreground">您没有权限访问此页面</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
