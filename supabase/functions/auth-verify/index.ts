
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
    console.log('Verifying JWT token...')

    // 首先尝试作为 JWT 验证
    let jwtPayload = null
    let tokenRecord = null

    // 获取所有活跃的 JWT 密钥来验证 token
    const { data: jwtKeys, error: keysError } = await supabase
      .from('jwt_keys')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (keysError || !jwtKeys || jwtKeys.length === 0) {
      console.log('No active JWT keys found')
      return new Response(
        JSON.stringify({ error: 'Authentication service unavailable', valid: false }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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

    // 如果 JWT 验证失败，尝试作为简单 token 查找
    if (!jwtPayload) {
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
        console.log('Token not found in database:', tokenError)
        return new Response(
          JSON.stringify({ error: 'Invalid token', valid: false }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      tokenRecord = authToken
    } else {
      // 对于 JWT token，通过 jti 查找数据库记录
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
        .eq('token_id', jwtPayload.jti)
        .single()

      if (tokenError || !authToken) {
        console.log('JWT token record not found in database')
        return new Response(
          JSON.stringify({ error: 'Token record not found', valid: false }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      tokenRecord = authToken
    }

    // 检查token是否已撤销
    if (tokenRecord.is_revoked) {
      return new Response(
        JSON.stringify({ error: 'Token has been revoked', valid: false }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 检查token是否过期
    if (new Date(tokenRecord.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Token has expired', valid: false }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 检查用户是否激活
    if (!tokenRecord.profiles?.is_active) {
      return new Response(
        JSON.stringify({ error: 'User account is inactive', valid: false }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 更新最后使用时间
    await supabase
      .from('auth_tokens')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', tokenRecord.id)

    console.log('Token verification successful for user:', tokenRecord.user_id)

    return new Response(
      JSON.stringify({
        valid: true,
        token_type: jwtPayload ? 'jwt' : 'simple',
        user: {
          id: tokenRecord.profiles.id,
          email: tokenRecord.profiles.email,
          full_name: tokenRecord.profiles.full_name,
          role: tokenRecord.profiles.role
        },
        tenant: tokenRecord.tenants ? {
          id: tokenRecord.tenants.id,
          name: tokenRecord.tenants.name
        } : null,
        token_info: {
          issued_at: tokenRecord.created_at,
          expires_at: tokenRecord.expires_at,
          device_name: tokenRecord.device_name
        },
        jwt_claims: jwtPayload || null
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
