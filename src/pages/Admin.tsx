
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building, Key, Shield, BarChart3 } from "lucide-react";
import ProfilesManagement from "@/components/admin/ProfilesManagement";
import TenantsManagement from "@/components/admin/TenantsManagement";
import OAuthClientsManagement from "@/components/admin/OAuthClientsManagement";
import TenantMembersManagement from "@/components/admin/TenantMembersManagement";

const Admin = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            系统管理面板
          </h1>
          <p className="text-muted-foreground text-lg">全面管理用户账户、租户组织和系统配置</p>
        </div>

        <Tabs defaultValue="profiles" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto p-1">
            <TabsTrigger value="profiles" className="flex items-center gap-2 p-3">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">用户管理</span>
              <span className="sm:hidden">用户</span>
            </TabsTrigger>
            <TabsTrigger value="tenants" className="flex items-center gap-2 p-3">
              <Building className="h-4 w-4" />
              <span className="hidden sm:inline">租户管理</span>
              <span className="sm:hidden">租户</span>
            </TabsTrigger>
            <TabsTrigger value="oauth" className="flex items-center gap-2 p-3">
              <Key className="h-4 w-4" />
              <span className="hidden sm:inline">OAuth客户端</span>
              <span className="sm:hidden">OAuth</span>
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2 p-3">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">成员管理</span>
              <span className="sm:hidden">成员</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profiles">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
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
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
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

          <TabsContent value="oauth">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20">
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  OAuth客户端管理
                </CardTitle>
                <CardDescription>
                  管理OAuth认证客户端配置，设置应用权限和回调地址
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <OAuthClientsManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20">
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
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
