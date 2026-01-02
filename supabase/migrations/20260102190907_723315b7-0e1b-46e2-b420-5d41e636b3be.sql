-- Drop and recreate function with correct status
DROP FUNCTION IF EXISTS public.validate_and_use_qr(text, text);

CREATE FUNCTION public.validate_and_use_qr(
  p_qr_code text DEFAULT NULL,
  p_reservation_number text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reservation RECORD;
  v_private RECORD;
BEGIN
  -- Must be staff
  IF NOT is_staff_or_admin(auth.uid()) THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Staff access required');
  END IF;

  -- Find reservation by QR code or reservation number
  IF p_qr_code IS NOT NULL AND p_qr_code <> '' THEN
    SELECT * INTO v_reservation FROM reservations 
    WHERE qr_code = p_qr_code;
  ELSIF p_reservation_number IS NOT NULL AND p_reservation_number <> '' THEN
    SELECT * INTO v_reservation FROM reservations 
    WHERE reservation_number = p_reservation_number;
  ELSE
    RETURN json_build_object('success', false, 'error', 'No QR code or reservation number provided');
  END IF;

  -- Check if reservation exists
  IF v_reservation IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Reservation not found');
  END IF;

  -- Check if already used
  IF v_reservation.qr_used_at IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'QR code already used');
  END IF;

  -- Check if already arrived
  IF v_reservation.status = 'arrived' THEN
    RETURN json_build_object('success', false, 'error', 'Guest already checked in');
  END IF;

  -- Check if cancelled
  IF v_reservation.status = 'cancelled' THEN
    RETURN json_build_object('success', false, 'error', 'Reservation was cancelled');
  END IF;

  -- Check expiry
  IF v_reservation.qr_expires_at IS NOT NULL AND v_reservation.qr_expires_at < now() THEN
    RETURN json_build_object('success', false, 'error', 'QR code has expired');
  END IF;

  -- Get private details
  SELECT * INTO v_private FROM reservation_private_details 
  WHERE reservation_id = v_reservation.id;

  -- Mark as used and update status to 'arrived'
  UPDATE reservations SET
    qr_used_at = now(),
    checked_in_at = now(),
    checked_in_by = auth.uid(),
    status = 'arrived'
  WHERE id = v_reservation.id;

  -- Return success with reservation details
  RETURN json_build_object(
    'success', true,
    'reservation', json_build_object(
      'id', v_reservation.id,
      'reservation_number', v_reservation.reservation_number,
      'guests', v_reservation.guests,
      'reservation_date', v_reservation.reservation_date,
      'reservation_time', v_reservation.reservation_time,
      'full_name', COALESCE(v_private.full_name, 'Guest'),
      'phone', v_private.phone,
      'email', v_private.email,
      'special_requests', v_private.special_requests
    )
  );
END;
$$;