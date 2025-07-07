
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserPlus, Check, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const CreateAdminButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; credentials?: any } | null>(null);

  const createAdminUser = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('create-admin-user');

      if (error) {
        console.error('Error creating admin user:', error);
        setResult({
          success: false,
          message: `创建失败: ${error.message}`
        });
        return;
      }

      if (data?.error) {
        setResult({
          success: false,
          message: `创建失败: ${data.error}`
        });
        return;
      }

      setResult({
        success: true,
        message: '管理员账户创建成功！',
        credentials: {
          email: data.email,
          password: data.password
        }
      });

    } catch (error: any) {
      console.error('Create admin user error:', error);
      setResult({
        success: false,
        message: `创建失败: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          创建管理员账户
        </CardTitle>
        <CardDescription>
          创建一个固定的系统管理员账户用于登录管理系统
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={createAdminUser}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? '创建中...' : '创建管理员账户'}
        </Button>

        {result && (
          <Alert variant={result.success ? 'default' : 'destructive'}>
            {result.success ? (
              <Check className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              {result.message}
              {result.success && result.credentials && (
                <div className="mt-2 p-2 bg-muted rounded text-sm">
                  <div><strong>邮箱:</strong> {result.credentials.email}</div>
                  <div><strong>密码:</strong> {result.credentials.password}</div>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
