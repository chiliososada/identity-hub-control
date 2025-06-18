
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface RevokeRequest {
  token?: string
  all_tokens?: boolean
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

    // 从Authorization header获取当前token
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const currentToken = authHeader.substring(7)
    const body: RevokeRequest = await req.json()

    console.log('Revoking token(s) for user...')

    // 验证当前token
    const { data: authToken, error: tokenError } = await supabase
      .from('auth_tokens')
      .select('user_id, is_revoked')
      .eq('token_id', currentToken)
      .single()

    if (tokenError || !authToken || authToken.is_revoked) {
      return new Response(
        JSON.stringify({ error: 'Invalid or revoked token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = authToken.user_id
    let revokedCount = 0

    if (body.all_tokens) {
      // 撤销用户的所有token
      const { error: revokeError, count } = await supabase
        .from('auth_tokens')
        .update({
          is_revoked: true,
          revoked_at: new Date().toISOString(),
          revoked_reason: 'User requested revocation of all tokens'
        })
        .eq('user_id', userId)
        .eq('is_revoked', false)

      if (revokeError) {
        console.error('Error revoking all tokens:', revokeError)
        return new Response(
          JSON.stringify({ error: 'Failed to revoke tokens' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      revokedCount = count || 0
      console.log(`Revoked all ${revokedCount} tokens for user:`, userId)

    } else {
      // 撤销指定的token，如果没有指定则撤销当前token
      const tokenToRevoke = body.token || currentToken

      const { error: revokeError } = await supabase
        .from('auth_tokens')
        .update({
          is_revoked: true,
          revoked_at: new Date().toISOString(),
          revoked_reason: 'User requested token revocation'
        })
        .eq('token_id', tokenToRevoke)
        .eq('user_id', userId)
        .eq('is_revoked', false)

      if (revokeError) {
        console.error('Error revoking token:', revokeError)
        return new Response(
          JSON.stringify({ error: 'Failed to revoke token' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      revokedCount = 1
      console.log('Revoked token for user:', userId)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully revoked ${revokedCount} token(s)`,
        revoked_count: revokedCount
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Token revocation error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
