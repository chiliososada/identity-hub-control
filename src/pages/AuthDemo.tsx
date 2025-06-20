
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LoginForm } from '@/components/auth/LoginForm';
import { UserProfile } from '@/components/auth/UserProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Shield, Settings } from 'lucide-react';

export default function AuthDemo() {
  const { user, profile, signOut } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">身份验证演示</h1>
            <p className="text-xl text-muted-foreground">
              展示简化的Supabase身份验证系统功能
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">身份验证演示</h1>
          <p className="text-xl text-muted-foreground">
            欢迎使用简化的身份验证系统
          </p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">
              <Users className="mr-2 h-4 w-4" />
              用户信息
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="mr-2 h-4 w-4" />
              安全操作
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="mr-2 h-4 w-4" />
              系统设置
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <UserProfile />
              <Card>
                <CardHeader>
                  <CardTitle>系统状态</CardTitle>
                  <CardDescription>当前认证状态信息</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>认证状态:</span>
                    <Badge variant="default">已认证</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>认证方式:</span>
                    <Badge variant="secondary">Supabase Auth</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>用户角色:</span>
                    <Badge variant="outline">{profile?.role || 'member'}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>安全操作</CardTitle>
                <CardDescription>管理您的认证会话和安全设置</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Button variant="destructive" onClick={signOut}>
                    退出登录
                  </Button>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <p>• 退出登录将结束您的当前会话</p>
                  <p>• 您需要重新登录才能访问受保护的内容</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>用户信息</CardTitle>
                <CardDescription>您的账户基本信息</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <strong>用户ID:</strong> {user.id}
                  </div>
                  <div>
                    <strong>邮箱:</strong> {user.email}
                  </div>
                  <div>
                    <strong>注册时间:</strong> {new Date(user.created_at).toLocaleString()}
                  </div>
                  <div>
                    <strong>角色:</strong> {profile?.role || 'member'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
