
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Key, RefreshCw, Copy, Eye, EyeOff, Settings, Shield } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const JWTTokenManagement = () => {
  const [showSecrets, setShowSecrets] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [keyExpiryDays, setKeyExpiryDays] = useState(365);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock data for demonstration - in real implementation, this would come from your database
  const mockJWTKeys = [
    {
      id: '1',
      name: 'Production Key',
      algorithm: 'RS256',
      created_at: '2024-01-15',
      expires_at: '2025-01-15',
      is_active: true,
      usage_count: 1250,
      last_used: '2024-06-18 10:30:00'
    },
    {
      id: '2', 
      name: 'Development Key',
      algorithm: 'RS256',
      created_at: '2024-06-01',
      expires_at: '2025-06-01',
      is_active: true,
      usage_count: 89,
      last_used: '2024-06-18 09:15:00'
    }
  ];

  const mockTokens = [
    {
      id: '1',
      user_id: 'user123',
      user_email: 'admin@example.com',
      tenant_id: 'tenant1',
      tenant_name: '示例企业',
      issued_at: '2024-06-18 10:30:00',
      expires_at: '2024-06-18 18:30:00',
      is_active: true,
      scopes: ['read', 'write', 'admin']
    },
    {
      id: '2',
      user_id: 'user456', 
      user_email: 'user@demo.com',
      tenant_id: 'tenant2',
      tenant_name: '演示公司',
      issued_at: '2024-06-18 09:15:00',
      expires_at: '2024-06-18 17:15:00',
      is_active: true,
      scopes: ['read']
    }
  ];

  const generateKeyPair = () => {
    // Mock key generation - in real implementation, this would generate actual RSA keys
    const mockPublicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4f5wg5l2hKsTeNem/V41
fGnJm6gOdrj8ym3rFkEjWT2btf06nmZpjgp2Q8y+8t3l+bJgK2I9FbZN9ZqHE5y1
...
-----END PUBLIC KEY-----`;

    const mockPrivateKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDh/nCDmXaEqxN4
16b9XjV8acmbqA52uPzKbesWQSNZPZu1/TqeZmmOCnZDzL7y3eX5smArYj0Vtk31
...
-----END PRIVATE KEY-----`;

    return { publicKey: mockPublicKey, privateKey: mockPrivateKey };
  };

  const handleGenerateKeyPair = () => {
    if (!newKeyName.trim()) {
      toast({ title: "错误", description: "请输入密钥名称", variant: "destructive" });
      return;
    }

    const { publicKey, privateKey } = generateKeyPair();
    
    // In real implementation, save to database
    toast({ title: "密钥对生成成功", description: "新的JWT密钥对已生成并保存" });
    setIsGenerateDialogOpen(false);
    setNewKeyName('');
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "已复制", description: `${label}已复制到剪贴板` });
  };

  const revokeToken = (tokenId: string) => {
    // In real implementation, revoke token in database
    toast({ title: "Token已撤销", description: "指定的Token已被撤销" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-semibold">JWT Token 管理</h3>
          <p className="text-sm text-muted-foreground">管理JWT密钥对和访问令牌</p>
        </div>
      </div>

      <Tabs defaultValue="keys" className="space-y-6">
        <TabsList>
          <TabsTrigger value="keys" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            密钥管理
          </TabsTrigger>
          <TabsTrigger value="tokens" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Token管理
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            配置设置
          </TabsTrigger>
        </TabsList>

        <TabsContent value="keys">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    JWT 密钥对管理
                  </CardTitle>
                  <CardDescription>
                    管理用于签名和验证JWT Token的密钥对
                  </CardDescription>
                </div>
                
                <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Key className="h-4 w-4 mr-2" />
                      生成新密钥对
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>生成新的JWT密钥对</DialogTitle>
                      <DialogDescription>
                        创建新的RSA密钥对用于JWT Token签名和验证
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="keyName">密钥名称</Label>
                        <Input
                          id="keyName"
                          value={newKeyName}
                          onChange={(e) => setNewKeyName(e.target.value)}
                          placeholder="例如：Production Key"
                        />
                      </div>
                      <div>
                        <Label htmlFor="expiryDays">有效期（天）</Label>
                        <Input
                          id="expiryDays"
                          type="number"
                          value={keyExpiryDays}
                          onChange={(e) => setKeyExpiryDays(parseInt(e.target.value))}
                          min="1"
                          max="3650"
                        />
                      </div>
                      <Button onClick={handleGenerateKeyPair} className="w-full">
                        生成密钥对
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>密钥名称</TableHead>
                      <TableHead>算法</TableHead>
                      <TableHead>创建时间</TableHead>
                      <TableHead>过期时间</TableHead>
                      <TableHead>使用次数</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockJWTKeys.map((key) => (
                      <TableRow key={key.id}>
                        <TableCell className="font-medium">{key.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{key.algorithm}</Badge>
                        </TableCell>
                        <TableCell>{new Date(key.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(key.expires_at).toLocaleDateString()}</TableCell>
                        <TableCell>{key.usage_count.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={key.is_active ? 'default' : 'secondary'}>
                            {key.is_active ? '激活' : '禁用'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard('mock-public-key', '公钥')}
                            >
                              <Copy className="h-4 w-4 mr-1" />
                              复制公钥
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard('mock-private-key', '私钥')}
                            >
                              <Copy className="h-4 w-4 mr-1" />
                              复制私钥
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tokens">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                活跃 Token 管理
              </CardTitle>
              <CardDescription>
                查看和管理当前活跃的JWT Token
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>用户</TableHead>
                      <TableHead>租户</TableHead>
                      <TableHead>权限范围</TableHead>
                      <TableHead>签发时间</TableHead>
                      <TableHead>过期时间</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockTokens.map((token) => (
                      <TableRow key={token.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{token.user_email}</div>
                            <div className="text-sm text-muted-foreground">{token.user_id}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{token.tenant_name}</div>
                            <div className="text-sm text-muted-foreground">{token.tenant_id}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {token.scopes.map((scope) => (
                              <Badge key={scope} variant="outline" className="text-xs">
                                {scope}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(token.issued_at).toLocaleString()}</TableCell>
                        <TableCell>{new Date(token.expires_at).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={token.is_active ? 'default' : 'secondary'}>
                            {token.is_active ? '有效' : '已撤销'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => revokeToken(token.id)}
                            disabled={!token.is_active}
                          >
                            撤销
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default JWTTokenManagement;
