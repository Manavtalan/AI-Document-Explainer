-- Create table for pro access requests (beta intent capture)
CREATE TABLE public.pro_access_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  source TEXT NOT NULL DEFAULT 'Pro Request – Beta',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (but allow anonymous inserts for beta)
ALTER TABLE public.pro_access_requests ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to insert (anonymous users can request)
CREATE POLICY "Anyone can request pro access"
ON public.pro_access_requests
FOR INSERT
WITH CHECK (true);

-- No SELECT/UPDATE/DELETE for public - admin only via service role