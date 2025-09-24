// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore  
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed. Use POST.' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse URL parameters
    const url = new URL(req.url)
    const zonesParam = url.searchParams.get('Zone')
    const message = url.searchParams.get('Msg')
    const duration = url.searchParams.get('Duration')
    const animation = url.searchParams.get('Anim') || 'fade'

    // Validate required parameters
    if (!zonesParam || !message || !duration) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters',
          required: ['Zone', 'Msg', 'Duration'],
          received: { Zone: zonesParam, Msg: message, Duration: duration },
          example: '/display?Zone=1,3,4&Msg=Emergency%20Exit&Duration=15&Anim=scroll'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse and validate zones
    const zones = zonesParam.split(',').map(z => parseInt(z.trim())).filter(z => !isNaN(z))
    
    if (zones.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid Zone parameter',
          message: 'Zone must contain valid numbers separated by commas',
          received: zonesParam,
          example: 'Zone=1,3,4 or Zone=2'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate zone IDs (1-4)
    const invalidZones = zones.filter(z => z < 1 || z > 4)
    if (invalidZones.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid zone IDs',
          message: 'Zone IDs must be between 1 and 4',
          invalidZones: invalidZones,
          received: zones
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate duration
    const durationSeconds = parseInt(duration)
    if (isNaN(durationSeconds) || durationSeconds <= 0 || durationSeconds > 300) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid duration',
          message: 'Duration must be a positive number up to 300 seconds',
          received: duration
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate animation
    const validAnimations = ['fade', 'slide', 'scroll', 'none']
    if (!validAnimations.includes(animation)) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid animation',
          message: `Animation must be one of: ${validAnimations.join(', ')}`,
          received: animation
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create Supabase client
    // @ts-ignore
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    // @ts-ignore
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Insert temporary message into database - simple insertion-based system
    const { data, error } = await supabase
      .from('temporary_messages')
      .insert({
        zones: zones,
        message: decodeURIComponent(message),
        duration: durationSeconds,
        animation: animation
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create temporary message',
          details: error.message
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Temporary message created successfully',
        data: {
          id: data.id,
          zones: data.zones,
          message: data.message,
          duration: data.duration,
          animation: data.animation
        }
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})