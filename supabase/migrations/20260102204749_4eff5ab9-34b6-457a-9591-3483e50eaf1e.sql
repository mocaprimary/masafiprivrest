-- Add preorder fields to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS is_preorder boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS scheduled_for timestamp with time zone,
ADD COLUMN IF NOT EXISTS preorder_notes text;

-- Create function to verify guest access using reservation number + PIN (last 4 of phone)
CREATE OR REPLACE FUNCTION public.verify_guest_access(
  p_reservation_number text,
  p_pin text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reservation RECORD;
  v_private RECORD;
  v_phone_last4 text;
BEGIN
  -- Find reservation by number
  SELECT * INTO v_reservation 
  FROM reservations 
  WHERE reservation_number = p_reservation_number;

  -- Check if reservation exists
  IF v_reservation IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reservation not found');
  END IF;

  -- Check if cancelled
  IF v_reservation.status = 'cancelled' THEN
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
    RETURN jsonb_build_object('success', false, 'error', 'Invalid PIN');
  END IF;

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
$$;

-- Create function to create pre-order for a reservation (guest access)
CREATE OR REPLACE FUNCTION public.create_preorder(
  p_reservation_id uuid,
  p_items jsonb DEFAULT '[]'::jsonb,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_reservation RECORD;
  v_table_number INTEGER;
  v_item RECORD;
BEGIN
  -- Get reservation details
  SELECT r.*, t.table_number INTO v_reservation
  FROM reservations r
  LEFT JOIN tables t ON t.id = r.table_id
  WHERE r.id = p_reservation_id;
  
  IF v_reservation IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reservation not found');
  END IF;
  
  -- Use table number from reservation or default to 0 for preorders
  v_table_number := COALESCE(v_reservation.table_number, 0);
  
  -- Generate order number
  v_order_number := 'PRE-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(floor(random() * 10000)::text, 4, '0');
  
  -- Create preorder
  INSERT INTO orders (
    order_number, table_number, reservation_id,
    customer_user_id, created_via, is_preorder,
    scheduled_for, preorder_notes,
    status, payment_status
  )
  VALUES (
    v_order_number, 
    v_table_number,
    p_reservation_id,
    v_reservation.customer_user_id,
    'reservation',
    true,
    (v_reservation.reservation_date + v_reservation.reservation_time)::timestamp with time zone,
    p_notes,
    'pending',
    'pending'
  )
  RETURNING id INTO v_order_id;
  
  -- Insert order items
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(menu_item_id uuid, quantity integer, modifiers text[])
  LOOP
    INSERT INTO order_items (order_id, menu_item_id, quantity, modifiers, name, price)
    SELECT v_order_id, v_item.menu_item_id, COALESCE(v_item.quantity, 1), v_item.modifiers, mi.name, mi.price
    FROM menu_items mi
    WHERE mi.id = v_item.menu_item_id AND mi.is_available = true;
  END LOOP;
  
  -- Log preorder creation
  INSERT INTO audit_logs (action, entity_type, entity_id, user_id, details)
  VALUES (
    'preorder_created',
    'order',
    v_order_id,
    v_reservation.customer_user_id,
    jsonb_build_object(
      'order_number', v_order_number,
      'reservation_id', p_reservation_id,
      'is_preorder', true,
      'scheduled_for', v_reservation.reservation_date
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'order', jsonb_build_object(
      'id', v_order_id,
      'order_number', v_order_number,
      'scheduled_for', v_reservation.reservation_date
    )
  );
END;
$$;

-- Function to get preorders for a reservation
CREATE OR REPLACE FUNCTION public.get_reservation_preorders(p_reservation_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_orders jsonb;
BEGIN
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', o.id,
      'order_number', o.order_number,
      'status', o.status,
      'subtotal', o.subtotal,
      'total', o.total,
      'created_at', o.created_at,
      'items', (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'id', oi.id,
            'name', oi.name,
            'quantity', oi.quantity,
            'price', oi.price
          )
        ), '[]'::jsonb)
        FROM order_items oi
        WHERE oi.order_id = o.id
      )
    )
  ), '[]'::jsonb) INTO v_orders
  FROM orders o
  WHERE o.reservation_id = p_reservation_id AND o.is_preorder = true;
  
  RETURN jsonb_build_object('success', true, 'orders', v_orders);
END;
$$;