
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building, Key, Shield } from "lucide-react";
import ProfilesManagement from "@/components/admin/ProfilesManagement";
import TenantsManagement from "@/components/admin/TenantsManagement";
import OAuthClientsManagement from "@/components/admin/OAuthClientsManagement";
import TenantMembersManagement from "@/components/admin/TenantMembersManagement";

const Admin = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">管理面板</h1>
          <p className="text-muted-foreground">管理用户账户、租户和OAuth客户端</p>
        </div>

        <Tabs defaultValue="profiles" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profiles" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              用户管理
            </TabsTrigger>
            <TabsTrigger value="tenants" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              租户管理
            </TabsTrigger>
            <TabsTrigger value="oauth" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              OAuth客户端
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              成员管理
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profiles">
            <Card>
              <CardHeader>
                <CardTitle>用户档案管理</CardTitle>
                <CardDescription>
                  管理系统中的所有用户档案信息
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProfilesManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tenants">
            <Card>
              <CardHeader>
                <CardTitle>租户管理</CardTitle>
                <CardDescription>
                  管理系统中的租户组织
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TenantsManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="oauth">
            <Card>
              <CardHeader>
                <CardTitle>OAuth客户端管理</CardTitle>
                <CardDescription>
                  管理OAuth认证客户端配置
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OAuthClientsManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members">
            <Card>
              <CardHeader>
                <CardTitle>租户成员管理</CardTitle>
                <CardDescription>
                  管理租户的成员关系
                </CardDescription>
              </CardHeader>
              <CardContent>
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
