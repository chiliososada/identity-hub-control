
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { generateJWT, generateSecureToken, getClientIP } from '../_shared/jwt-utils.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface LoginRequest {
  email: string
  password: string
  tenant_id?: string
  device_name?: string
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

    const { email, password, tenant_id, device_name }: LoginRequest = await req.json()
    const clientIP = getClientIP(req)
    const userAgent = req.headers.get('user-agent') || 'Unknown'

    if (!email || !password) {
      // 记录失败尝试
      await supabase.from('auth_attempts').insert({
        email,
        ip_address: clientIP,
        user_agent: userAgent,
        success: false,
        failure_reason: 'Missing email or password'
      })

      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Login attempt for:', email)

    // 查找用户
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single()

    if (profileError || !profile) {
      // 记录失败尝试
      await supabase.from('auth_attempts').insert({
        email,
        ip_address: clientIP,
        user_agent: userAgent,
        success: false,
        failure_reason: 'User not found or inactive'
      })

      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 检查账户是否被锁定
    if (profile.locked_until && new Date(profile.locked_until) > new Date()) {
      await supabase.from('auth_attempts').insert({
        email,
        ip_address: clientIP,
        user_agent: userAgent,
        success: false,
        failure_reason: 'Account locked'
      })

      return new Response(
        JSON.stringify({ error: 'Account is temporarily locked due to too many failed attempts' }),
        { status: 423, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 验证密码
    if (!profile.password_hash) {
      await supabase.from('auth_attempts').insert({
        email,
        ip_address: clientIP,
        user_agent: userAgent,
        success: false,
        failure_reason: 'No password set'
      })

      return new Response(
        JSON.stringify({ error: 'Password not set for this account' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 使用数据库函数验证密码
    const { data: passwordValid, error: passwordError } = await supabase
      .rpc('verify_password', {
        password: password,
        stored_hash: profile.password_hash
      })

    if (passwordError || !passwordValid) {
      // 增加失败尝试次数
      const newAttempts = (profile.login_attempts || 0) + 1
      const lockUntil = newAttempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null // 5次失败锁定30分钟

      await supabase
        .from('profiles')
        .update({
          login_attempts: newAttempts,
          locked_until: lockUntil?.toISOString()
        })
        .eq('id', profile.id)

      await supabase.from('auth_attempts').insert({
        email,
        ip_address: clientIP,
        user_agent: userAgent,
        success: false,
        failure_reason: 'Invalid password'
      })

      return new Response(
        JSON.stringify({ 
          error: 'Invalid credentials',
          attempts_remaining: Math.max(0, 5 - newAttempts)
        }),
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

    // 生成真正的 JWT Token
    const now = Math.floor(Date.now() / 1000)
    const expiresIn = 8 * 60 * 60 // 8小时
    const tokenId = generateSecureToken(32)
    
    const jwtPayload = {
      iss: supabaseUrl,
      sub: profile.id,
      aud: 'authenticated',
      exp: now + expiresIn,
      iat: now,
      jti: tokenId,
      email: profile.email,
      role: profile.role,
      tenant_id: tenant_id || profile.tenant_id
    }

    const accessToken = await generateJWT(
      jwtPayload,
      jwtKey.private_key,
      jwtKey.key_id,
      jwtKey.algorithm
    )
    
    // 保存token记录到数据库
    const { data: authToken, error: tokenError } = await supabase
      .from('auth_tokens')
      .insert({
        token_id: tokenId,
        user_id: profile.id,
        tenant_id: tenant_id || profile.tenant_id,
        token_type: 'access_token',
        expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
        device_name: device_name || 'Unknown Device',
        ip_address: clientIP,
        user_agent: userAgent
      })
      .select()
      .single()

    if (tokenError) {
      console.error('Error creating auth token:', tokenError)
      return new Response(
        JSON.stringify({ error: 'Failed to create authentication token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 更新用户登录信息
    await supabase
      .from('profiles')
      .update({ 
        login_attempts: 0,
        locked_until: null,
        last_login_at: new Date().toISOString(),
        last_ip_address: clientIP
      })
      .eq('id', profile.id)

    // 更新JWT密钥使用次数
    await supabase
      .from('jwt_keys')
      .update({ 
        usage_count: jwtKey.usage_count + 1,
        last_used_at: new Date().toISOString()
      })
      .eq('id', jwtKey.id)

    // 记录成功登录
    await supabase.from('auth_attempts').insert({
      email,
      ip_address: clientIP,
      user_agent: userAgent,
      success: true
    })

    console.log('Login successful for user:', profile.id)

    return new Response(
      JSON.stringify({
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: expiresIn,
        expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
        user: {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          role: profile.role
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Login error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
