import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Users, MoreHorizontal, Building, Edit, Eye, UserX, UserCheck, Key } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ResetPasswordDialog } from '@/components/admin/ResetPasswordDialog';

type Profile = Tables<'profiles'>;
type EnhancedProfile = Profile & {
  tenant_roles?: Array<{
    tenant_name: string;
    role: string;
    is_active: boolean;
  }>;
};

interface UserTableProps {
  users?: EnhancedProfile[];
  totalCount: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  pageSize: number;
}

const UserTable = ({ users = [], totalCount, currentPage, setCurrentPage, pageSize }: UserTableProps) => {
  const [selectedUser, setSelectedUser] = useState<EnhancedProfile | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<EnhancedProfile | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !isActive })
        .eq('id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users_dashboard'] });
      toast({ title: "用户状态更新成功" });
    },
    onError: (error: any) => {
      toast({ title: "更新失败", description: error.message, variant: "destructive" });
    },
  });

  const totalPages = Math.ceil(totalCount / pageSize);

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner': return 'default';
      case 'admin': return 'secondary';
      case 'member': return 'outline';
      case 'viewer': return 'outline';
      case 'test_user': return 'destructive';
      default: return 'outline';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'owner': return '所有者';
      case 'admin': return '管理员';
      case 'member': return '成员';
      case 'viewer': return '查看者';
      case 'test_user': return '测试用户';
      default: return role;
    }
  };

  const handleViewUser = (user: EnhancedProfile) => {
    setSelectedUser(user);
    setViewDialogOpen(true);
  };

  const handleToggleStatus = (user: EnhancedProfile) => {
    toggleUserStatusMutation.mutate({ userId: user.id, isActive: user.is_active ?? false });
  };

  const handleResetPassword = (user: EnhancedProfile) => {
    setResetPasswordUser(user);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            用户列表
          </CardTitle>
          <CardDescription>
            共 {totalCount || 0} 个用户，当前显示第 {currentPage} 页
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>用户信息</TableHead>
                  <TableHead>公司职位</TableHead>
                  <TableHead>用户角色</TableHead>
                  <TableHead>账户类型</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>最后登录</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{user.full_name || '未设置姓名'}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {user.company && (
                          <div className="flex items-center gap-1 text-sm">
                            <Building className="h-3 w-3" />
                            {user.company}
                          </div>
                        )}
                        {user.job_title && (
                          <div className="text-sm text-muted-foreground">{user.job_title}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                          {getRoleDisplayName(user.role)}
                        </Badge>
                        {user.tenant_roles?.slice(0, 1).map((membership, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {getRoleDisplayName(membership.role)}
                          </Badge>
                        ))}
                        {user.tenant_roles && user.tenant_roles.length > 1 && (
                          <Badge variant="outline" className="text-xs">
                            +{user.tenant_roles.length - 1}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.is_test_account && (
                          <Badge variant="destructive" className="text-xs">
                            测试账户
                          </Badge>
                        )}
                        {user.is_company_admin && (
                          <Badge variant="secondary" className="text-xs">
                            公司管理员
                          </Badge>
                        )}
                        {!user.is_test_account && !user.is_company_admin && (
                          <Badge variant="outline" className="text-xs">
                            普通用户
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? 'default' : 'secondary'}>
                        {user.is_active ? '激活' : '未激活'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.last_login_at ? (
                        <div className="text-sm">
                          {new Date(user.last_login_at).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">从未登录</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewUser(user)}>
                            <Eye className="h-4 w-4 mr-2" />
                            查看详情
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                            <Key className="h-4 w-4 mr-2" />
                            重置密码
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                            {user.is_active ? (
                              <>
                                <UserX className="h-4 w-4 mr-2" />
                                禁用用户
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4 mr-2" />
                                启用用户
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                      }}
                      className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(pageNum);
                          }}
                          isActive={currentPage === pageNum}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  
                  <PaginationItem>
                    <PaginationNext 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                      }}
                      className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 用户详情对话框 */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>用户详细信息</DialogTitle>
            <DialogDescription>查看用户的完整档案信息</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">姓名</label>
                  <p className="text-sm text-muted-foreground">{selectedUser.full_name || '未设置'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">邮箱</label>
                  <p className="text-sm text-muted-foreground">{selectedUser.email || '未设置'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">公司</label>
                  <p className="text-sm text-muted-foreground">{selectedUser.company || '未设置'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">职位</label>
                  <p className="text-sm text-muted-foreground">{selectedUser.job_title || '未设置'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">用户角色</label>
                  <div className="flex items-center gap-2">
                    <Badge variant={getRoleBadgeVariant(selectedUser.role)}>
                      {getRoleDisplayName(selectedUser.role)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">账户类型</label>
                  <div className="flex flex-wrap gap-1">
                    {selectedUser.is_test_account && (
                      <Badge variant="destructive">测试账户</Badge>
                    )}
                    {selectedUser.is_company_admin && (
                      <Badge variant="secondary">公司管理员</Badge>
                    )}
                    {!selectedUser.is_test_account && !selectedUser.is_company_admin && (
                      <Badge variant="outline">普通用户</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">状态</label>
                  <p className="text-sm text-muted-foreground">
                    <Badge variant={selectedUser.is_active ? 'default' : 'secondary'}>
                      {selectedUser.is_active ? '激活' : '未激活'}
                    </Badge>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">创建时间</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : '未知'}
                  </p>
                </div>
              </div>
              {selectedUser.tenant_roles && selectedUser.tenant_roles.length > 0 && (
                <div>
                  <label className="text-sm font-medium">租户角色</label>
                  <div className="mt-2 space-y-2">
                    {selectedUser.tenant_roles.map((role, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">{role.tenant_name}</span>
                        <Badge variant={getRoleBadgeVariant(role.role)}>
                          {getRoleDisplayName(role.role)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 重置密码对话框 */}
      <ResetPasswordDialog
        profile={resetPasswordUser!}
        open={!!resetPasswordUser}
        onOpenChange={(open) => !open && setResetPasswordUser(null)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['users_dashboard'] });
          toast({ title: "密码重置成功", description: "用户密码已成功重置" });
        }}
      />
    </>
  );
};

export default UserTable;
