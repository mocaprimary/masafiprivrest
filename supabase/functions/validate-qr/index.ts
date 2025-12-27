import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ValidateQRRequest {
  qrCode?: string
  reservationNumber?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    
    // Get authorization header for user authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create client with user's token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body: ValidateQRRequest = await req.json()

    if (!body.qrCode && !body.reservationNumber) {
      return new Response(
        JSON.stringify({ error: 'QR code or reservation number required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Call the secure database function for QR validation
    const { data: result, error } = await supabase.rpc('validate_and_use_qr', {
      p_qr_code: body.qrCode || null,
      p_reservation_number: body.reservationNumber || null
    })

    if (error) {
      console.error('QR validation error:', error)
      return new Response(
        JSON.stringify({ error: error.message || 'QR validation failed' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!result.success) {
      console.log('QR validation failed:', result.error)
      return new Response(
        JSON.stringify({ 
          error: result.error,
          used_at: result.used_at,
          expired_at: result.expired_at
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('QR validated and check-in successful:', result.reservation.reservation_number)

    return new Response(
      JSON.stringify({
        success: true,
        reservation: result.reservation
      }),
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
