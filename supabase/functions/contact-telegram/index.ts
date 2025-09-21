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

    const { name, email, message } = await req.json();

    if (!name || !message) {
      return new Response(
        JSON.stringify({ error: 'Name and message are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get client IP for logging
    const clientIP = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    'unknown';

    // Store contact message in database
    const { data: contactData, error: dbError } = await supabase
      .from('contact_messages')
      .insert({
        name,
        email: email || null,
        message,
        ip_address: clientIP,
        sent_to_telegram: false
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ error: 'Failed to save message' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Send to Telegram if bot token and chat ID are configured
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const chatId = Deno.env.get('TELEGRAM_CHAT_ID');

    let telegramSent = false;
    let telegramResponse = null;

    if (botToken && chatId) {
      try {
        const istTime = new Date().toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour12: true,
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        const telegramMessage = `[IIT JEE ECHO Contact]
📝 Name: ${name}
${email ? `📧 Email: ${email}` : ''}
💬 Message: ${message}
🕒 Time (IST): ${istTime}
🌐 IP: ${clientIP}`;

        const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const telegramPayload = {
          chat_id: chatId,
          text: telegramMessage,
          parse_mode: 'HTML'
        };

        const telegramRes = await fetch(telegramUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(telegramPayload),
        });

        telegramResponse = await telegramRes.json();
        telegramSent = telegramRes.ok;

        if (!telegramSent) {
          console.error('Telegram API error:', telegramResponse);
        }
      } catch (telegramError) {
        console.error('Telegram sending error:', telegramError);
        telegramResponse = { error: telegramError.message };
      }
    }

    // Update database with Telegram status
    await supabase
      .from('contact_messages')
      .update({
        sent_to_telegram: telegramSent,
        telegram_response: telegramResponse
      })
      .eq('id', contactData.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Contact message received successfully',
        telegramSent: telegramSent 
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