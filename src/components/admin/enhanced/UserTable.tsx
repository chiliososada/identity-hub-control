
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Users, MoreHorizontal, Building } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

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
  const totalPages = Math.ceil(totalCount / pageSize);

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner': return 'default';
      case 'admin': return 'secondary';
      case 'member': return 'outline';
      case 'viewer': return 'outline';
      default: return 'outline';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'owner': return '所有者';
      case 'admin': return '管理员';
      case 'member': return '成员';
      case 'viewer': return '查看者';
      default: return role;
    }
  };

  return (
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
                <TableHead>租户角色</TableHead>
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
                      {user.tenant_roles?.slice(0, 2).map((membership, index) => (
                        <Badge key={index} variant={getRoleBadgeVariant(membership.role)} className="text-xs">
                          {getRoleDisplayName(membership.role)}
                        </Badge>
                      )) || <span className="text-sm text-muted-foreground">无租户</span>}
                      {user.tenant_roles && user.tenant_roles.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{user.tenant_roles.length - 2}
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
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
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
  );
};

export default UserTable;
