-- Update access_codes table to support one-time use and test linking
ALTER TABLE public.access_codes 
ADD COLUMN test_id UUID REFERENCES public.tests(id) ON DELETE CASCADE,
ADD COLUMN used_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN used_by_anon_id UUID;

-- Update the use_access_code function to mark codes as used
CREATE OR REPLACE FUNCTION public.use_access_code(input_code text, anon_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code_record record;
  result jsonb;
BEGIN
  -- First verify the code is valid and get the associated test
  SELECT ac.*, t.title as test_title, t.id as test_id
  INTO code_record
  FROM public.access_codes ac
  LEFT JOIN public.tests t ON ac.test_id = t.id
  WHERE ac.code = input_code 
  AND ac.is_active = true 
  AND (ac.expires_at IS NULL OR ac.expires_at > now())
  AND (ac.uses_remaining IS NULL OR ac.uses_remaining > 0)
  AND ac.used_at IS NULL;  -- Code hasn't been used yet
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invalid or expired access code');
  END IF;
  
  -- Mark the code as used
  UPDATE public.access_codes 
  SET used_at = now(),
      used_by_anon_id = anon_user_id,
      uses_remaining = CASE 
        WHEN uses_remaining IS NOT NULL THEN uses_remaining - 1 
        ELSE NULL 
      END
  WHERE code = input_code;
  
  -- Return success with test information
  RETURN jsonb_build_object(
    'success', true, 
    'test_id', code_record.test_id,
    'test_title', code_record.test_title,
    'message', 'Access code verified successfully'
  );
END;
$$;