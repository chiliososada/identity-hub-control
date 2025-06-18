
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { verifyJWT, getClientIP } from '../_shared/jwt-utils.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface RevokeRequest {
  token?: string
  all_tokens?: boolean
  reason?: string
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
    const clientIP = getClientIP(req)
    const userAgent = req.headers.get('user-agent') || 'Unknown'

    console.log('Revoking token(s) for user...')

    // 首先尝试作为 JWT 验证当前token
    let currentUserId = null
    let currentTokenRecord = null

    // 获取所有活跃的 JWT 密钥来验证当前 token
    const { data: jwtKeys, error: keysError } = await supabase
      .from('jwt_keys')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (!keysError && jwtKeys && jwtKeys.length > 0) {
      // 尝试用每个密钥验证 JWT
      for (const key of jwtKeys) {
        try {
          const verificationResult = await verifyJWT(currentToken, key.public_key, key.algorithm)
          if (verificationResult.valid && verificationResult.payload) {
            // 通过 JWT payload 中的 jti 查找数据库记录
            const { data: tokenRecord, error: tokenError } = await supabase
              .from('auth_tokens')
              .select('user_id, is_revoked')
              .eq('token_id', verificationResult.payload.jti)
              .single()

            if (!tokenError && tokenRecord) {
              currentUserId = tokenRecord.user_id
              currentTokenRecord = tokenRecord
              break
            }
          }
        } catch (error) {
          console.log(`Failed to verify with key ${key.key_id}:`, error.message)
          continue
        }
      }
    }

    // 如果 JWT 验证失败，尝试直接查找token
    if (!currentUserId) {
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

      currentUserId = authToken.user_id
      currentTokenRecord = authToken
    }

    if (currentTokenRecord?.is_revoked) {
      return new Response(
        JSON.stringify({ error: 'Current token is already revoked' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let revokedCount = 0
    const revokeReason = body.reason || 'User requested token revocation'

    if (body.all_tokens) {
      // 撤销用户的所有token
      const { error: revokeError, count } = await supabase
        .from('auth_tokens')
        .update({
          is_revoked: true,
          revoked_at: new Date().toISOString(),
          revoked_reason: revokeReason
        })
        .eq('user_id', currentUserId)
        .eq('is_revoked', false)

      if (revokeError) {
        console.error('Error revoking all tokens:', revokeError)
        return new Response(
          JSON.stringify({ error: 'Failed to revoke tokens' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      revokedCount = count || 0
      console.log(`Revoked all ${revokedCount} tokens for user:`, currentUserId)

    } else {
      // 撤销指定的token，如果没有指定则撤销当前token
      const tokenToRevoke = body.token || currentToken

      // 如果指定的token是JWT，需要提取jti
      let actualTokenId = tokenToRevoke
      if (body.token && jwtKeys && jwtKeys.length > 0) {
        for (const key of jwtKeys) {
          try {
            const verificationResult = await verifyJWT(body.token, key.public_key, key.algorithm)
            if (verificationResult.valid && verificationResult.payload) {
              actualTokenId = verificationResult.payload.jti
              break
            }
          } catch (error) {
            continue
          }
        }
      }

      const { error: revokeError } = await supabase
        .from('auth_tokens')
        .update({
          is_revoked: true,
          revoked_at: new Date().toISOString(),
          revoked_reason: revokeReason
        })
        .eq('token_id', actualTokenId)
        .eq('user_id', currentUserId)
        .eq('is_revoked', false)

      if (revokeError) {
        console.error('Error revoking token:', revokeError)
        return new Response(
          JSON.stringify({ error: 'Failed to revoke token' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      revokedCount = 1
      console.log('Revoked token for user:', currentUserId)
    }

    // 记录撤销操作到审计日志
    await supabase.from('audit_logs').insert({
      user_id: currentUserId,
      action_type: 'token_revocation',
      resource_type: 'auth_token',
      ip_address: clientIP,
      user_agent: userAgent,
      success: true,
      details: {
        revoked_count: revokedCount,
        revoke_all: body.all_tokens || false,
        reason: revokeReason
      }
    })

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
