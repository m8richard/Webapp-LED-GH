import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gpcfhhwasgnzvhnnaogq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwY2ZoaHdhc2duenZobm5hb2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM3NTU0NDQsImV4cCI6MjA0OTMzMTQ0NH0.eAzt808DeExoGDPtQbjQ362Q2S8g2y8VHxzJmJPPAOw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true
  }
})

// Database types
export interface BannerProfile {
  id: string
  user_email: string
  profile_name: string
  zones_data: Zone[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SubZone {
  text: string
  color: string
  speed: number
  font?: string
}

export interface Zone {
  id: number
  text: string
  color: string
  speed: number
  // New fields for enhanced functionality (optional with defaults)
  lineMode?: 'single' | 'double' // defaults to 'single'
  subZone?: SubZone // For second line when lineMode is 'double'
  backgroundType?: 'none' | 'image' | 'video' // defaults to 'none'
  backgroundUrl?: string
  backgroundMode?: 'contain' | 'cover' | 'fill' | 'stretch' // defaults to 'contain'
  font?: string // defaults to 'HelveticaBoldExtended'
  displayMode?: 'text' | 'infographics' | 'cs2-data' // defaults to 'text'
  forceUppercase?: boolean // defaults to false - forces all text to uppercase
}

// Helper functions
export const isValidGentlematesEmail = (email: string): boolean => {
  return email.endsWith('@gentlemates.com')
}

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const signInWithGoogle = async () => {
  // Use environment variable for production URL, fallback to current origin for local dev
  const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${baseUrl}/dashboard`
    }
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}