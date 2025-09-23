import { supabase, BannerProfile, Zone } from './supabase'

export class ProfileService {
  static async getUserProfiles(userEmail: string): Promise<BannerProfile[]> {
    const { data, error } = await supabase
      .from('led_banner_settings')
      .select('*')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching profiles:', error)
      throw error
    }

    return data || []
  }

  static async getAllProfiles(): Promise<BannerProfile[]> {
    const { data, error } = await supabase
      .from('led_banner_settings')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching all profiles:', error)
      throw error
    }

    return data || []
  }

  static async saveProfile(userEmail: string, profileName: string, zones: Zone[]): Promise<BannerProfile> {
    const { data, error } = await supabase
      .from('led_banner_settings')
      .upsert({
        user_email: userEmail,
        profile_name: profileName,
        zones_data: zones,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_email,profile_name'
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving profile:', error)
      throw error
    }

    return data
  }

  static async updateProfileById(profileId: string, profileName: string, zones: Zone[]): Promise<BannerProfile> {
    const { data, error } = await supabase
      .from('led_banner_settings')
      .update({
        profile_name: profileName,
        zones_data: zones,
        updated_at: new Date().toISOString()
      })
      .eq('id', profileId)
      .select()
      .single()

    if (error) {
      console.error('Error updating profile:', error)
      throw error
    }

    return data
  }

  static async deleteProfile(userEmail: string, profileName: string): Promise<void> {
    const { error } = await supabase
      .from('led_banner_settings')
      .delete()
      .eq('user_email', userEmail)
      .eq('profile_name', profileName)

    if (error) {
      console.error('Error deleting profile:', error)
      throw error
    }
  }

  static async activateProfile(profileId: string): Promise<void> {
    try {
      // Get current user for logging purposes
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) {
        throw new Error('User not authenticated')
      }

      console.log('User email:', user.email)
      console.log('Activating profile ID:', profileId)

      // First, verify the profile exists
      const { data: targetProfile, error: fetchError } = await supabase
        .from('led_banner_settings')
        .select('*')
        .eq('id', profileId)
        .single()

      if (fetchError) {
        console.error('Error fetching target profile:', fetchError)
        throw new Error(`Profile not found: ${fetchError.message}`)
      }

      if (!targetProfile) {
        throw new Error('Profile not found')
      }

      console.log('Target profile found:', targetProfile.profile_name, 'by user:', targetProfile.user_email)

      // Deactivate ALL profiles (from all users)
      const { error: deactivateError } = await supabase
        .from('led_banner_settings')
        .update({ is_active: false })
        .eq('is_active', true) // Only update profiles that are currently active

      if (deactivateError) {
        console.error('Error deactivating all profiles:', deactivateError)
        throw new Error(`Failed to deactivate profiles: ${deactivateError.message}`)
      }

      console.log('All profiles deactivated')

      // Activate the target profile
      const { error: activateError } = await supabase
        .from('led_banner_settings')
        .update({ 
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', profileId)

      if (activateError) {
        console.error('Error activating profile:', activateError)
        throw new Error(`Failed to activate profile: ${activateError.message}`)
      }

      console.log('Profile activated successfully')

    } catch (error) {
      console.error('Profile activation failed:', error)
      throw error
    }
  }

  static async getActiveProfile(): Promise<BannerProfile | null> {
    const { data, error } = await supabase
      .from('led_banner_settings')
      .select('*')
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching active profile:', error)
      throw error
    }

    return data || null
  }
}