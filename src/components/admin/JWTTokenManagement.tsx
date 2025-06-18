
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Key, Shield, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import TokensTable from './jwt/TokensTable';
import KeysTable from './jwt/KeysTable';
import TokenSettings from './jwt/TokenSettings';
import GenerateKeyDialog from './jwt/GenerateKeyDialog';
import { useTokenOperations } from './jwt/useTokenOperations';
import { AuthToken, JWTKey } from './jwt/types';

const JWTTokenManagement = () => {
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [keyRefreshTrigger, setKeyRefreshTrigger] = useState(0);
  const { toast } = useToast();
  const { batchRevokeTokensMutation } = useTokenOperations();

  // Fetch active tokens with user and tenant information
  const { data: tokens = [], isLoading: tokensLoading, error: tokensError } = useQuery({
    queryKey: ['auth-tokens'],
    queryFn: async () => {
      console.log('Fetching auth tokens...');
      
      const { data, error } = await supabase
        .from('auth_tokens')
        .select(`
          *,
          profiles!auth_tokens_user_id_fkey (
            email,
            full_name
          ),
          tenants!auth_tokens_tenant_id_fkey (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tokens:', error);
        throw error;
      }

      console.log('Fetched tokens:', data?.length || 0);
      
      // Transform data to include user email and tenant name
      return (data || []).map(token => ({
        ...token,
        user_email: token.profiles?.email || token.profiles?.full_name || `用户-${token.user_id.slice(0, 8)}`,
        tenant_name: token.tenants?.name || `租户-${token.tenant_id.slice(0, 8)}`
      })) as AuthToken[];
    }
  });

  // Mock data for JWT keys (updated with refresh trigger)
  const mockJWTKeys: JWTKey[] = [
    {
      id: '1',
      name: 'Production Key',
      algorithm: 'RS256',
      created_at: '2024-01-15',
      expires_at: '2025-01-15',
      is_active: true,
      usage_count: tokens.filter(t => !t.is_revoked).length,
      last_used: tokens[0]?.last_used_at || '2024-06-18 10:30:00'
    },
    {
      id: '2', 
      name: 'Development Key',
      algorithm: 'RS256',
      created_at: '2024-06-01',
      expires_at: '2025-06-01',
      is_active: true,
      usage_count: Math.floor(tokens.length / 3),
      last_used: '2024-06-18 09:15:00'
    }
  ];

  // Add mock keys based on refresh trigger (simulating new generated keys)
  if (keyRefreshTrigger > 0) {
    for (let i = 0; i < keyRefreshTrigger; i++) {
      mockJWTKeys.push({
        id: `generated-${i + 3}`,
        name: `Generated Key ${i + 1}`,
        algorithm: 'RS256',
        created_at: new Date().toISOString().split('T')[0],
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        is_active: true,
        usage_count: 0,
        last_used: '从未使用'
      });
    }
  }

  const handleSelectToken = (tokenId: string, checked: boolean) => {
    if (checked) {
      setSelectedTokens(prev => [...prev, tokenId]);
    } else {
      setSelectedTokens(prev => prev.filter(id => id !== tokenId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const activeTokens = tokens.filter(token => !token.is_revoked && new Date(token.expires_at) > new Date());
      setSelectedTokens(activeTokens.map(token => token.id));
    } else {
      setSelectedTokens([]);
    }
  };

  const handleBatchRevoke = () => {
    if (selectedTokens.length === 0) {
      toast({ title: "提示", description: "请选择要撤销的Token", variant: "destructive" });
      return;
    }

    batchRevokeTokensMutation.mutate({ 
      tokenIds: selectedTokens,
      reason: '批量撤销'
    });
    setSelectedTokens([]);
  };

  const handleKeyGenerated = () => {
    console.log('Key generated, refreshing key list...');
    setKeyRefreshTrigger(prev => prev + 1);
  };

  if (tokensError) {
    console.error('Error loading tokens:', tokensError);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-semibold">JWT Token 管理</h3>
          <p className="text-sm text-muted-foreground">管理JWT密钥对和访问令牌</p>
        </div>
      </div>

      <Tabs defaultValue="tokens" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tokens" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Token管理
          </TabsTrigger>
          <TabsTrigger value="keys" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            密钥管理
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            配置设置
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tokens">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                活跃 Token 管理
              </CardTitle>
              <CardDescription>
                查看和管理当前活跃的JWT Token ({tokens.length} 个Token)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TokensTable
                tokens={tokens}
                isLoading={tokensLoading}
                selectedTokens={selectedTokens}
                onSelectToken={handleSelectToken}
                onSelectAll={handleSelectAll}
                onBatchRevoke={handleBatchRevoke}
              />
            </CardContent>
          </Card>
        </TabsContent>

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
                    管理用于签名和验证JWT Token的密钥对 ({mockJWTKeys.length} 个密钥对)
                  </CardDescription>
                </div>
                
                <div className="flex items-center gap-2">
                  <GenerateKeyDialog 
                    isOpen={isGenerateDialogOpen} 
                    onOpenChange={setIsGenerateDialogOpen}
                    onKeyGenerated={handleKeyGenerated}
                  />
                  <button
                    onClick={() => setIsGenerateDialogOpen(true)}
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                  >
                    <Key className="h-4 w-4" />
                    生成新密钥对
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <KeysTable keys={mockJWTKeys} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <TokenSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default JWTTokenManagement;
