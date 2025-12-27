import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AdminActionRequest {
  action: string
  entityType: string
  entityId?: string
  data?: Record<string, unknown>
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Get the authorization header to verify the user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create client with user's token to verify auth
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    })

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) {
      console.log('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Use service role to check user roles (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify user has staff or admin role
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    if (rolesError) {
      console.error('Error fetching roles:', rolesError)
      return new Response(
        JSON.stringify({ error: 'Failed to verify permissions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userRoles = roles?.map(r => r.role) || []
    const isStaff = userRoles.includes('staff') || userRoles.includes('admin')
    const isAdmin = userRoles.includes('admin')

    if (!isStaff) {
      console.log('User not staff:', user.id)
      return new Response(
        JSON.stringify({ error: 'Forbidden: Staff access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body: AdminActionRequest = await req.json()

    // Validate action
    const allowedActions = [
      'update_reservation_status',
      'update_deposit_status',
      'update_order_status',
      'refund_deposit',
      'forfeit_deposit',
      'assign_role',
      'remove_role'
    ]

    if (!allowedActions.includes(body.action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Admin-only actions
    const adminOnlyActions = ['assign_role', 'remove_role', 'forfeit_deposit']
    if (adminOnlyActions.includes(body.action) && !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let result: unknown = null

    switch (body.action) {
      case 'update_reservation_status': {
        const { error } = await supabase
          .from('reservations')
          .update({
            status: body.data?.status,
            ...(body.data?.status === 'arrived' ? {
              checked_in_at: new Date().toISOString(),
              checked_in_by: user.id
            } : {})
          })
          .eq('id', body.entityId)

        if (error) throw error
        result = { success: true }
        break
      }

      case 'update_deposit_status': {
        const { error } = await supabase
          .from('reservations')
          .update({ deposit_status: body.data?.status })
          .eq('id', body.entityId)

        if (error) throw error
        result = { success: true }
        break
      }

      case 'update_order_status': {
        const { error } = await supabase
          .from('orders')
          .update({ status: body.data?.status })
          .eq('id', body.entityId)

        if (error) throw error
        result = { success: true }
        break
      }

      case 'refund_deposit': {
        const { error } = await supabase
          .from('reservations')
          .update({ deposit_status: 'refunded' })
          .eq('id', body.entityId)

        if (error) throw error
        result = { success: true, message: 'Deposit refunded' }
        break
      }

      case 'forfeit_deposit': {
        const { error } = await supabase
          .from('reservations')
          .update({ deposit_status: 'forfeited' })
          .eq('id', body.entityId)

        if (error) throw error
        result = { success: true, message: 'Deposit forfeited' }
        break
      }

      case 'assign_role': {
        const { error } = await supabase
          .from('user_roles')
          .insert({
            user_id: body.entityId,
            role: body.data?.role
          })

        if (error) {
          if (error.code === '23505') {
            return new Response(
              JSON.stringify({ error: 'User already has this role' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
          throw error
        }
        result = { success: true }
        break
      }

      case 'remove_role': {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', body.entityId)
          .eq('role', body.data?.role)

        if (error) throw error
        result = { success: true }
        break
      }
    }

    // Log the admin action
    await supabase.from('audit_logs').insert({
      action: body.action,
      entity_type: body.entityType,
      entity_id: body.entityId,
      user_id: user.id,
      details: body.data || {}
    })

    console.log(`Admin action logged: ${body.action} by ${user.id}`)

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Server error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})