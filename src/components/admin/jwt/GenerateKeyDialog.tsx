
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Key } from 'lucide-react';

interface GenerateKeyDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (data: { keyName: string; expiryDays: number; description?: string }) => void;
  isGenerating: boolean;
}

const GenerateKeyDialog = ({ isOpen, onOpenChange, onGenerate, isGenerating }: GenerateKeyDialogProps) => {
  const [keyName, setKeyName] = useState('');
  const [expiryDays, setExpiryDays] = useState(365);
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!keyName.trim()) {
      return;
    }

    onGenerate({
      keyName: keyName.trim(),
      expiryDays,
      description: description.trim() || undefined
    });

    // 重置表单
    setKeyName('');
    setExpiryDays(365);
    setDescription('');
    onOpenChange(false);
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
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder="例如：Production Key"
              disabled={isGenerating}
            />
          </div>
          <div>
            <Label htmlFor="expiryDays">有效期（天）</Label>
            <Input
              id="expiryDays"
              type="number"
              value={expiryDays}
              onChange={(e) => setExpiryDays(parseInt(e.target.value) || 365)}
              min="1"
              max="3650"
              disabled={isGenerating}
            />
          </div>
          <div>
            <Label htmlFor="description">描述（可选）</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="密钥用途描述..."
              disabled={isGenerating}
              rows={3}
            />
          </div>
          <Button 
            onClick={handleSubmit} 
            className="w-full"
            disabled={isGenerating || !keyName.trim()}
          >
            {isGenerating ? '正在生成...' : '生成密钥对'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateKeyDialog;
