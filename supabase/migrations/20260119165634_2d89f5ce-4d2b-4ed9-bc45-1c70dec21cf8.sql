-- Create table to track reservation rate limiting
CREATE TABLE IF NOT EXISTS public.reservation_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  phone_hash TEXT, -- Hash of phone number to prevent spam from same phone
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  success BOOLEAN NOT NULL DEFAULT false
);

-- Create index for efficient lookups
CREATE INDEX idx_reservation_rate_limits_ip_time 
ON public.reservation_rate_limits(ip_address, attempted_at DESC);

CREATE INDEX idx_reservation_rate_limits_phone_time 
ON public.reservation_rate_limits(phone_hash, attempted_at DESC);

-- Enable RLS
ALTER TABLE public.reservation_rate_limits ENABLE ROW LEVEL SECURITY;

-- No direct access - only via SECURITY DEFINER functions
CREATE POLICY "No direct access to rate limits"
ON public.reservation_rate_limits
FOR ALL
USING (false);

-- Function to check and record reservation rate limit
CREATE OR REPLACE FUNCTION public.check_reservation_rate_limit(
  p_ip_address TEXT,
  p_phone_hash TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_ip_attempts_hour INTEGER;
  v_ip_attempts_day INTEGER;
  v_phone_attempts_day INTEGER;
  v_max_ip_per_hour INTEGER := 5;  -- Max 5 reservations per hour per IP
  v_max_ip_per_day INTEGER := 15;  -- Max 15 reservations per day per IP
  v_max_phone_per_day INTEGER := 3; -- Max 3 reservations per day per phone
  v_cooldown_seconds INTEGER;
BEGIN
  -- Count IP attempts in last hour
  SELECT COUNT(*) INTO v_ip_attempts_hour
  FROM reservation_rate_limits
  WHERE ip_address = p_ip_address
    AND attempted_at > now() - INTERVAL '1 hour';

  -- Count IP attempts in last 24 hours
  SELECT COUNT(*) INTO v_ip_attempts_day
  FROM reservation_rate_limits
  WHERE ip_address = p_ip_address
    AND attempted_at > now() - INTERVAL '24 hours';

  -- Check IP hourly limit
  IF v_ip_attempts_hour >= v_max_ip_per_hour THEN
    -- Calculate cooldown
    SELECT EXTRACT(EPOCH FROM (MIN(attempted_at) + INTERVAL '1 hour' - now()))::INTEGER
    INTO v_cooldown_seconds
    FROM reservation_rate_limits
    WHERE ip_address = p_ip_address
      AND attempted_at > now() - INTERVAL '1 hour';

    RETURN jsonb_build_object(
      'allowed', false,
      'error', 'Too many reservation attempts. Please try again in ' || GREATEST(1, v_cooldown_seconds / 60) || ' minutes.',
      'retry_after_seconds', GREATEST(60, v_cooldown_seconds)
    );
  END IF;

  -- Check IP daily limit
  IF v_ip_attempts_day >= v_max_ip_per_day THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'error', 'Daily reservation limit reached. Please try again tomorrow.',
      'retry_after_seconds', 86400
    );
  END IF;

  -- Check phone daily limit if phone hash provided
  IF p_phone_hash IS NOT NULL THEN
    SELECT COUNT(*) INTO v_phone_attempts_day
    FROM reservation_rate_limits
    WHERE phone_hash = p_phone_hash
      AND attempted_at > now() - INTERVAL '24 hours'
      AND success = true;  -- Only count successful reservations for phone

    IF v_phone_attempts_day >= v_max_phone_per_day THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'error', 'Maximum reservations for this phone number reached today.',
        'retry_after_seconds', 86400
      );
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'remaining_hour', v_max_ip_per_hour - v_ip_attempts_hour,
    'remaining_day', v_max_ip_per_day - v_ip_attempts_day
  );
END;
$$;

-- Function to record a reservation attempt
CREATE OR REPLACE FUNCTION public.record_reservation_attempt(
  p_ip_address TEXT,
  p_phone_hash TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO reservation_rate_limits (ip_address, phone_hash, success)
  VALUES (p_ip_address, p_phone_hash, p_success);
END;
$$;

-- Function to cleanup old rate limit records (call periodically)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM reservation_rate_limits 
  WHERE attempted_at < now() - INTERVAL '48 hours';
END;
$$;