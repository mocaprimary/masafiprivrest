-- Create a helper function to check if user is manager or above
CREATE OR REPLACE FUNCTION public.is_manager_or_above(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'manager')
  )
$$;

-- Update the menu_items policy to allow managers to manage menu
DROP POLICY IF EXISTS "Staff can manage menu items" ON public.menu_items;

CREATE POLICY "Managers and admins can manage menu items"
ON public.menu_items
FOR ALL
TO authenticated
USING (is_manager_or_above(auth.uid()))
WITH CHECK (is_manager_or_above(auth.uid()));