-- Create notices table for admin announcements
CREATE TABLE public.notices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  test_type TEXT CHECK (test_type IN ('JEE', 'NEET')) NULL,
  test_date DATE NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active notices" 
ON public.notices 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage notices" 
ON public.notices 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_notices_updated_at
BEFORE UPDATE ON public.notices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update books table to include JEE/NEET classification
ALTER TABLE public.books 
ADD COLUMN exam_type TEXT CHECK (exam_type IN ('JEE', 'NEET')) DEFAULT 'JEE';

-- Update assignments table to include JEE/NEET classification  
ALTER TABLE public.assignments 
ADD COLUMN exam_type TEXT CHECK (exam_type IN ('JEE', 'NEET')) DEFAULT 'JEE';

-- Update tests table to include JEE/NEET classification
ALTER TABLE public.tests 
ADD COLUMN exam_type TEXT CHECK (exam_type IN ('JEE', 'NEET')) DEFAULT 'JEE';

-- Add percentile calculation fields to test_attempts
ALTER TABLE public.test_attempts 
ADD COLUMN percentile NUMERIC(5,2) DEFAULT NULL,
ADD COLUMN predicted_rank INTEGER DEFAULT NULL;

-- Create hardcoded admin user role
INSERT INTO public.user_roles (user_id, role) 
VALUES ('550e8400-e29b-41d4-a716-446655440000'::uuid, 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;