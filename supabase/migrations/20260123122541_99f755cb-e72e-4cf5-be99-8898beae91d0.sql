-- Add explicit SELECT policy to deny public reads on pro_access_requests table
-- This explicitly prevents any SELECT queries on the table from regular users
CREATE POLICY "No public reads on pro access requests"
ON public.pro_access_requests
FOR SELECT
USING (false);

-- Also add explicit deny policies for UPDATE and DELETE while we're at it
CREATE POLICY "No updates allowed on pro access requests"
ON public.pro_access_requests
FOR UPDATE
USING (false);

CREATE POLICY "No deletes allowed on pro access requests"
ON public.pro_access_requests
FOR DELETE
USING (false);