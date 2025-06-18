
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
    
    if (req.method !== 'POST') {
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

    const token = authHeader.substring(7) // 移除 "Bearer " 前缀
    console.log('Verifying token:', token.substring(0, 20) + '...')

    // 查找token记录
    const { data: authToken, error: tokenError } = await supabase
      .from('auth_tokens')
      .select(`
        *,
        profiles!auth_tokens_user_id_fkey (
          id,
          email,
          full_name,
          role,
          is_active
        ),
        tenants!auth_tokens_tenant_id_fkey (
          id,
          name,
          is_active
        )
      `)
      .eq('token_id', token)
      .single()

    if (tokenError || !authToken) {
      console.log('Token not found:', tokenError)
      return new Response(
        JSON.stringify({ error: 'Invalid token', valid: false }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 检查token是否已撤销
    if (authToken.is_revoked) {
      return new Response(
        JSON.stringify({ error: 'Token has been revoked', valid: false }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 检查token是否过期
    if (new Date(authToken.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Token has expired', valid: false }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 检查用户是否激活
    if (!authToken.profiles?.is_active) {
      return new Response(
        JSON.stringify({ error: 'User account is inactive', valid: false }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 更新最后使用时间
    await supabase
      .from('auth_tokens')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', authToken.id)

    console.log('Token verification successful for user:', authToken.user_id)

    return new Response(
      JSON.stringify({
        valid: true,
        user: {
          id: authToken.profiles.id,
          email: authToken.profiles.email,
          full_name: authToken.profiles.full_name,
          role: authToken.profiles.role
        },
        tenant: authToken.tenants ? {
          id: authToken.tenants.id,
          name: authToken.tenants.name
        } : null,
        token_info: {
          issued_at: authToken.created_at,
          expires_at: authToken.expires_at,
          device_name: authToken.device_name
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Token verification error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', valid: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
