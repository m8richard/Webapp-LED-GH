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
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) {
        throw new Error('User not authenticated')
      }

      console.log('User email:', user.email)
      console.log('Activating profile ID:', profileId)

      // First, verify the profile exists and belongs to the user
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

      if (targetProfile.user_email !== user.email) {
        throw new Error('Access denied: Profile belongs to another user')
      }

      console.log('Target profile found:', targetProfile.profile_name)

      // Deactivate all of the current user's profiles
      const { error: deactivateError } = await supabase
        .from('led_banner_settings')
        .update({ is_active: false })
        .eq('user_email', user.email)

      if (deactivateError) {
        console.error('Error deactivating user profiles:', deactivateError)
        throw new Error(`Failed to deactivate profiles: ${deactivateError.message}`)
      }

      console.log('User profiles deactivated')

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