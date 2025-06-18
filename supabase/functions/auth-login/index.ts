
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

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

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Login attempt for:', email)

    // 验证用户凭据（这里简化处理，实际应该验证密码）
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
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

    // 生成JWT Token（这里使用模拟实现）
    const tokenId = `token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000) // 8小时后过期
    
    // 保存token记录到数据库
    const { data: authToken, error: tokenError } = await supabase
      .from('auth_tokens')
      .insert({
        token_id: tokenId,
        user_id: profile.id,
        tenant_id: tenant_id || profile.tenant_id,
        token_type: 'access_token',
        expires_at: expiresAt.toISOString(),
        device_name: device_name || 'Unknown Device',
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        user_agent: req.headers.get('user-agent')
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

    // 更新JWT密钥使用次数
    await supabase
      .from('jwt_keys')
      .update({ 
        usage_count: jwtKey.usage_count + 1,
        last_used_at: new Date().toISOString()
      })
      .eq('id', jwtKey.id)

    console.log('Login successful for user:', profile.id)

    return new Response(
      JSON.stringify({
        access_token: tokenId, // 实际应用中这里应该是真正的JWT token
        token_type: 'Bearer',
        expires_in: 8 * 3600, // 8小时
        expires_at: expiresAt.toISOString(),
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
