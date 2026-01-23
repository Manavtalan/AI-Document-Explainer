-- Create usage tracking table for server-side rate limiting
CREATE TABLE public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint TEXT NOT NULL,
  ip_address TEXT,
  used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups by fingerprint and date
CREATE INDEX idx_usage_tracking_fingerprint_date 
ON public.usage_tracking (fingerprint, used_at);

-- Enable RLS
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- Only allow inserts from anonymous users (for tracking)
CREATE POLICY "Allow anonymous inserts" 
ON public.usage_tracking 
FOR INSERT 
WITH CHECK (true);

-- Deny all reads
CREATE POLICY "No public reads" 
ON public.usage_tracking 
FOR SELECT 
USING (false);

-- Deny all updates
CREATE POLICY "No updates allowed" 
ON public.usage_tracking 
FOR UPDATE 
USING (false);

-- Deny all deletes
CREATE POLICY "No deletes allowed" 
ON public.usage_tracking 
FOR DELETE 
USING (false);