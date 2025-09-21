-- Create user roles enum and tables for admin authentication
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1
$$;

-- Update existing tables with admin-only policies
-- Update tests table policies
DROP POLICY IF EXISTS "Admins can manage tests" ON public.tests;
DROP POLICY IF EXISTS "Anyone can view tests" ON public.tests;

CREATE POLICY "Admins can manage tests" 
ON public.tests
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view published tests" 
ON public.tests
FOR SELECT
TO anon, authenticated
USING (true);

-- Update test_questions table policies
DROP POLICY IF EXISTS "Admins can manage test questions" ON public.test_questions;
DROP POLICY IF EXISTS "Anyone can view test questions" ON public.test_questions;

CREATE POLICY "Admins can manage test questions" 
ON public.test_questions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view test questions" 
ON public.test_questions
FOR SELECT
TO anon, authenticated
USING (true);

-- Update access_codes table with proper admin policies
DROP POLICY IF EXISTS "Admins can manage access codes" ON public.access_codes;
DROP POLICY IF EXISTS "Admins can insert access codes" ON public.access_codes;
DROP POLICY IF EXISTS "Admins can update access codes" ON public.access_codes;
DROP POLICY IF EXISTS "Admins can delete access codes" ON public.access_codes;
DROP POLICY IF EXISTS "Anyone can verify access codes" ON public.access_codes;

CREATE POLICY "Admins can manage access codes" 
ON public.access_codes
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can verify access codes" 
ON public.access_codes
FOR SELECT
TO anon, authenticated
USING (true);

-- Create test_attempts table for tracking test sessions
CREATE TABLE public.test_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID REFERENCES public.tests(id) ON DELETE CASCADE NOT NULL,
    access_code_id UUID REFERENCES public.access_codes(id) ON DELETE SET NULL,
    anon_user_id UUID NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    submitted_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    score INTEGER DEFAULT 0,
    per_subject_scores JSONB,
    session_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on test_attempts
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;

-- RLS policies for test_attempts
CREATE POLICY "Anyone can create test attempts" 
ON public.test_attempts
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Users can view their own attempts" 
ON public.test_attempts
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Users can update their own attempts" 
ON public.test_attempts
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins can view all attempts" 
ON public.test_attempts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create test_responses table for storing individual question responses
CREATE TABLE public.test_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID REFERENCES public.test_attempts(id) ON DELETE CASCADE NOT NULL,
    question_id UUID REFERENCES public.test_questions(id) ON DELETE CASCADE NOT NULL,
    response_value JSONB,
    time_spent_seconds INTEGER DEFAULT 0,
    marked_for_review BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (attempt_id, question_id)
);

-- Enable RLS on test_responses
ALTER TABLE public.test_responses ENABLE ROW LEVEL SECURITY;

-- RLS policies for test_responses
CREATE POLICY "Users can manage their test responses" 
ON public.test_responses
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins can view all responses" 
ON public.test_responses
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Update triggers for updated_at columns
CREATE TRIGGER update_test_attempts_updated_at
BEFORE UPDATE ON public.test_attempts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_test_responses_updated_at
BEFORE UPDATE ON public.test_responses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create contact_messages table for Telegram integration
CREATE TABLE public.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    message TEXT NOT NULL,
    sent_to_telegram BOOLEAN DEFAULT false,
    telegram_response JSONB,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on contact_messages
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for contact_messages
CREATE POLICY "Anyone can create contact messages" 
ON public.contact_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view all contact messages" 
ON public.contact_messages
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));