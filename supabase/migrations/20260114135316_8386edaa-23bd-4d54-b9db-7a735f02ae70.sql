-- Create table to track PIN verification attempts
CREATE TABLE public.pin_verification_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_number TEXT NOT NULL,
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  success BOOLEAN NOT NULL DEFAULT false,
  ip_address TEXT
);

-- Create index for efficient lookups
CREATE INDEX idx_pin_attempts_reservation_time 
  ON pin_verification_attempts(reservation_number, attempted_at DESC);

-- Enable RLS on the attempts table (only accessible via security definer functions)
ALTER TABLE public.pin_verification_attempts ENABLE ROW LEVEL SECURITY;

-- No direct RLS policies needed - table is only accessed via SECURITY DEFINER function

-- Drop and recreate the verify_guest_access function with rate limiting
CREATE OR REPLACE FUNCTION public.verify_guest_access(p_reservation_number text, p_pin text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_reservation RECORD;
  v_private RECORD;
  v_phone_last4 text;
  v_failed_attempts integer;
  v_last_attempt_at timestamp with time zone;
  v_lockout_until timestamp with time zone;
  v_max_attempts integer := 5;
  v_lockout_minutes integer := 60;
BEGIN
  -- Input validation
  IF p_reservation_number IS NULL OR trim(p_reservation_number) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reservation number is required');
  END IF;
  
  IF p_pin IS NULL OR length(p_pin) != 4 OR p_pin !~ '^\d{4}$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'PIN must be exactly 4 digits');
  END IF;

  -- Check for rate limiting: count failed attempts in the last hour
  SELECT 
    COUNT(*) FILTER (WHERE NOT success),
    MAX(attempted_at) FILTER (WHERE NOT success)
  INTO v_failed_attempts, v_last_attempt_at
  FROM pin_verification_attempts
  WHERE reservation_number = upper(trim(p_reservation_number))
    AND attempted_at > now() - INTERVAL '1 hour';

  -- If more than max attempts in the last hour, enforce lockout
  IF v_failed_attempts >= v_max_attempts THEN
    v_lockout_until := v_last_attempt_at + (v_lockout_minutes * INTERVAL '1 minute');
    IF now() < v_lockout_until THEN
      -- Log the blocked attempt
      INSERT INTO pin_verification_attempts (reservation_number, success)
      VALUES (upper(trim(p_reservation_number)), false);
      
      RETURN jsonb_build_object(
        'success', false, 
        'error', 'Too many failed attempts. Please try again in ' || 
                 GREATEST(1, EXTRACT(MINUTE FROM (v_lockout_until - now()))::integer) || 
                 ' minutes.',
        'locked_until', v_lockout_until
      );
    END IF;
  END IF;

  -- Find reservation by number
  SELECT * INTO v_reservation 
  FROM reservations 
  WHERE reservation_number = upper(trim(p_reservation_number));

  -- Check if reservation exists
  IF v_reservation IS NULL THEN
    -- Log failed attempt (don't reveal if reservation exists or not)
    INSERT INTO pin_verification_attempts (reservation_number, success)
    VALUES (upper(trim(p_reservation_number)), false);
    
    RETURN jsonb_build_object('success', false, 'error', 'Invalid credentials');
  END IF;

  -- Check if cancelled
  IF v_reservation.status = 'cancelled' THEN
    INSERT INTO pin_verification_attempts (reservation_number, success)
    VALUES (upper(trim(p_reservation_number)), false);
    
    RETURN jsonb_build_object('success', false, 'error', 'Reservation was cancelled');
  END IF;

  -- Get private details
  SELECT * INTO v_private 
  FROM reservation_private_details 
  WHERE reservation_id = v_reservation.id;

  -- Extract last 4 digits of phone
  v_phone_last4 := right(regexp_replace(v_private.phone, '[^0-9]', '', 'g'), 4);

  -- Verify PIN matches last 4 digits
  IF v_phone_last4 != p_pin THEN
    -- Log failed attempt
    INSERT INTO pin_verification_attempts (reservation_number, success)
    VALUES (upper(trim(p_reservation_number)), false);
    
    -- Calculate remaining attempts
    v_failed_attempts := v_failed_attempts + 1;
    
    IF v_failed_attempts >= v_max_attempts THEN
      RETURN jsonb_build_object(
        'success', false, 
        'error', 'Too many failed attempts. Please try again in ' || v_lockout_minutes || ' minutes.'
      );
    ELSE
      RETURN jsonb_build_object(
        'success', false, 
        'error', 'Invalid credentials',
        'attempts_remaining', v_max_attempts - v_failed_attempts
      );
    END IF;
  END IF;

  -- Success! Log successful attempt and clear failed attempts
  INSERT INTO pin_verification_attempts (reservation_number, success)
  VALUES (upper(trim(p_reservation_number)), true);
  
  -- Delete old failed attempts for this reservation (cleanup)
  DELETE FROM pin_verification_attempts 
  WHERE reservation_number = upper(trim(p_reservation_number))
    AND NOT success
    AND attempted_at < now() - INTERVAL '1 hour';

  -- Return success with reservation details
  RETURN jsonb_build_object(
    'success', true,
    'reservation', jsonb_build_object(
      'id', v_reservation.id,
      'reservation_number', v_reservation.reservation_number,
      'guests', v_reservation.guests,
      'reservation_date', v_reservation.reservation_date,
      'reservation_time', v_reservation.reservation_time,
      'full_name', COALESCE(v_private.full_name, 'Guest'),
      'status', v_reservation.status,
      'deposit_amount', COALESCE(v_reservation.deposit_amount, 0),
      'deposit_status', COALESCE(v_reservation.deposit_status, 'pending'),
      'table_id', v_reservation.table_id
    )
  );
END;
$function$;

-- Create a cleanup function to purge old attempts (optional scheduled job)
CREATE OR REPLACE FUNCTION public.cleanup_old_pin_attempts()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM pin_verification_attempts 
  WHERE attempted_at < now() - INTERVAL '24 hours';
END;
$function$;