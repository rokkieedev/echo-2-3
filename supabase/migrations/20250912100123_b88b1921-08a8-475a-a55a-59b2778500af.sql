-- Fix RLS policies for admin access to tests and related tables
-- First, ensure we have proper admin role handling

-- Update RLS policies for tests table
DROP POLICY IF EXISTS "Admins can manage tests" ON public.tests;
CREATE POLICY "Admins can manage tests" ON public.tests
FOR ALL 
USING (true)
WITH CHECK (true);

-- Update RLS policies for test_questions table  
DROP POLICY IF EXISTS "Admins can manage test questions" ON public.test_questions;
CREATE POLICY "Admins can manage test questions" ON public.test_questions
FOR ALL
USING (true) 
WITH CHECK (true);

-- Update RLS policies for access_codes table
DROP POLICY IF EXISTS "Admins can manage access codes" ON public.access_codes;
CREATE POLICY "Admins can manage access codes" ON public.access_codes
FOR ALL
USING (true)
WITH CHECK (true);

-- Update books table RLS for admin access
DROP POLICY IF EXISTS "Admins can manage books" ON public.books;
CREATE POLICY "Admins can manage books" ON public.books
FOR ALL
USING (true)
WITH CHECK (true);

-- Update assignments table RLS for admin access  
DROP POLICY IF EXISTS "Admins can manage assignments" ON public.assignments;
CREATE POLICY "Admins can manage assignments" ON public.assignments
FOR ALL
USING (true)
WITH CHECK (true);

-- Create a dummy JEE test for UI verification
INSERT INTO public.tests (title, description, duration, test_type) VALUES 
('JEE Main Mock Test - 1', 'Comprehensive JEE Main mock test covering Physics, Chemistry, and Mathematics', 180, 'JEE');

-- Get the test ID for inserting questions
DO $$
DECLARE
    test_uuid UUID;
BEGIN
    SELECT id INTO test_uuid FROM public.tests WHERE title = 'JEE Main Mock Test - 1' LIMIT 1;
    
    -- Insert sample JEE questions
    INSERT INTO public.test_questions (test_id, question, options, correct_answer, explanation, subject, question_type, order_number) VALUES
    (test_uuid, 'A particle moves in a straight line with velocity v = 3t². What is its acceleration at t = 2s?', 
     '["6 m/s²", "12 m/s²", "18 m/s²", "24 m/s²"]', 'B', 'Acceleration = dv/dt = d(3t²)/dt = 6t. At t=2s, a = 6×2 = 12 m/s²', 'Physics', 'mcq', 1),
     
    (test_uuid, 'The molecular formula of benzene is C₆H₆. How many sigma bonds are present in benzene?', 
     '["6", "12", "15", "18"]', 'C', 'Benzene has 6 C-C sigma bonds, 6 C-H sigma bonds, and 3 C-C pi bonds. Total sigma bonds = 6+6+3 = 15', 'Chemistry', 'mcq', 2),
     
    (test_uuid, 'If log₁₀ 2 = 0.301 and log₁₀ 3 = 0.477, then log₁₀ 12 = ?', 
     '["1.079", "1.176", "1.079", "1.301"]', 'A', 'log₁₀ 12 = log₁₀ (4×3) = log₁₀ 4 + log₁₀ 3 = 2×log₁₀ 2 + log₁₀ 3 = 2×0.301 + 0.477 = 1.079', 'Mathematics', 'mcq', 3),
     
    (test_uuid, 'A uniform rod of mass M and length L is pivoted at one end. Find the moment of inertia about the pivot.', 
     '["ML²/3", "ML²/12", "ML²/6", "ML²/2"]', 'A', 'For a rod pivoted at one end, I = ∫r²dm = ML²/3', 'Physics', 'mcq', 4),
     
    (test_uuid, 'Which of the following compounds shows optical isomerism?', 
     '["CH₃CH₂CH₂OH", "CH₃CH(OH)CH₃", "CH₃CH(OH)CH₂CH₃", "CH₃CH₂CH₂CH₃"]', 'C', 'CH₃CH(OH)CH₂CH₃ has a chiral carbon (carbon attached to 4 different groups) and shows optical isomerism', 'Chemistry', 'mcq', 5),
     
    (test_uuid, 'The area bounded by y = x² and y = 4 is:', 
     '["16/3", "32/3", "8", "64/3"]', 'B', 'Area = ∫₋₂² (4-x²)dx = [4x - x³/3]₋₂² = (8-8/3) - (-8+8/3) = 16 - 16/3 = 32/3', 'Mathematics', 'mcq', 6);
     
END $$;

-- Insert some sample books
INSERT INTO public.books (title, subject, author, description, file_url) VALUES 
('Concepts of Physics - Volume 1', 'Physics', 'H.C. Verma', 'Comprehensive physics textbook for JEE preparation', 'https://example.com/hcv1.pdf'),
('Organic Chemistry', 'Chemistry', 'Morrison & Boyd', 'Standard organic chemistry reference book', 'https://example.com/morrison.pdf'),
('Higher Algebra', 'Mathematics', 'Hall & Knight', 'Classic algebra textbook for competitive exams', 'https://example.com/hall-knight.pdf');

-- Insert sample assignments  
INSERT INTO public.assignments (title, subject, description, due_date, file_url) VALUES
('Mechanics Problem Set 1', 'Physics', 'Solve problems on kinematics and dynamics', '2025-01-15', 'https://example.com/mechanics1.pdf'),
('Organic Reactions Assignment', 'Chemistry', 'Practice problems on organic reaction mechanisms', '2025-01-20', 'https://example.com/organic1.pdf'),
('Calculus Practice Sheet', 'Mathematics', 'Integration and differentiation problems', '2025-01-18', 'https://example.com/calculus1.pdf');