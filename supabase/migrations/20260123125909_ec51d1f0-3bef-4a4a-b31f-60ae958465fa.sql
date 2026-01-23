-- Add explicit deny policies to document_feedback table for consistency and defense-in-depth
-- These policies make the security intentions clear and prevent accidental policy additions from granting access

-- Deny public reads on feedback
CREATE POLICY "No public reads on feedback"
ON public.document_feedback
FOR SELECT
USING (false);

-- Deny updates on feedback
CREATE POLICY "No updates on feedback"
ON public.document_feedback
FOR UPDATE
USING (false);

-- Deny deletes on feedback
CREATE POLICY "No deletes on feedback"
ON public.document_feedback
FOR DELETE
USING (false);