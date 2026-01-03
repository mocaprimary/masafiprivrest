-- Fix the create_preorder function to use valid status
CREATE OR REPLACE FUNCTION public.create_preorder(p_reservation_id uuid, p_items jsonb DEFAULT '[]'::jsonb, p_notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  
  -- Create preorder with 'placed' status (valid status per constraint)
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
    'placed',  -- Changed from 'pending' to valid status
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
$function$;