import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gpcfhhwasgnzvhnnaogq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwY2ZoaHdhc2duenZobm5hb2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM3NTU0NDQsImV4cCI6MjA0OTMzMTQ0NH0.eAzt808DeExoGDPtQbjQ362Q2S8g2y8VHxzJmJPPAOw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    redirectTo: `${window.location.origin}`,
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

export interface Zone {
  id: number
  text: string
  color: string
  speed: number
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
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/dashboard`
    }
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}