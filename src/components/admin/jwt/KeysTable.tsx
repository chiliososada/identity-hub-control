
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { JWTKey } from './types';

interface KeysTableProps {
  keys: JWTKey[];
}

const KeysTable = ({ keys }: KeysTableProps) => {
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "已复制", description: `${label}已复制到剪贴板` });
  };

  return (
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
          {keys.map((key) => (
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
  );
};

export default KeysTable;
