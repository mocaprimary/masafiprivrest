-- Create tables table for restaurant table management
CREATE TABLE public.tables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_number INTEGER NOT NULL UNIQUE,
  capacity INTEGER NOT NULL DEFAULT 4,
  location TEXT DEFAULT 'main', -- main, terrace, private
  position_x INTEGER DEFAULT 0, -- for visual layout
  position_y INTEGER DEFAULT 0, -- for visual layout
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add table_id to reservations
ALTER TABLE public.reservations 
ADD COLUMN table_id UUID REFERENCES public.tables(id);

-- Enable RLS
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;

-- Everyone can view tables (for booking UI)
CREATE POLICY "Anyone can view active tables" 
ON public.tables 
FOR SELECT 
USING (is_active = true);

-- Staff can manage tables
CREATE POLICY "Staff can manage tables" 
ON public.tables 
FOR ALL 
USING (is_staff_or_admin(auth.uid()))
WITH CHECK (is_staff_or_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_tables_updated_at
BEFORE UPDATE ON public.tables
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Insert default tables (typical restaurant layout)
INSERT INTO public.tables (table_number, capacity, location, position_x, position_y) VALUES
(1, 2, 'main', 0, 0),
(2, 2, 'main', 1, 0),
(3, 4, 'main', 2, 0),
(4, 4, 'main', 3, 0),
(5, 4, 'main', 0, 1),
(6, 6, 'main', 1, 1),
(7, 6, 'main', 2, 1),
(8, 4, 'main', 3, 1),
(9, 2, 'terrace', 0, 2),
(10, 2, 'terrace', 1, 2),
(11, 4, 'terrace', 2, 2),
(12, 8, 'private', 3, 2);

-- Create function to get available tables for a date/time
CREATE OR REPLACE FUNCTION public.get_available_tables(
  p_date DATE,
  p_time TIME,
  p_guests INTEGER
)
RETURNS SETOF public.tables
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.*
  FROM public.tables t
  WHERE t.is_active = true
    AND t.capacity >= p_guests
    AND t.id NOT IN (
      SELECT r.table_id 
      FROM public.reservations r
      WHERE r.table_id IS NOT NULL
        AND r.reservation_date = p_date
        AND r.status NOT IN ('cancelled', 'completed')
        -- Check for time overlap (assume 2 hour reservation window)
        AND (
          (r.reservation_time <= p_time AND (r.reservation_time + INTERVAL '2 hours')::TIME > p_time)
          OR (p_time <= r.reservation_time AND (p_time + INTERVAL '2 hours')::TIME > r.reservation_time)
        )
    )
  ORDER BY t.capacity ASC, t.table_number ASC;
$$;