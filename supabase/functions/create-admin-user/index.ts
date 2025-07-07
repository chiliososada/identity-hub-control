
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
    // Create Supabase admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Create the admin user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: 'admin@system.com',
      password: 'admin123',
      email_confirm: true,
      user_metadata: {
        full_name: '系统管理员'
      }
    })

    if (authError) {
      console.error('Auth user creation error:', authError)
      return new Response(
        JSON.stringify({ error: 'Failed to create auth user: ' + authError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update the profile with admin role
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        role: 'admin',
        full_name: '系统管理员',
        first_name: '系统',
        last_name: '管理员',
        is_active: true
      })
      .eq('auth_user_id', authData.user.id)

    if (profileError) {
      console.error('Profile update error:', profileError)
      return new Response(
        JSON.stringify({ error: 'Failed to update profile: ' + profileError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Admin user created successfully:', authData.user.email)

    return new Response(
      JSON.stringify({ 
        message: 'Admin user created successfully',
        email: 'admin@system.com',
        password: 'admin123',
        user_id: authData.user.id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Create admin user error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
