
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
  onKeyGenerated?: () => void;
}

const GenerateKeyDialog = ({ isOpen, onOpenChange, onKeyGenerated }: GenerateKeyDialogProps) => {
  const [newKeyName, setNewKeyName] = useState('');
  const [keyExpiryDays, setKeyExpiryDays] = useState(365);
  const [isGenerating, setIsGenerating] = useState(false);
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

  const handleGenerateKeyPair = async () => {
    if (!newKeyName.trim()) {
      toast({ title: "错误", description: "请输入密钥名称", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Simulate key generation delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { publicKey, privateKey } = generateKeyPair();
      
      console.log('Generated new key pair:', { name: newKeyName, expiryDays: keyExpiryDays });
      
      toast({ 
        title: "密钥对生成成功", 
        description: `密钥对 "${newKeyName}" 已生成并保存` 
      });
      
      // Reset form
      setNewKeyName('');
      setKeyExpiryDays(365);
      
      // Close dialog
      onOpenChange(false);
      
      // Notify parent component
      if (onKeyGenerated) {
        onKeyGenerated();
      }
    } catch (error) {
      console.error('Error generating key pair:', error);
      toast({ 
        title: "生成失败", 
        description: "生成密钥对时发生错误", 
        variant: "destructive" 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
              disabled={isGenerating}
            />
          </div>
          <div>
            <Label htmlFor="expiryDays">有效期（天）</Label>
            <Input
              id="expiryDays"
              type="number"
              value={keyExpiryDays}
              onChange={(e) => setKeyExpiryDays(parseInt(e.target.value) || 365)}
              min="1"
              max="3650"
              disabled={isGenerating}
            />
          </div>
          <Button 
            onClick={handleGenerateKeyPair} 
            className="w-full"
            disabled={isGenerating || !newKeyName.trim()}
          >
            {isGenerating ? '正在生成...' : '生成密钥对'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateKeyDialog;
