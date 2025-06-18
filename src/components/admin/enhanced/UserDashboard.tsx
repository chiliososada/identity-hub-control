
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import UserStatsCards from './UserStatsCards';
import UserSearchFilters from './UserSearchFilters';
import UserTable from './UserTable';

type Profile = Tables<'profiles'>;
type EnhancedProfile = Profile & {
  tenant_roles?: Array<{
    tenant_name: string;
    role: string;
    is_active: boolean;
  }>;
};

const UserDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users_dashboard', searchTerm, statusFilter, currentPage],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,company.ilike.%${searchTerm}%`);
      }
      
      if (statusFilter !== 'all') {
        query = query.eq('is_active', statusFilter === 'active');
      }
      
      // 分页
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
      
      const { data, error, count } = await query;
      if (error) throw error;
      
      if (!data) return { users: [], totalCount: 0 };

      // Get tenant membership data for each user
      const userIds = data.map(user => user.id);
      const { data: membershipData } = await supabase
        .from('tenant_members')
        .select(`
          user_id,
          role,
          is_active,
          tenants(name)
        `)
        .in('user_id', userIds);

      // Combine user data with tenant roles
      const enhancedUsers: EnhancedProfile[] = data.map(user => {
        const userMemberships = membershipData?.filter(m => m.user_id === user.id) || [];
        const tenant_roles = userMemberships.map(membership => ({
          tenant_name: (membership.tenants as any)?.name || 'Unknown',
          role: membership.role,
          is_active: membership.is_active
        }));

        return {
          ...user,
          tenant_roles
        };
      });
      
      return {
        users: enhancedUsers,
        totalCount: count || 0
      };
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['user_stats'],
    queryFn: async () => {
      const [
        { count: totalUsers },
        { count: activeUsers },
        { count: inactiveUsers },
        { count: newUsersThisMonth }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', false),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', new Date(new Date().setDate(1)).toISOString())
      ]);
      
      return {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        inactiveUsers: inactiveUsers || 0,
        newUsersThisMonth: newUsersThisMonth || 0
      };
    },
  });

  const handleUserCreated = () => {
    // This will trigger a re-fetch of the user data
    console.log('User created successfully');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">加载用户数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <UserStatsCards stats={stats} />
      
      <UserSearchFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onUserCreated={handleUserCreated}
      />
      
      <UserTable
        users={usersData?.users}
        totalCount={usersData?.totalCount || 0}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        pageSize={pageSize}
      />
    </div>
  );
};

export default UserDashboard;
