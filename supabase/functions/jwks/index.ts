
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
    
    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Fetching JWKS...')

    // 获取所有活跃的JWT密钥
    const { data: jwtKeys, error: keysError } = await supabase
      .from('jwt_keys')
      .select('key_id, algorithm, public_key, key_name')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (keysError) {
      console.error('Error fetching JWT keys:', keysError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch keys' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 转换为JWKS格式
    const jwks = {
      keys: jwtKeys.map(key => ({
        kty: "RSA", // 密钥类型
        kid: key.key_id, // 密钥ID
        use: "sig", // 用途：签名
        alg: key.algorithm, // 算法
        // 这里应该从公钥中提取n和e参数，现在使用模拟数据
        n: "4f5wg5l2hKsTeNem_V41fGnJm6gOdrj8ym3rFkEjWT2btf06nmZpjgp2Q8y-8t3l-bJgK2I9FbZN9ZqHE5y1mKNKr8-HKsTeNem_V41fGnJm6gOdrj8ym3rFkEjWT2btf06nmZpjgp2Q8y-8t3l",
        e: "AQAB"
      }))
    }

    console.log(`Returning ${jwks.keys.length} active keys`)

    return new Response(
      JSON.stringify(jwks),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600' // 缓存1小时
        } 
      }
    )

  } catch (error) {
    console.error('JWKS error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
