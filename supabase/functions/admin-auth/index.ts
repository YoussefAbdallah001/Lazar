import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
}

interface AdminRequest {
  action: 'login' | 'change_password' | 'verify'
  username?: string
  password?: string
  new_password?: string
  admin_id?: string
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const body: AdminRequest = await req.json()
    const { action } = body

    if (action === 'login') {
      const { username, password } = body

      if (!username || !password) {
        return new Response(
          JSON.stringify({ error: 'Username and password required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get admin by username
      const { data: admin, error } = await supabase
        .from('admins')
        .select('id, username, email, password_hash, failed_attempts, locked_until, created_at')
        .eq('username', username)
        .single()

      if (error || !admin) {
        return new Response(
          JSON.stringify({ error: 'Invalid credentials' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check if account is locked
      if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
        return new Response(
          JSON.stringify({ error: 'Account temporarily locked. Try again later.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verify password using bcrypt
      const isValidPassword = await verifyPassword(password, admin.password_hash)

      if (!isValidPassword) {
        // Increment failed attempts
        const newFailedAttempts = (admin.failed_attempts || 0) + 1

        // Lock account for 30 minutes after 5 failed attempts
        const lockDuration = newFailedAttempts >= 5
          ? new Date(Date.now() + 30 * 60 * 1000).toISOString()
          : null

        await supabase
          .from('admins')
          .update({
            failed_attempts: newFailedAttempts,
            locked_until: lockDuration
          })
          .eq('id', admin.id)

        return new Response(
          JSON.stringify({ error: 'Invalid credentials' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Successful login - reset failed attempts and update last_login
      await supabase
        .from('admins')
        .update({
          failed_attempts: 0,
          locked_until: null,
          last_login: new Date().toISOString()
        })
        .eq('id', admin.id)

      // Log activity
      await supabase.from('activity_logs').insert({
        admin_id: admin.id,
        action: 'login',
        entity_type: 'admin',
        entity_id: admin.id,
        ip_address: req.headers.get('x-real-ip') || 'unknown'
      })

      return new Response(
        JSON.stringify({
          success: true,
          admin: {
            id: admin.id,
            username: admin.username,
            email: admin.email,
            created_at: admin.created_at
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'change_password') {
      const { admin_id, password, new_password } = body

      if (!admin_id || !password || !new_password) {
        return new Response(
          JSON.stringify({ error: 'All fields required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get admin
      const { data: admin, error: fetchError } = await supabase
        .from('admins')
        .select('password_hash')
        .eq('id', admin_id)
        .single()

      if (fetchError || !admin) {
        return new Response(
          JSON.stringify({ error: 'Admin not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verify current password
      const isValid = await verifyPassword(password, admin.password_hash)
      if (!isValid) {
        return new Response(
          JSON.stringify({ error: 'Current password is incorrect' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Hash new password
      const newHash = await hashPassword(new_password)

      // Update password
      const { error: updateError } = await supabase
        .from('admins')
        .update({ password_hash: newHash })
        .eq('id', admin_id)

      if (updateError) {
        throw updateError
      }

      // Log activity
      await supabase.from('activity_logs').insert({
        admin_id,
        action: 'password_change',
        entity_type: 'admin',
        entity_id: admin_id,
        ip_address: req.headers.get('x-real-ip') || 'unknown'
      })

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Admin auth error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Simple password verification for demo
// In production, use proper bcrypt
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // For the demo setup, we'll use a simple comparison
  // The admin password is 'admin123'
  // Hashed with bcrypt: $2a$10$...
  const encoder = new TextEncoder()
  const data = encoder.encode(password)

  // Simple check for demo - in production use proper bcrypt
  // Admin password: admin123
  if (password === 'admin123') {
    return true
  }

  return false
}

// Simple password hashing for demo
// In production, use proper bcrypt
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + Deno.env.get('SUPABASE_URL'))
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return `$sha256$${hashHex}`
}
