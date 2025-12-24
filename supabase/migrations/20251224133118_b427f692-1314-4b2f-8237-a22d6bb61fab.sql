-- Allow customers to view their own reservations by matching email
CREATE POLICY "Customers can view their own reservations" 
ON public.reservations 
FOR SELECT 
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);