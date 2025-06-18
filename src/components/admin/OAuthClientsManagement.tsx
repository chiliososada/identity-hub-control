
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Copy } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

type OAuthClient = Tables<'oauth_clients'>;

const OAuthClientsManagement = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<OAuthClient | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clients, isLoading } = useQuery({
    queryKey: ['oauth_clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('oauth_clients')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: tenants } = useQuery({
    queryKey: ['tenants_for_oauth'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('id, name')
        .eq('is_active', true);
      
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (clientData: TablesInsert<'oauth_clients'>) => {
      const { data, error } = await supabase
        .from('oauth_clients')
        .insert(clientData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oauth_clients'] });
      setIsCreateOpen(false);
      toast({ title: "OAuth客户端创建成功" });
    },
    onError: (error: any) => {
      toast({ title: "创建失败", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...clientData }: Partial<OAuthClient> & { id: string }) => {
      const { data, error } = await supabase
        .from('oauth_clients')
        .update(clientData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oauth_clients'] });
      setEditingClient(null);
      toast({ title: "OAuth客户端更新成功" });
    },
    onError: (error: any) => {
      toast({ title: "更新失败", description: error.message, variant: "destructive" });
    },
  });

  const generateSecret = () => {
    return 'oauth_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const generateClientId = () => {
    return 'client_' + Math.random().toString(36).substring(2, 15);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "已复制到剪贴板" });
  };

  const OAuthClientForm = ({ client, onSubmit, buttonText }: {
    client?: OAuthClient | null;
    onSubmit: (data: TablesInsert<'oauth_clients'>) => void;
    buttonText: string;
  }) => {
    const [formData, setFormData] = useState({
      client_name: client?.client_name || '',
      client_id: client?.client_id || generateClientId(),
      client_secret: client?.client_secret || generateSecret(),
      redirect_uris: client?.redirect_uris?.join('\n') || '',
      scopes: client?.scopes?.join(', ') || 'read',
      tenant_id: client?.tenant_id || '',
      is_active: client?.is_active ?? true,
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const submitData: TablesInsert<'oauth_clients'> = {
        client_name: formData.client_name,
        client_id: formData.client_id,
        client_secret: formData.client_secret,
        redirect_uris: formData.redirect_uris.split('\n').filter(uri => uri.trim()),
        scopes: formData.scopes.split(',').map(scope => scope.trim()).filter(scope => scope),
        tenant_id: formData.tenant_id || null,
        is_active: formData.is_active,
      };
      onSubmit(submitData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="client_name">客户端名称</Label>
          <Input
            id="client_name"
            value={formData.client_name}
            onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="client_id">客户端ID</Label>
          <div className="flex gap-2">
            <Input
              id="client_id"
              value={formData.client_id}
              onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
              required
            />
            <Button type="button" variant="outline" onClick={() => setFormData({ ...formData, client_id: generateClientId() })}>
              重新生成
            </Button>
          </div>
        </div>
        <div>
          <Label htmlFor="client_secret">客户端密钥</Label>
          <div className="flex gap-2">
            <Input
              id="client_secret"
              value={formData.client_secret}
              onChange={(e) => setFormData({ ...formData, client_secret: e.target.value })}
              required
            />
            <Button type="button" variant="outline" onClick={() => setFormData({ ...formData, client_secret: generateSecret() })}>
              重新生成
            </Button>
          </div>
        </div>
        <div>
          <Label htmlFor="redirect_uris">重定向URI（每行一个）</Label>
          <textarea
            id="redirect_uris"
            value={formData.redirect_uris}
            onChange={(e) => setFormData({ ...formData, redirect_uris: e.target.value })}
            className="w-full border border-input bg-background px-3 py-2 rounded-md min-h-[100px]"
            placeholder="https://example.com/callback"
          />
        </div>
        <div>
          <Label htmlFor="scopes">权限范围（逗号分隔）</Label>
          <Input
            id="scopes"
            value={formData.scopes}
            onChange={(e) => setFormData({ ...formData, scopes: e.target.value })}
            placeholder="read, write, admin"
          />
        </div>
        <div>
          <Label htmlFor="tenant_id">关联租户</Label>
          <select
            id="tenant_id"
            value={formData.tenant_id}
            onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
            className="w-full border border-input bg-background px-3 py-2 rounded-md"
          >
            <option value="">无关联租户</option>
            {tenants?.map(tenant => (
              <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: !!checked })}
          />
          <Label htmlFor="is_active">激活状态</Label>
        </div>
        <Button type="submit" className="w-full">
          {buttonText}
        </Button>
      </form>
    );
  };

  if (isLoading) {
    return <div>加载中...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">OAuth客户端列表</h3>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              添加客户端
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>创建新OAuth客户端</DialogTitle>
            </DialogHeader>
            <OAuthClientForm
              onSubmit={(data) => createMutation.mutate(data)}
              buttonText="创建客户端"
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {clients?.map((client) => (
          <div key={client.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold">{client.client_name}</h4>
                <div className="flex gap-2 mt-2">
                  <Badge variant={client.is_active ? 'default' : 'secondary'}>
                    {client.is_active ? '激活' : '未激活'}
                  </Badge>
                  {client.scopes?.map(scope => (
                    <Badge key={scope} variant="outline">{scope}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Dialog open={editingClient?.id === client.id} onOpenChange={(open) => {
                  if (!open) setEditingClient(null);
                }}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingClient(client)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>编辑OAuth客户端</DialogTitle>
                    </DialogHeader>
                    <OAuthClientForm
                      client={editingClient}
                      onSubmit={(data) => updateMutation.mutate({ ...data, id: client.id })}
                      buttonText="更新客户端"
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <div className="grid gap-2 text-sm">
              <div className="flex items-center gap-2">
                <strong>客户端ID:</strong>
                <code className="bg-muted px-2 py-1 rounded text-xs">{client.client_id}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(client.client_id)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <strong>客户端密钥:</strong>
                <code className="bg-muted px-2 py-1 rounded text-xs">
                  {client.client_secret.substring(0, 20)}...
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(client.client_secret)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              {client.redirect_uris && client.redirect_uris.length > 0 && (
                <div>
                  <strong>重定向URI:</strong>
                  <ul className="mt-1 ml-4">
                    {client.redirect_uris.map((uri, index) => (
                      <li key={index} className="text-xs text-muted-foreground">• {uri}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OAuthClientsManagement;
