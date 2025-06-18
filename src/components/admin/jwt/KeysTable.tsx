
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Copy, Trash2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { JWTKey } from './types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface KeysTableProps {
  keys: JWTKey[];
  isLoading: boolean;
  onDeleteKey: (keyId: string) => void;
  onToggleStatus: (keyId: string, isActive: boolean) => void;
  isDeleting?: boolean;
  isUpdating?: boolean;
}

const KeysTable = ({ keys, isLoading, onDeleteKey, onToggleStatus, isDeleting, isUpdating }: KeysTableProps) => {
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "已复制", description: `${label}已复制到剪贴板` });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '从未使用';
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-sm text-muted-foreground">加载中...</div>
      </div>
    );
  }

  if (keys.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-sm text-muted-foreground">暂无密钥对，请创建新的密钥对</div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>密钥名称</TableHead>
            <TableHead>密钥ID</TableHead>
            <TableHead>算法</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead>过期时间</TableHead>
            <TableHead>使用次数</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {keys.map((key) => (
            <TableRow key={key.id}>
              <TableCell className="font-medium">{key.key_name}</TableCell>
              <TableCell className="font-mono text-sm">{key.key_id}</TableCell>
              <TableCell>
                <Badge variant="outline">{key.algorithm}</Badge>
              </TableCell>
              <TableCell>{formatDate(key.created_at)}</TableCell>
              <TableCell>{formatDate(key.expires_at)}</TableCell>
              <TableCell>{key.usage_count.toLocaleString()}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge variant={key.is_active ? 'default' : 'secondary'}>
                    {key.is_active ? '激活' : '禁用'}
                  </Badge>
                  {key.is_primary && (
                    <Badge variant="outline" className="text-xs">
                      主密钥
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(key.public_key, '公钥')}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    复制公钥
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(key.private_key, '私钥')}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    复制私钥
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onToggleStatus(key.id, !key.is_active)}
                    disabled={isUpdating}
                  >
                    {key.is_active ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确认删除</AlertDialogTitle>
                        <AlertDialogDescription>
                          确定要删除密钥对 "{key.key_name}" 吗？此操作不可撤销。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDeleteKey(key.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          删除
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default KeysTable;
