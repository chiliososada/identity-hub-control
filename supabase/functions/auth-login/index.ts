
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

    // 使用 Supabase Auth 进行身份验证
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError || !authData.user) {
      console.error('Auth login failed:', authError)
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 获取用户档案信息
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_user_id', authData.user.id)
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

    // 更新最后登录时间
    await supabase
      .from('profiles')
      .update({ 
        last_login_at: new Date().toISOString()
      })
      .eq('id', profile.id)

    // 记录审计日志
    await supabase.from('audit_logs').insert({
      user_id: profile.id,
      action_type: 'login',
      details: {
        device_name: device_name || 'Unknown Device',
        tenant_id: tenant_id || profile.tenant_id
      },
      success: true
    })

    console.log('Login successful for user:', profile.id)

    // 返回兼容的响应格式
    return new Response(
      JSON.stringify({
        access_token: authData.session?.access_token,
        token_type: 'Bearer',
        expires_in: authData.session?.expires_in,
        expires_at: new Date(authData.session?.expires_at! * 1000).toISOString(),
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
