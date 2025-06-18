
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GenerateKeyDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const GenerateKeyDialog = ({ isOpen, onOpenChange }: GenerateKeyDialogProps) => {
  const [newKeyName, setNewKeyName] = useState('');
  const [keyExpiryDays, setKeyExpiryDays] = useState(365);
  const { toast } = useToast();

  const generateKeyPair = () => {
    // Mock key generation
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
    
    toast({ title: "密钥对生成成功", description: "新的JWT密钥对已生成并保存" });
    onOpenChange(false);
    setNewKeyName('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
  );
};

export default GenerateKeyDialog;
