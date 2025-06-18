
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useApiCall } from '@/hooks/useApiCall';
import { LoginForm } from '@/components/auth/LoginForm';
import { UserProfile } from '@/components/auth/UserProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Database, Shield, Users } from 'lucide-react';

export default function AuthDemo() {
  const { user, token } = useAuth();
  const { getUserInfo, revokeToken, revokeAllTokens } = useApiCall();
  const [apiResult, setApiResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGetUserInfo = async () => {
    setIsLoading(true);
    const result = await getUserInfo();
    setApiResult(result);
    setIsLoading(false);
  };

  const handleRevokeToken = async () => {
    await revokeToken();
  };

  const handleRevokeAllTokens = async () => {
    await revokeAllTokens();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">身份验证演示</h1>
            <p className="text-xl text-muted-foreground">
              展示完整的JWT身份验证系统功能
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
            欢迎使用JWT身份验证系统
          </p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">
              <Users className="mr-2 h-4 w-4" />
              用户信息
            </TabsTrigger>
            <TabsTrigger value="api">
              <Database className="mr-2 h-4 w-4" />
              API调用
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="mr-2 h-4 w-4" />
              安全操作
            </TabsTrigger>
            <TabsTrigger value="token">
              <Code className="mr-2 h-4 w-4" />
              Token信息
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
                    <span>Token类型:</span>
                    <Badge variant="secondary">JWT</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>会话状态:</span>
                    <Badge variant="default">活跃</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="api" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>API调用测试</CardTitle>
                <CardDescription>测试各种需要认证的API接口</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={handleGetUserInfo} disabled={isLoading}>
                    获取用户详细信息
                  </Button>
                </div>
                
                {apiResult && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">API响应:</h4>
                    <pre className="bg-muted p-4 rounded-md overflow-auto text-sm">
                      {JSON.stringify(apiResult, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>安全操作</CardTitle>
                <CardDescription>管理您的认证会话和安全设置</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Button variant="outline" onClick={handleRevokeToken}>
                    撤销当前Token
                  </Button>
                  <Button variant="destructive" onClick={handleRevokeAllTokens}>
                    撤销所有Token
                  </Button>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <p>• 撤销当前Token会使当前会话失效</p>
                  <p>• 撤销所有Token会使所有设备上的会话失效</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="token" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Token信息</CardTitle>
                <CardDescription>当前JWT Token的详细信息</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <strong>Token长度:</strong> {token?.length} 字符
                  </div>
                  <div>
                    <strong>Token前缀:</strong> {token?.substring(0, 50)}...
                  </div>
                  <div className="text-sm text-muted-foreground mt-4">
                    <p>此Token包含您的身份信息和权限，请妥善保管</p>
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
