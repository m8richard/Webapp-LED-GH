import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gpcfhhwasgnzvhnnaogq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwY2ZoaHdhc2duenZobm5hb2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM3NTU0NDQsImV4cCI6MjA0OTMzMTQ0NH0.eAzt808DeExoGDPtQbjQ362Q2S8g2y8VHxzJmJPPAOw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true
  }
})

// Database types
export interface NightMode {
  enabled: boolean
  startHour: number
  startMinute: number
  endHour: number
  endMinute: number
  endNextDay: boolean
}

export interface TemporaryMessage {
  id: string
  message: string
  zone: number[]
  animation_type: 'fade' | 'slide' | 'drop'
  duration: number
  created_at: string
}

export interface ActiveMessage {
  id: string
  message: string
  zoneId: number
  animation_type: 'fade' | 'slide' | 'drop'
  duration: number
  startTime: number
  isAnimatingIn: boolean
  isAnimatingOut: boolean
}

export interface BannerProfile {
  id: string
  user_email: string
  profile_name: string
  zones_data: Zone[]
  night_mode?: NightMode
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
  backgroundMode?: 'contain' | 'cover' | 'fill' | 'stretch' | 'no-resizing' // defaults to 'contain'
  font?: string // defaults to 'HelveticaBoldExtended'
  displayMode?: 'text' | 'infographics' | 'cs2-data' // defaults to 'text'
  forceUppercase?: boolean // defaults to false - forces all text to uppercase
}

// Helper functions
export const isValidGentlematesEmail = (email: string): boolean => {
  return true // Temporarily disabled - any email allowed
  // return email.endsWith('@gentlemates.com')
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

// Utility function to check if current time is within night mode hours
export const isInNightMode = (nightMode?: NightMode): boolean => {
  if (!nightMode || !nightMode.enabled) {
    return false
  }

  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  
  const { startHour, startMinute, endHour, endMinute, endNextDay } = nightMode
  const startMinutes = startHour * 60 + startMinute
  const endMinutes = endHour * 60 + endMinute
  
  if (!endNextDay) {
    // Same day: start and end on same day
    return currentMinutes >= startMinutes && currentMinutes < endMinutes
  } else {
    // Cross midnight: start today, end tomorrow
    return currentMinutes >= startMinutes || currentMinutes < endMinutes
  }
}

// Utility function to validate night mode
export const validateNightMode = (nightMode: NightMode): string | null => {
  if (!nightMode.enabled) {
    return null // No validation needed if disabled
  }
  
  const startMinutes = nightMode.startHour * 60 + nightMode.startMinute
  const endMinutes = nightMode.endHour * 60 + nightMode.endMinute
  
  if (!nightMode.endNextDay) {
    // Same day: start must be before end
    if (startMinutes >= endMinutes) {
      return 'Start time must be before end time on the same day'
    }
  } else {
    // Cross midnight: start must not equal end (would be 24 hours)
    if (startMinutes === endMinutes) {
      return 'Start time cannot equal end time when crossing days'
    }
  }
  
  return null // Valid
}