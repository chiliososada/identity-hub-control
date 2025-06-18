
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar } from 'lucide-react';

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  newUsersThisMonth: number;
}

interface UserStatsCardsProps {
  stats?: UserStats;
}

const UserStatsCards = ({ stats }: UserStatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">总用户数</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
          <p className="text-xs text-muted-foreground">
            系统注册用户总数
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">活跃用户</CardTitle>
          <Users className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats?.activeUsers || 0}</div>
          <p className="text-xs text-muted-foreground">
            当前活跃的用户数
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">未激活用户</CardTitle>
          <Users className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{stats?.inactiveUsers || 0}</div>
          <p className="text-xs text-muted-foreground">
            未激活的用户数
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">本月新增</CardTitle>
          <Calendar className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats?.newUsersThisMonth || 0}</div>
          <p className="text-xs text-muted-foreground">
            本月新注册用户
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserStatsCards;
