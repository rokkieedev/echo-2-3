import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { code, testId } = await req.json();

    if (!code || !testId) {
      return new Response(
        JSON.stringify({ error: 'Code and testId are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify access code using the database function
    const { data: isValid, error: verifyError } = await supabase
      .rpc('verify_access_code', { input_code: code });

    if (verifyError) {
      console.error('Error verifying access code:', verifyError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify access code' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!isValid) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          message: 'Invalid or expired access code' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Use the access code (decrement uses_remaining)
    const { data: used, error: useError } = await supabase
      .rpc('use_access_code', { input_code: code });

    if (useError || !used) {
      console.error('Error using access code:', useError);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          message: 'Access code could not be used' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get access code details for logging
    const { data: codeData } = await supabase
      .from('access_codes')
      .select('id, code')
      .eq('code', code)
      .single();

    return new Response(
      JSON.stringify({ 
        valid: true, 
        message: 'Access code verified successfully',
        accessCodeId: codeData?.id 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});