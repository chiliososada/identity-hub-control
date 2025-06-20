
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 从Authorization header获取token
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.substring(7)
    console.log('Getting user info for token:', token.substring(0, 20) + '...')

    // 使用 Supabase Auth 验证 token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      console.error('Token verification failed:', authError)
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 获取用户档案信息
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        *,
        tenants!profiles_tenant_id_fkey (
          id,
          name,
          domain,
          subscription_plan,
          is_active
        )
      `)
      .eq('auth_user_id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('Failed to fetch profile:', profileError)
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 检查用户是否激活
    if (!profile.is_active) {
      return new Response(
        JSON.stringify({ error: 'User account is inactive' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 获取用户的租户角色信息
    const { data: tenantRoles } = await supabase
      .from('tenant_members')
      .select(`
        role,
        is_active,
        joined_at,
        tenants!tenant_members_tenant_id_fkey (
          id,
          name
        )
      `)
      .eq('user_id', profile.id)
      .eq('is_active', true)

    console.log('User info retrieved successfully for user:', profile.id)

    return new Response(
      JSON.stringify({
        user: {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          first_name: profile.first_name,
          last_name: profile.last_name,
          avatar_url: profile.avatar_url,
          company: profile.company,
          job_title: profile.job_title,
          role: profile.role,
          permissions: profile.permissions,
          last_login_at: profile.last_login_at
        },
        tenant: profile.tenants ? {
          id: profile.tenants.id,
          name: profile.tenants.name,
          domain: profile.tenants.domain,
          subscription_plan: profile.tenants.subscription_plan
        } : null,
        tenant_roles: tenantRoles?.map(tr => ({
          tenant_id: tr.tenants?.id,
          tenant_name: tr.tenants?.name,
          role: tr.role,
          joined_at: tr.joined_at
        })) || [],
        session: {
          issued_at: user.created_at,
          expires_at: user.last_sign_in_at
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Get user info error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
