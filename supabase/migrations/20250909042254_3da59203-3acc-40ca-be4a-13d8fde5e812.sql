-- Fix admin_users table security policies
DROP POLICY IF EXISTS "Admin users can be verified" ON public.admin_users;

-- Add comprehensive policies for admin_users table
CREATE POLICY "Allow admin verification"
ON public.admin_users
FOR SELECT
USING (true);

CREATE POLICY "Only system can insert admin users"
ON public.admin_users
FOR INSERT
WITH CHECK (false);

CREATE POLICY "Only system can update admin users"
ON public.admin_users
FOR UPDATE
USING (false);

CREATE POLICY "Only system can delete admin users"
ON public.admin_users
FOR DELETE
USING (false);