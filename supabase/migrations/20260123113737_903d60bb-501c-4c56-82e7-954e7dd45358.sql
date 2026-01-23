-- Create feedback table for anonymous user feedback
CREATE TABLE public.document_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  helpfulness TEXT NOT NULL CHECK (helpfulness IN ('helpful', 'not_helpful')),
  text_feedback TEXT,
  session_id TEXT,
  version TEXT NOT NULL DEFAULT 'V1'
);

-- Enable Row Level Security
ALTER TABLE public.document_feedback ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert feedback (anonymous)
CREATE POLICY "Anyone can submit feedback"
ON public.document_feedback
FOR INSERT
WITH CHECK (true);

-- No select/update/delete for users (admin only via service role)
