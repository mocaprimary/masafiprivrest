-- Fix order price manipulation vulnerability by adding server-side validation

-- 1. Create function to validate order_items price matches menu_items
CREATE OR REPLACE FUNCTION public.validate_order_item_price()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actual_price DECIMAL(10,2);
  actual_name TEXT;
  actual_name_ar TEXT;
BEGIN
  -- Get the actual price and name from menu_items
  SELECT price, name, name_ar INTO actual_price, actual_name, actual_name_ar 
  FROM menu_items 
  WHERE id = NEW.menu_item_id AND is_available = true;
  
  -- Validate menu item exists and is available
  IF actual_price IS NULL THEN
    RAISE EXCEPTION 'Invalid or unavailable menu item';
  END IF;
  
  -- Override client-supplied values with actual database values
  NEW.price := actual_price;
  NEW.name := actual_name;
  NEW.name_ar := actual_name_ar;
  
  RETURN NEW;
END;
$$;

-- 2. Create trigger to enforce order item prices
DROP TRIGGER IF EXISTS enforce_order_item_price ON order_items;
CREATE TRIGGER enforce_order_item_price
  BEFORE INSERT ON order_items
  FOR EACH ROW EXECUTE FUNCTION validate_order_item_price();

-- 3. Create function to recalculate order totals from order_items
CREATE OR REPLACE FUNCTION public.recalculate_order_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  calculated_subtotal DECIMAL(10,2);
  order_record RECORD;
BEGIN
  -- Get the order
  SELECT * INTO order_record FROM orders WHERE id = NEW.order_id;
  
  -- Calculate subtotal from order_items (which have validated prices)
  SELECT COALESCE(SUM(quantity * price), 0) INTO calculated_subtotal
  FROM order_items
  WHERE order_id = NEW.order_id;
  
  -- Update the order with recalculated totals
  UPDATE orders 
  SET 
    subtotal = calculated_subtotal,
    total = calculated_subtotal - COALESCE(deposit_applied, 0)
  WHERE id = NEW.order_id;
  
  RETURN NEW;
END;
$$;

-- 4. Create trigger to recalculate totals after order_items insert
DROP TRIGGER IF EXISTS recalculate_order_totals_trigger ON order_items;
CREATE TRIGGER recalculate_order_totals_trigger
  AFTER INSERT ON order_items
  FOR EACH ROW EXECUTE FUNCTION recalculate_order_totals();

-- 5. Create function to validate deposit_applied doesn't exceed available deposit
CREATE OR REPLACE FUNCTION public.validate_order_deposit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  available_deposit DECIMAL(10,2);
BEGIN
  -- If deposit_applied is set, validate against reservation
  IF NEW.deposit_applied > 0 AND NEW.reservation_id IS NOT NULL THEN
    SELECT COALESCE(deposit_amount, 0) INTO available_deposit
    FROM reservations 
    WHERE id = NEW.reservation_id AND deposit_status = 'paid';
    
    -- Cap deposit_applied to available amount
    IF available_deposit IS NULL OR NEW.deposit_applied > available_deposit THEN
      NEW.deposit_applied := COALESCE(available_deposit, 0);
    END IF;
  ELSIF NEW.deposit_applied > 0 AND NEW.reservation_id IS NULL THEN
    -- No reservation, no deposit can be applied
    NEW.deposit_applied := 0;
  END IF;
  
  -- Ensure total is properly calculated
  NEW.total := NEW.subtotal - COALESCE(NEW.deposit_applied, 0);
  
  -- Ensure payment_status starts as pending for new orders
  IF TG_OP = 'INSERT' THEN
    NEW.payment_status := 'pending';
  END IF;
  
  RETURN NEW;
END;
$$;

-- 6. Create trigger to validate deposits and enforce payment_status
DROP TRIGGER IF EXISTS validate_order_deposit_trigger ON orders;
CREATE TRIGGER validate_order_deposit_trigger
  BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION validate_order_deposit();