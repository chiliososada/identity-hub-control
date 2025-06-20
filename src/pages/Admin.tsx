
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building, Shield, BarChart3, Settings, UserCheck } from "lucide-react";
import ProfilesManagement from "@/components/admin/ProfilesManagement";
import TenantsManagement from "@/components/admin/TenantsManagement";
import TenantMembersManagement from "@/components/admin/TenantMembersManagement";
import PermissionsManagement from "@/components/admin/PermissionsManagement";
import SystemSettings from "@/components/admin/SystemSettings";
import UserDashboard from "@/components/admin/enhanced/UserDashboard";

const Admin = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            多租户认证管理平台
          </h1>
          <p className="text-muted-foreground text-lg">基于Supabase Auth的简化认证管理系统</p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 h-auto p-1">
            <TabsTrigger value="dashboard" className="flex items-center gap-2 p-3">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">仪表板</span>
            </TabsTrigger>
            <TabsTrigger value="profiles" className="flex items-center gap-2 p-3">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">用户管理</span>
            </TabsTrigger>
            <TabsTrigger value="tenants" className="flex items-center gap-2 p-3">
              <Building className="h-4 w-4" />
              <span className="hidden sm:inline">租户管理</span>
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2 p-3">
              <UserCheck className="h-4 w-4" />
              <span className="hidden sm:inline">权限配置</span>
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2 p-3">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">成员管理</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2 p-3">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">系统设置</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  用户管理仪表板
                </CardTitle>
                <CardDescription>
                  查看系统用户统计数据、活跃度分析和用户管理操作
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <UserDashboard />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profiles">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  用户档案管理
                </CardTitle>
                <CardDescription>
                  管理系统中的所有用户档案信息，包括基本资料、角色权限和状态设置
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <ProfilesManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tenants">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20">
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  租户管理
                </CardTitle>
                <CardDescription>
                  管理系统中的租户组织，配置企业信息、订阅计划和用户限制
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <TenantsManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permissions">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  权限配置管理
                </CardTitle>
                <CardDescription>
                  管理用户在不同租户中的角色权限，配置访问控制和权限分配
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <PermissionsManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  租户成员管理
                </CardTitle>
                <CardDescription>
                  管理租户的成员关系，分配角色权限和成员状态
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <TenantMembersManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-950/20 dark:to-gray-950/20">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  系统设置
                </CardTitle>
                <CardDescription>
                  配置系统全局设置，包括时区、语言、通知和安全策略
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <SystemSettings />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
