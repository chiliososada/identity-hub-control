
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { generateJWT, verifyJWT, generateSecureToken, getClientIP } from '../_shared/jwt-utils.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface RefreshRequest {
  refresh_token?: string
}

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

    // 从Authorization header或body获取token
    let token = ''
    const authHeader = req.headers.get('authorization')
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else {
      const body: RefreshRequest = await req.json()
      token = body.refresh_token || ''
    }

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Missing refresh token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const clientIP = getClientIP(req)
    const userAgent = req.headers.get('user-agent') || 'Unknown'

    console.log('Refreshing token:', token.substring(0, 20) + '...')

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
          role,
          is_active
        )
      `).eq('token_id', jwtPayload.jti) :
      supabase.from('auth_tokens').select(`
        *,
        profiles!auth_tokens_user_id_fkey (
          id,
          email,
          full_name,
          role,
          is_active
        )
      `).eq('token_id', token)

    const { data: authToken, error: tokenError } = await tokenQuery.single()

    if (tokenError || !authToken) {
      return new Response(
        JSON.stringify({ error: 'Invalid refresh token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 检查token是否已撤销
    if (authToken.is_revoked) {
      return new Response(
        JSON.stringify({ error: 'Refresh token has been revoked' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 检查token是否过期（允许一定的宽限期用于刷新）
    const tokenExpiry = new Date(authToken.expires_at)
    const now = new Date()
    const gracePeriod = 7 * 24 * 60 * 60 * 1000 // 7天宽限期
    
    if (tokenExpiry.getTime() + gracePeriod < now.getTime()) {
      return new Response(
        JSON.stringify({ error: 'Refresh token has expired beyond grace period' }),
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

    // 获取活跃的JWT密钥
    const { data: jwtKey, error: keyError } = await supabase
      .from('jwt_keys')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (keyError || !jwtKey) {
      console.error('No active JWT key found:', keyError)
      return new Response(
        JSON.stringify({ error: 'Authentication service unavailable' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 生成新的 JWT Token
    const now_unix = Math.floor(Date.now() / 1000)
    const expiresIn = 8 * 60 * 60 // 8小时
    const newTokenId = generateSecureToken(32)
    
    const newJwtPayload = {
      iss: supabaseUrl,
      sub: authToken.user_id,
      aud: 'authenticated',
      exp: now_unix + expiresIn,
      iat: now_unix,
      jti: newTokenId,
      email: authToken.profiles.email,
      role: authToken.profiles.role,
      tenant_id: authToken.tenant_id
    }

    const newAccessToken = await generateJWT(
      newJwtPayload,
      jwtKey.private_key,
      jwtKey.key_id,
      jwtKey.algorithm
    )

    // 创建新的token记录
    const { data: newAuthToken, error: newTokenError } = await supabase
      .from('auth_tokens')
      .insert({
        token_id: newTokenId,
        user_id: authToken.user_id,
        tenant_id: authToken.tenant_id,
        token_type: 'access_token',
        expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
        device_name: authToken.device_name,
        ip_address: clientIP,
        user_agent: userAgent
      })
      .select()
      .single()

    if (newTokenError) {
      console.error('Error creating new auth token:', newTokenError)
      return new Response(
        JSON.stringify({ error: 'Failed to refresh token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 可选：撤销旧的token（根据安全策略决定）
    // await supabase
    //   .from('auth_tokens')
    //   .update({ 
    //     is_revoked: true, 
    //     revoked_at: new Date().toISOString(),
    //     revoked_reason: 'Token refreshed'
    //   })
    //   .eq('id', authToken.id)

    // 更新JWT密钥使用次数
    await supabase
      .from('jwt_keys')
      .update({ 
        usage_count: jwtKey.usage_count + 1,
        last_used_at: new Date().toISOString()
      })
      .eq('id', jwtKey.id)

    console.log('Token refresh successful for user:', authToken.user_id)

    return new Response(
      JSON.stringify({
        access_token: newAccessToken,
        token_type: 'Bearer',
        expires_in: expiresIn,
        expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
        user: {
          id: authToken.profiles.id,
          email: authToken.profiles.email,
          full_name: authToken.profiles.full_name,
          role: authToken.profiles.role
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Token refresh error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
