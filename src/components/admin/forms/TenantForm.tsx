
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

type Tenant = Tables<'tenants'>;

interface TenantFormProps {
  tenant?: Tenant | null;
  onSubmit: (data: TablesInsert<'tenants'>) => void;
  buttonText: string;
  isLoading?: boolean;
}

export const TenantForm = ({ tenant, onSubmit, buttonText, isLoading }: TenantFormProps) => {
  const [formData, setFormData] = useState({
    name: tenant?.name || '',
    company_name: tenant?.company_name || '',
    company_email: tenant?.company_email || '',
    contact_email: tenant?.contact_email || '',
    contact_phone: tenant?.contact_phone || '',
    domain: tenant?.domain || '',
    tenant_type: tenant?.tenant_type || 'personal' as const,
    subscription_plan: tenant?.subscription_plan || 'free',
    max_users: tenant?.max_users || 5,
    is_active: tenant?.is_active ?? true,
    time_zone: tenant?.time_zone || 'Asia/Shanghai',
    locale: tenant?.locale || 'zh_CN',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '租户名称是必填项';
    }
    
    if (formData.company_email && !/\S+@\S+\.\S+/.test(formData.company_email)) {
      newErrors.company_email = '请输入有效的公司邮箱';
    }
    
    if (formData.contact_email && !/\S+@\S+\.\S+/.test(formData.contact_email)) {
      newErrors.contact_email = '请输入有效的联系邮箱';
    }
    
    if (formData.max_users < 1) {
      newErrors.max_users = '用户数量必须大于0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const submitData: TablesInsert<'tenants'> = {
        name: formData.name.trim(),
        tenant_type: formData.tenant_type,
        company_name: formData.company_name.trim() || null,
        company_email: formData.company_email.trim() || null,
        contact_email: formData.contact_email.trim() || null,
        contact_phone: formData.contact_phone.trim() || null,
        domain: formData.domain.trim() || null,
        subscription_plan: formData.subscription_plan || null,
        max_users: formData.max_users || null,
        is_active: formData.is_active,
        time_zone: formData.time_zone || null,
        locale: formData.locale || null,
      };
      onSubmit(submitData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">租户名称 *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={errors.name ? 'border-red-500' : ''}
            placeholder="我的组织"
          />
          {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
        </div>
        
        <div>
          <Label htmlFor="tenant_type">租户类型</Label>
          <Select value={formData.tenant_type} onValueChange={(value: any) => setFormData({ ...formData, tenant_type: value })}>
            <SelectTrigger>
              <SelectValue placeholder="选择类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="personal">个人</SelectItem>
              <SelectItem value="enterprise">企业</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="company_name">公司名称</Label>
          <Input
            id="company_name"
            value={formData.company_name}
            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            placeholder="公司全称"
          />
        </div>
        
        <div>
          <Label htmlFor="domain">域名</Label>
          <Input
            id="domain"
            value={formData.domain}
            onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
            placeholder="example.com"
          />
        </div>
        
        <div>
          <Label htmlFor="company_email">公司邮箱</Label>
          <Input
            id="company_email"
            type="email"
            value={formData.company_email}
            onChange={(e) => setFormData({ ...formData, company_email: e.target.value })}
            className={errors.company_email ? 'border-red-500' : ''}
            placeholder="contact@company.com"
          />
          {errors.company_email && <p className="text-sm text-red-500 mt-1">{errors.company_email}</p>}
        </div>
        
        <div>
          <Label htmlFor="contact_email">联系邮箱</Label>
          <Input
            id="contact_email"
            type="email"
            value={formData.contact_email}
            onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
            className={errors.contact_email ? 'border-red-500' : ''}
            placeholder="admin@company.com"
          />
          {errors.contact_email && <p className="text-sm text-red-500 mt-1">{errors.contact_email}</p>}
        </div>
        
        <div>
          <Label htmlFor="contact_phone">联系电话</Label>
          <Input
            id="contact_phone"
            value={formData.contact_phone}
            onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
            placeholder="+86 138 0000 0000"
          />
        </div>
        
        <div>
          <Label htmlFor="subscription_plan">订阅计划</Label>
          <Select value={formData.subscription_plan} onValueChange={(value) => setFormData({ ...formData, subscription_plan: value })}>
            <SelectTrigger>
              <SelectValue placeholder="选择计划" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="free">免费版</SelectItem>
              <SelectItem value="basic">基础版</SelectItem>
              <SelectItem value="pro">专业版</SelectItem>
              <SelectItem value="enterprise">企业版</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="max_users">最大用户数</Label>
          <Input
            id="max_users"
            type="number"
            min="1"
            value={formData.max_users}
            onChange={(e) => setFormData({ ...formData, max_users: parseInt(e.target.value) || 5 })}
            className={errors.max_users ? 'border-red-500' : ''}
          />
          {errors.max_users && <p className="text-sm text-red-500 mt-1">{errors.max_users}</p>}
        </div>
        
        <div>
          <Label htmlFor="time_zone">时区</Label>
          <Select value={formData.time_zone} onValueChange={(value) => setFormData({ ...formData, time_zone: value })}>
            <SelectTrigger>
              <SelectValue placeholder="选择时区" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Asia/Shanghai">北京时间 (UTC+8)</SelectItem>
              <SelectItem value="Asia/Tokyo">东京时间 (UTC+9)</SelectItem>
              <SelectItem value="America/New_York">纽约时间 (UTC-5)</SelectItem>
              <SelectItem value="Europe/London">伦敦时间 (UTC+0)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="locale">语言环境</Label>
          <Select value={formData.locale} onValueChange={(value) => setFormData({ ...formData, locale: value })}>
            <SelectTrigger>
              <SelectValue placeholder="选择语言" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="zh_CN">简体中文</SelectItem>
              <SelectItem value="zh_TW">繁体中文</SelectItem>
              <SelectItem value="en_US">English (US)</SelectItem>
              <SelectItem value="ja_JP">日本語</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex items-center space-x-2 pt-4 border-t">
        <Checkbox
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: !!checked })}
        />
        <Label htmlFor="is_active" className="text-sm">激活租户</Label>
      </div>
      
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? '处理中...' : buttonText}
      </Button>
    </form>
  );
};
