
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Settings, Clock, Globe, Bell, Shield, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SystemSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    defaultTimeZone: 'Asia/Shanghai',
    defaultLocale: 'zh_CN',
    emailNotifications: true,
    systemNotifications: true,
    maintenanceMode: false,
    registrationEnabled: true,
    maxUsersPerTenant: 100,
    sessionTimeout: 24,
    passwordMinLength: 8,
    requireTwoFactor: false,
  });

  const handleSave = () => {
    // 这里应该调用API保存设置
    toast({ 
      title: "设置已保存", 
      description: "系统设置已成功更新" 
    });
  };

  const handleReset = () => {
    setSettings({
      defaultTimeZone: 'Asia/Shanghai',
      defaultLocale: 'zh_CN',
      emailNotifications: true,
      systemNotifications: true,
      maintenanceMode: false,
      registrationEnabled: true,
      maxUsersPerTenant: 100,
      sessionTimeout: 24,
      passwordMinLength: 8,
      requireTwoFactor: false,
    });
    toast({ 
      title: "设置已重置", 
      description: "所有设置已恢复为默认值" 
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold">系统设置</h3>
        <p className="text-sm text-muted-foreground">配置系统全局设置和默认参数</p>
      </div>

      {/* 基本设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            基本设置
          </CardTitle>
          <CardDescription>系统的基本配置参数</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="defaultTimeZone">默认时区</Label>
              <Select 
                value={settings.defaultTimeZone} 
                onValueChange={(value) => setSettings({...settings, defaultTimeZone: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Shanghai">中国标准时间 (UTC+8)</SelectItem>
                  <SelectItem value="Asia/Tokyo">日本标准时间 (UTC+9)</SelectItem>
                  <SelectItem value="UTC">协调世界时 (UTC)</SelectItem>
                  <SelectItem value="America/New_York">美国东部时间 (UTC-5)</SelectItem>
                  <SelectItem value="Europe/London">英国时间 (UTC+0)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultLocale">默认语言</Label>
              <Select 
                value={settings.defaultLocale} 
                onValueChange={(value) => setSettings({...settings, defaultLocale: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zh_CN">简体中文</SelectItem>
                  <SelectItem value="zh_TW">繁体中文</SelectItem>
                  <SelectItem value="en_US">English (US)</SelectItem>
                  <SelectItem value="ja_JP">日本語</SelectItem>
                  <SelectItem value="ko_KR">한국어</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxUsersPerTenant">每租户最大用户数</Label>
              <Input
                id="maxUsersPerTenant"
                type="number"
                value={settings.maxUsersPerTenant}
                onChange={(e) => setSettings({...settings, maxUsersPerTenant: Number(e.target.value)})}
                placeholder="100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">会话超时时间（小时）</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => setSettings({...settings, sessionTimeout: Number(e.target.value)})}
                placeholder="24"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 通知设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            通知设置
          </CardTitle>
          <CardDescription>配置系统通知和邮件通知</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailNotifications">邮件通知</Label>
              <p className="text-sm text-muted-foreground">向用户发送重要事件的邮件通知</p>
            </div>
            <Switch
              id="emailNotifications"
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => setSettings({...settings, emailNotifications: checked})}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="systemNotifications">系统通知</Label>
              <p className="text-sm text-muted-foreground">在界面中显示系统通知</p>
            </div>
            <Switch
              id="systemNotifications"
              checked={settings.systemNotifications}
              onCheckedChange={(checked) => setSettings({...settings, systemNotifications: checked})}
            />
          </div>
        </CardContent>
      </Card>

      {/* 安全设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            安全设置
          </CardTitle>
          <CardDescription>配置系统安全和认证相关设置</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="passwordMinLength">密码最小长度</Label>
              <Input
                id="passwordMinLength"
                type="number"
                value={settings.passwordMinLength}
                onChange={(e) => setSettings({...settings, passwordMinLength: Number(e.target.value)})}
                min="6"
                max="32"
              />
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="requireTwoFactor">强制两步验证</Label>
              <p className="text-sm text-muted-foreground">要求所有用户启用两步验证</p>
            </div>
            <Switch
              id="requireTwoFactor"
              checked={settings.requireTwoFactor}
              onCheckedChange={(checked) => setSettings({...settings, requireTwoFactor: checked})}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="registrationEnabled">允许用户注册</Label>
              <p className="text-sm text-muted-foreground">允许新用户自主注册账户</p>
            </div>
            <Switch
              id="registrationEnabled"
              checked={settings.registrationEnabled}
              onCheckedChange={(checked) => setSettings({...settings, registrationEnabled: checked})}
            />
          </div>
        </CardContent>
      </Card>

      {/* 系统维护 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            系统维护
          </CardTitle>
          <CardDescription>系统维护和紧急设置</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="maintenanceMode">维护模式</Label>
              <p className="text-sm text-muted-foreground">启用后将阻止所有用户访问系统</p>
            </div>
            <Switch
              id="maintenanceMode"
              checked={settings.maintenanceMode}
              onCheckedChange={(checked) => setSettings({...settings, maintenanceMode: checked})}
            />
          </div>

          {settings.maintenanceMode && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ 维护模式已启用，除管理员外的所有用户将无法访问系统
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={handleReset}>
          重置为默认值
        </Button>
        <Button onClick={handleSave}>
          保存设置
        </Button>
      </div>
    </div>
  );
};

export default SystemSettings;
