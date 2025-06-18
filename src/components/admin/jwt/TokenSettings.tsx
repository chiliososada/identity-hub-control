
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const TokenSettings = () => {
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "已复制", description: `${label}已复制到剪贴板` });
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Token 配置</CardTitle>
          <CardDescription>配置JWT Token的默认设置</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="defaultExpiry">默认过期时间（小时）</Label>
              <Input id="defaultExpiry" type="number" defaultValue="8" min="1" max="168" />
            </div>
            <div>
              <Label htmlFor="refreshExpiry">刷新Token过期时间（天）</Label>
              <Input id="refreshExpiry" type="number" defaultValue="30" min="1" max="365" />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="allowRefresh" defaultChecked />
            <Label htmlFor="allowRefresh">允许Token刷新</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="singleSession" />
            <Label htmlFor="singleSession">单点登录（每个用户只能有一个有效Token）</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>公钥分发</CardTitle>
          <CardDescription>为其他系统提供公钥验证端点</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>公钥验证端点</Label>
            <div className="flex gap-2 mt-1">
              <Input 
                readOnly 
                value="https://your-domain.com/api/auth/jwks" 
                className="bg-muted"
              />
              <Button 
                variant="outline" 
                onClick={() => copyToClipboard('https://your-domain.com/api/auth/jwks', '端点URL')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              其他系统可以通过此端点获取公钥来验证JWT Token
            </p>
          </div>

          <div>
            <Label>示例公钥（JWKS格式）</Label>
            <Textarea
              readOnly
              value={`{
  "keys": [
    {
      "kty": "RSA",
      "kid": "prod-key-2024",
      "use": "sig",
      "alg": "RS256",
      "n": "4f5wg5l2hKsTeNem...",
      "e": "AQAB"
    }
  ]
}`}
              className="bg-muted font-mono text-sm"
              rows={10}
            />
            <Button 
              variant="outline" 
              className="mt-2"
              onClick={() => copyToClipboard('jwks-example', 'JWKS示例')}
            >
              <Copy className="h-4 w-4 mr-2" />
              复制JWKS示例
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TokenSettings;
