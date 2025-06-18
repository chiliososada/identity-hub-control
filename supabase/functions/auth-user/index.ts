
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { verifyJWT } from '../_shared/jwt-utils.ts'

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

    // 首先尝试作为 JWT 验证
    let jwtPayload = null
    let tokenRecord = null

    // 获取所有活跃的 JWT 密钥来验证 token
    const { data: jwtKeys, error: keysError } = await supabase
      .from('jwt_keys')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (!keysError && jwtKeys && jwtKeys.length > 0) {
      // 尝试用每个密钥验证 JWT
      for (const key of jwtKeys) {
        try {
          const verificationResult = await verifyJWT(token, key.public_key, key.algorithm)
          if (verificationResult.valid && verificationResult.payload) {
            jwtPayload = verificationResult.payload
            break
          }
        } catch (error) {
          console.log(`Failed to verify with key ${key.key_id}:`, error.message)
          continue
        }
      }
    }

    // 查找token记录
    const tokenQuery = jwtPayload ? 
      supabase.from('auth_tokens').select(`
        *,
        profiles!auth_tokens_user_id_fkey (
          id,
          email,
          full_name,
          first_name,
          last_name,
          avatar_url,
          company,
          job_title,
          role,
          permissions,
          is_active,
          last_login_at
        ),
        tenants!auth_tokens_tenant_id_fkey (
          id,
          name,
          domain,
          subscription_plan,
          is_active
        )
      `).eq('token_id', jwtPayload.jti) :
      supabase.from('auth_tokens').select(`
        *,
        profiles!auth_tokens_user_id_fkey (
          id,
          email,
          full_name,
          first_name,
          last_name,
          avatar_url,
          company,
          job_title,
          role,
          permissions,
          is_active,
          last_login_at
        ),
        tenants!auth_tokens_tenant_id_fkey (
          id,
          name,
          domain,
          subscription_plan,
          is_active
        )
      `).eq('token_id', token)

    const { data: authToken, error: tokenError } = await tokenQuery
      .eq('is_revoked', false)
      .single()

    if (tokenError || !authToken) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 检查token是否过期
    if (new Date(authToken.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Token has expired' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 检查用户是否激活
    if (!authToken.profiles?.is_active) {
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
      .eq('user_id', authToken.user_id)
      .eq('is_active', true)

    // 更新最后使用时间
    await supabase
      .from('auth_tokens')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', authToken.id)

    console.log('User info retrieved successfully for user:', authToken.user_id)

    return new Response(
      JSON.stringify({
        user: {
          id: authToken.profiles.id,
          email: authToken.profiles.email,
          full_name: authToken.profiles.full_name,
          first_name: authToken.profiles.first_name,
          last_name: authToken.profiles.last_name,
          avatar_url: authToken.profiles.avatar_url,
          company: authToken.profiles.company,
          job_title: authToken.profiles.job_title,
          role: authToken.profiles.role,
          permissions: authToken.profiles.permissions,
          last_login_at: authToken.profiles.last_login_at
        },
        tenant: authToken.tenants ? {
          id: authToken.tenants.id,
          name: authToken.tenants.name,
          domain: authToken.tenants.domain,
          subscription_plan: authToken.tenants.subscription_plan
        } : null,
        tenant_roles: tenantRoles?.map(tr => ({
          tenant_id: tr.tenants?.id,
          tenant_name: tr.tenants?.name,
          role: tr.role,
          joined_at: tr.joined_at
        })) || [],
        session: {
          issued_at: authToken.created_at,
          expires_at: authToken.expires_at,
          device_name: authToken.device_name,
          last_used_at: authToken.last_used_at
        },
        jwt_claims: jwtPayload || null
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
