import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ReservationRequest {
  fullName: string
  phone: string
  email?: string
  guests: number
  date: string
  time: string
  specialRequests?: string
  depositAmount?: number
}

// UAE phone validation regex
const UAE_PHONE_REGEX = /^(\+971|00971|971)?[\s-]?(5[0-9])[\s-]?([0-9]{3})[\s-]?([0-9]{4})$/
const INTL_PHONE_REGEX = /^\+?[0-9\s\-]{8,15}$/

// Email validation regex
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

// Validation constants
const MIN_GUESTS = 1
const MAX_GUESTS = 20
const MIN_NAME_LENGTH = 2
const MAX_NAME_LENGTH = 100
const MAX_REQUESTS_LENGTH = 500

function validateReservation(data: ReservationRequest): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Validate name
  if (!data.fullName || data.fullName.trim() === '') {
    errors.push('Name is required')
  } else if (data.fullName.trim().length < MIN_NAME_LENGTH) {
    errors.push(`Name must be at least ${MIN_NAME_LENGTH} characters`)
  } else if (data.fullName.trim().length > MAX_NAME_LENGTH) {
    errors.push(`Name must be less than ${MAX_NAME_LENGTH} characters`)
  }

  // Validate phone
  if (!data.phone || data.phone.trim() === '') {
    errors.push('Phone number is required')
  } else if (!UAE_PHONE_REGEX.test(data.phone) && !INTL_PHONE_REGEX.test(data.phone)) {
    errors.push('Invalid phone number format')
  }

  // Validate email if provided
  if (data.email && data.email.trim() !== '') {
    if (!EMAIL_REGEX.test(data.email)) {
      errors.push('Invalid email format')
    }
  }

  // Validate guests
  if (!data.guests || typeof data.guests !== 'number') {
    errors.push('Number of guests is required')
  } else if (data.guests < MIN_GUESTS || data.guests > MAX_GUESTS) {
    errors.push(`Guest count must be between ${MIN_GUESTS} and ${MAX_GUESTS}`)
  }

  // Validate date
  if (!data.date) {
    errors.push('Reservation date is required')
  }

  // Validate time
  if (!data.time) {
    errors.push('Reservation time is required')
  }

  // Validate date/time is in the future (UAE timezone)
  if (data.date && data.time) {
    const dubaiNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Dubai' }))
    const reservationDateTime = new Date(`${data.date}T${data.time}:00`)
    
    if (reservationDateTime <= dubaiNow) {
      errors.push('Reservation must be in the future')
    }
  }

  // Validate special requests length
  if (data.specialRequests && data.specialRequests.length > MAX_REQUESTS_LENGTH) {
    errors.push(`Special requests must be less than ${MAX_REQUESTS_LENGTH} characters`)
  }

  return { valid: errors.length === 0, errors }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Use service role key for secure reservation creation
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body: ReservationRequest = await req.json()

    // Server-side validation (edge function level)
    const validation = validateReservation(body)
    if (!validation.valid) {
      console.log('Edge validation failed:', validation.errors)
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: validation.errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Call the secure database function for reservation creation
    const { data: result, error } = await supabase.rpc('create_reservation_secure', {
      p_full_name: body.fullName.trim().slice(0, MAX_NAME_LENGTH),
      p_phone: body.phone.trim().replace(/[^\d+\-\s]/g, ''),
      p_email: body.email?.trim().toLowerCase() || null,
      p_guests: Math.min(Math.max(body.guests, MIN_GUESTS), MAX_GUESTS),
      p_reservation_date: body.date,
      p_reservation_time: body.time,
      p_special_requests: body.specialRequests?.trim().slice(0, MAX_REQUESTS_LENGTH) || null
    })

    if (error) {
      console.error('Database function error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to create reservation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if the database function returned an error
    if (!result.success) {
      console.log('Reservation creation failed:', result.errors)
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: result.errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Reservation created securely:', result.reservation.reservation_number)

    return new Response(
      JSON.stringify({
        success: true,
        reservation: {
          id: result.reservation.id,
          reservationNumber: result.reservation.reservation_number,
          depositAmount: result.reservation.deposit_amount
        }
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Server error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
