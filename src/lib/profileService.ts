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
    // First, deactivate all profiles
    await supabase
      .from('led_banner_settings')
      .update({ is_active: false })
      .neq('id', 'never-matches') // Update all rows

    // Then activate the selected profile
    const { error } = await supabase
      .from('led_banner_settings')
      .update({ is_active: true })
      .eq('id', profileId)

    if (error) {
      console.error('Error activating profile:', error)
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