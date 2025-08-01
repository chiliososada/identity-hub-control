
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tables } from '@/integrations/supabase/types';
import { Eye, EyeOff } from 'lucide-react';

type Profile = Tables<'profiles'>;

interface ProfileFormProps {
  profile?: Profile | null;
  onSubmit: (data: any) => void;
  buttonText: string;
  isLoading?: boolean;
}

export const ProfileForm = ({ profile, onSubmit, buttonText, isLoading }: ProfileFormProps) => {
  const [formData, setFormData] = useState({
    email: profile?.email || '',
    password: '',
    full_name: profile?.full_name || '',
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    role: profile?.role || 'member',
    company: profile?.company || '',
    job_title: profile?.job_title || '',
    is_active: profile?.is_active ?? true,
    is_company_admin: profile?.is_company_admin ?? false,
    is_test_account: profile?.is_test_account ?? false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email) {
      newErrors.email = '邮箱是必填项';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }
    
    // 只在创建新用户时验证密码（没有profile时）
    if (!profile && !formData.password) {
      newErrors.password = '密码是必填项';
    } else if (!profile && formData.password && formData.password.length < 6) {
      newErrors.password = '密码至少需要6个字符';
    }
    
    if (!formData.full_name && !formData.first_name && !formData.last_name) {
      newErrors.name = '请至少填写姓名或全名';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // 创建提交数据的副本
      const submitData = { ...formData };
      
      // 如果是编辑现有用户，移除密码字段（因为profiles表中没有password列）
      if (profile) {
        delete submitData.password;
      }
      
      onSubmit(submitData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="email">邮箱地址 *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={errors.email ? 'border-red-500' : ''}
            placeholder="user@example.com"
          />
          {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
        </div>

        {/* 只在创建新用户时显示密码字段 */}
        {!profile && (
          <div className="md:col-span-2">
            <Label htmlFor="password">密码 *</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
                placeholder="请输入密码（至少6个字符）"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
          </div>
        )}
        
        <div>
          <Label htmlFor="full_name">全名</Label>
          <Input
            id="full_name"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            placeholder="张三"
          />
        </div>
        
        <div>
          <Label htmlFor="role">用户角色</Label>
          <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
            <SelectTrigger>
              <SelectValue placeholder="选择角色" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="member">普通成员</SelectItem>
              <SelectItem value="admin">管理员</SelectItem>
              <SelectItem value="owner">所有者</SelectItem>
              <SelectItem value="viewer">查看者</SelectItem>
              <SelectItem value="test_user">测试用户</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="first_name">名</Label>
          <Input
            id="first_name"
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            placeholder="三"
          />
        </div>
        
        <div>
          <Label htmlFor="last_name">姓</Label>
          <Input
            id="last_name"
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            placeholder="张"
          />
        </div>
        
        <div>
          <Label htmlFor="company">公司</Label>
          <Input
            id="company"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            placeholder="公司名称"
          />
        </div>
        
        <div>
          <Label htmlFor="job_title">职位</Label>
          <Input
            id="job_title"
            value={formData.job_title}
            onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
            placeholder="软件工程师"
          />
        </div>
      </div>
      
      {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
      
      <div className="flex flex-col space-y-3 pt-4 border-t">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: !!checked })}
          />
          <Label htmlFor="is_active" className="text-sm">激活账户</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_company_admin"
            checked={formData.is_company_admin}
            onCheckedChange={(checked) => setFormData({ ...formData, is_company_admin: !!checked })}
          />
          <Label htmlFor="is_company_admin" className="text-sm">公司管理员权限</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_test_account"
            checked={formData.is_test_account}
            onCheckedChange={(checked) => setFormData({ ...formData, is_test_account: !!checked })}
          />
          <Label htmlFor="is_test_account" className="text-sm">测试账户</Label>
        </div>
      </div>
      
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? '处理中...' : buttonText}
      </Button>
    </form>
  );
};
