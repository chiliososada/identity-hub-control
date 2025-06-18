
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';
import CreateUserDialog from './CreateUserDialog';

interface UserSearchFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  onUserCreated: () => void;
}

const UserSearchFilters = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  onUserCreated,
}: UserSearchFiltersProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          筛选和搜索
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="搜索用户姓名、邮箱或公司..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="状态筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有状态</SelectItem>
              <SelectItem value="active">激活</SelectItem>
              <SelectItem value="inactive">未激活</SelectItem>
            </SelectContent>
          </Select>
          
          <CreateUserDialog onUserCreated={onUserCreated} />
        </div>
      </CardContent>
    </Card>
  );
};

export default UserSearchFilters;
