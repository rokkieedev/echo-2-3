-- Fix RLS policies for user_roles table
CREATE POLICY "Users can view their own roles" 
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all user roles" 
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Enable leaked password protection
-- This needs to be done via the Supabase dashboard under Authentication > Settings
-- But we can document this requirement for the user