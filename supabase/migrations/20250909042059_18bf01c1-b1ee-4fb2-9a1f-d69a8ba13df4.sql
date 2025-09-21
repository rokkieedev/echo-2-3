-- Create custom admin_users table for authentication
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Insert the hardcoded admin user (password will be hashed)
INSERT INTO public.admin_users (admin_id, password_hash) 
VALUES ('ayushavi@officialchutiya.com', '$2b$10$CwTycUz6Cxu6UnZ3nIcNF.Tq4kc8XNt0qCsl5P7DbqbWGGN4JzF8y');

-- Create policy for admin users table
CREATE POLICY "Admin users can be verified"
ON public.admin_users
FOR SELECT
USING (true);