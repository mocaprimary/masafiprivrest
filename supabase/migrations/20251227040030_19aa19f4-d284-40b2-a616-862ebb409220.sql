
-- Enable pgcrypto extension for gen_random_bytes
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Recreate the function with the extension available
CREATE OR REPLACE FUNCTION public.create_reservation_secure(
  p_full_name TEXT,
  p_phone TEXT,
  p_email TEXT,
  p_guests INTEGER,
  p_reservation_date DATE,
  p_reservation_time TIME,
  p_special_requests TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_validation jsonb;
  v_reservation_number TEXT;
  v_qr_code TEXT;
  v_qr_expires_at TIMESTAMP WITH TIME ZONE;
  v_reservation_id UUID;
  v_deposit_amount NUMERIC := 50.00;
BEGIN
  -- Validate input
  v_validation := validate_reservation_input(
    p_full_name, p_phone, p_email, p_guests, p_reservation_date, p_reservation_time
  );
  
  IF NOT (v_validation->>'valid')::boolean THEN
    RETURN jsonb_build_object(
      'success', false,
      'errors', v_validation->'errors'
    );
  END IF;
  
  -- Generate unique identifiers
  v_reservation_number := generate_reservation_number();
  v_qr_code := encode(pgcrypto.gen_random_bytes(32), 'hex');
  
  -- QR expires 2 hours after reservation time
  v_qr_expires_at := (p_reservation_date + p_reservation_time + INTERVAL '2 hours') AT TIME ZONE 'Asia/Dubai';
  
  -- Insert reservation
  INSERT INTO reservations (
    full_name, phone, email, guests,
    reservation_date, reservation_time,
    special_requests, reservation_number,
    qr_code, qr_expires_at, deposit_amount,
    status, deposit_status
  )
  VALUES (
    trim(p_full_name), trim(p_phone), lower(trim(p_email)), p_guests,
    p_reservation_date, p_reservation_time,
    p_special_requests, v_reservation_number,
    v_qr_code, v_qr_expires_at, v_deposit_amount,
    'pending', 'pending'
  )
  RETURNING id INTO v_reservation_id;
  
  -- Log creation
  INSERT INTO audit_logs (action, entity_type, entity_id, details)
  VALUES (
    'reservation_created',
    'reservation',
    v_reservation_id,
    jsonb_build_object(
      'reservation_number', v_reservation_number,
      'guest_name', p_full_name,
      'guests', p_guests,
      'date', p_reservation_date,
      'time', p_reservation_time
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'reservation', jsonb_build_object(
      'id', v_reservation_id,
      'reservation_number', v_reservation_number,
      'deposit_amount', v_deposit_amount
    )
  );
END;
$$;
