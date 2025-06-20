
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // 验证请求方法
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 验证用户是否已认证
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header missing' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 解析请求体
    const requestBody = await req.json()
    const { email, full_name, first_name, last_name, role, company, job_title, is_active, is_company_admin, is_test_account } = requestBody

    console.log('Creating user with data:', requestBody)

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'メールアドレスが必要です' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 使用 Admin API 创建用户
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name: full_name || null,
        first_name: first_name || null,
        last_name: last_name || null,
      }
    })

    if (authError) {
      console.error('Auth user creation error:', authError)
      return new Response(
        JSON.stringify({ error: `認証ユーザーの作成に失敗しました: ${authError.message}` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!authUser.user) {
      return new Response(
        JSON.stringify({ error: '認証ユーザーの作成に失敗しました' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Auth user created successfully:', authUser.user.id)

    // 等待触发器创建 profile 记录
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 更新 profile 记录的额外字段
    const updateData = {
      full_name: full_name || null,
      first_name: first_name || null,
      last_name: last_name || null,
      role: role || 'member',
      company: company || null,
      job_title: job_title || null,
      is_active: is_active ?? true,
      is_company_admin: is_company_admin ?? false,
      is_test_account: is_test_account ?? false,
    }

    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('auth_user_id', authUser.user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Profile update error:', updateError)
      // 不抛出错误，因为用户已经创建成功
      console.warn('プロフィールの更新に失敗しましたが、ユーザーは作成されました')
    }

    console.log('User creation completed:', updatedProfile || authUser.user)

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: updatedProfile || { ...authUser.user, ...updateData },
        message: 'ユーザーが正常に作成されました'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error in admin-create-user:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
