
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

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

    console.log('Refreshing token:', token.substring(0, 20) + '...')

    // 查找现有token
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
        )
      `)
      .eq('token_id', token)
      .single()

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

    // 检查用户是否激活
    if (!authToken.profiles?.is_active) {
      return new Response(
        JSON.stringify({ error: 'User account is inactive' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 生成新的access token
    const newTokenId = `token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000) // 8小时后过期

    // 创建新的token记录
    const { data: newAuthToken, error: newTokenError } = await supabase
      .from('auth_tokens')
      .insert({
        token_id: newTokenId,
        user_id: authToken.user_id,
        tenant_id: authToken.tenant_id,
        token_type: 'access_token',
        expires_at: expiresAt.toISOString(),
        device_name: authToken.device_name,
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        user_agent: req.headers.get('user-agent')
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

    console.log('Token refresh successful for user:', authToken.user_id)

    return new Response(
      JSON.stringify({
        access_token: newTokenId,
        token_type: 'Bearer',
        expires_in: 8 * 3600, // 8小时
        expires_at: expiresAt.toISOString(),
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
