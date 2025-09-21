-- Create jee_percentiles table for percentile prediction
CREATE TABLE public.jee_percentiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('mains', 'advanced')),
  score INTEGER NOT NULL,
  percentile FLOAT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(exam_type, score)
);

-- Enable RLS
ALTER TABLE public.jee_percentiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view percentiles" 
ON public.jee_percentiles 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage percentiles" 
ON public.jee_percentiles 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert anchor dataset for JEE Mains
INSERT INTO public.jee_percentiles (exam_type, score, percentile) VALUES
('mains', 0, 0.0),
('mains', 25, 25.0),
('mains', 50, 55.0),
('mains', 75, 70.0),
('mains', 100, 80.0),
('mains', 125, 87.0),
('mains', 150, 95.0),
('mains', 175, 97.5),
('mains', 200, 99.0),
('mains', 225, 99.5),
('mains', 250, 99.8),
('mains', 275, 99.9),
('mains', 300, 100.0);

-- Insert anchor dataset for JEE Advanced
INSERT INTO public.jee_percentiles (exam_type, score, percentile) VALUES
('advanced', 0, 0.0),
('advanced', 30, 15.0),
('advanced', 60, 35.0),
('advanced', 90, 55.0),
('advanced', 120, 70.0),
('advanced', 150, 82.0),
('advanced', 180, 90.0),
('advanced', 210, 95.0),
('advanced', 240, 98.0),
('advanced', 270, 99.0),
('advanced', 300, 99.5),
('advanced', 330, 99.8),
('advanced', 360, 100.0);

-- Add percentile and predicted_rank columns to test_attempts table
ALTER TABLE public.test_attempts 
ADD COLUMN percentile FLOAT DEFAULT 0,
ADD COLUMN predicted_rank INTEGER DEFAULT 0;

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  target_exam TEXT CHECK (target_exam IN ('jee_mains', 'jee_advanced', 'neet')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for profiles timestamps
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();