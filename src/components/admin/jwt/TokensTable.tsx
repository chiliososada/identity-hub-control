
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { RefreshCw, Trash2 } from 'lucide-react';
import { AuthToken } from './types';
import { useTokenOperations } from './useTokenOperations';

interface TokensTableProps {
  tokens: AuthToken[];
  isLoading: boolean;
  selectedTokens: string[];
  onSelectToken: (tokenId: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onBatchRevoke: () => void;
}

const TokensTable = ({ 
  tokens, 
  isLoading, 
  selectedTokens, 
  onSelectToken, 
  onSelectAll, 
  onBatchRevoke 
}: TokensTableProps) => {
  const { revokeTokenMutation } = useTokenOperations();

  const getTokenStatus = (token: AuthToken) => {
    if (token.is_revoked) return 'revoked';
    if (new Date(token.expires_at) < new Date()) return 'expired';
    return 'active';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">有效</Badge>;
      case 'expired':
        return <Badge variant="secondary" className="bg-orange-500 text-white">已过期</Badge>;
      case 'revoked':
        return <Badge variant="destructive">已撤销</Badge>;
      default:
        return <Badge variant="outline">未知</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">加载Token数据...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {selectedTokens.length > 0 && (
        <div className="flex justify-end">
          <Button 
            variant="destructive" 
            size="sm"
            onClick={onBatchRevoke}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            批量撤销 ({selectedTokens.length})
          </Button>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedTokens.length === tokens.filter(t => !t.is_revoked && new Date(t.expires_at) > new Date()).length && tokens.length > 0}
                  onCheckedChange={onSelectAll}
                />
              </TableHead>
              <TableHead>用户</TableHead>
              <TableHead>租户</TableHead>
              <TableHead>设备信息</TableHead>
              <TableHead>IP地址</TableHead>
              <TableHead>签发时间</TableHead>
              <TableHead>过期时间</TableHead>
              <TableHead>最后使用</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tokens.map((token) => {
              const status = getTokenStatus(token);
              const canSelect = status === 'active';
              
              return (
                <TableRow key={token.id}>
                  <TableCell>
                    {canSelect && (
                      <Checkbox
                        checked={selectedTokens.includes(token.id)}
                        onCheckedChange={(checked) => onSelectToken(token.id, checked as boolean)}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{token.user_email}</div>
                      <div className="text-sm text-muted-foreground">{token.user_id.slice(0, 8)}...</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{token.tenant_name}</div>
                      <div className="text-sm text-muted-foreground">{token.tenant_id.slice(0, 8)}...</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{token.device_name || '未知设备'}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-32" title={token.user_agent}>
                        {token.user_agent?.slice(0, 30)}...
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{token.ip_address || '未知'}</TableCell>
                  <TableCell>{new Date(token.created_at).toLocaleString()}</TableCell>
                  <TableCell>{new Date(token.expires_at).toLocaleString()}</TableCell>
                  <TableCell>
                    {token.last_used_at ? new Date(token.last_used_at).toLocaleString() : '从未使用'}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(status)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => revokeTokenMutation.mutate({ tokenId: token.id })}
                      disabled={token.is_revoked || revokeTokenMutation.isPending}
                    >
                      {token.is_revoked ? '已撤销' : '撤销'}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        
        {tokens.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            暂无Token数据
          </div>
        )}
      </div>
    </div>
  );
};

export default TokensTable;
