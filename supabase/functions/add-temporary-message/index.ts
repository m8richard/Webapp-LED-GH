import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse the request body
    const { message, zone, animation_type, duration } = await req.json()

    // Validate required fields
    if (!message || !zone || !animation_type || !duration) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: message, zone, animation_type, duration' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate animation_type
    const validAnimationTypes = ['fade', 'slide', 'drop']
    if (!validAnimationTypes.includes(animation_type)) {
      return new Response(
        JSON.stringify({ 
          error: `Invalid animation_type. Must be one of: ${validAnimationTypes.join(', ')}` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse zone (can be comma-separated string or array)
    let zoneArray: number[]
    if (typeof zone === 'string') {
      zoneArray = zone.split(',').map(z => parseInt(z.trim())).filter(z => !isNaN(z))
    } else if (Array.isArray(zone)) {
      zoneArray = zone.map(z => parseInt(z)).filter(z => !isNaN(z))
    } else {
      return new Response(
        JSON.stringify({ 
          error: 'Zone must be a comma-separated string or array of numbers' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (zoneArray.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'At least one valid zone number is required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate duration (must be positive integer)
    const durationMs = parseInt(duration)
    if (isNaN(durationMs) || durationMs <= 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Duration must be a positive integer (milliseconds)' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Insert the temporary message
    const { data, error } = await supabase
      .from('temporary_messages')
      .insert({
        message: message.toString(),
        zone: zoneArray,
        animation_type,
        duration: durationMs
      })
      .select()

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to insert message', details: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Temporary message created successfully',
        data: data[0]
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})