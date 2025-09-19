import { useEffect, useState } from 'react'
import { supabase, BannerProfile } from '../lib/supabase'
import LiveDisplayCanvas from '../components/LiveDisplayCanvas'

const DisplayPage = () => {
  const [activeProfile, setActiveProfile] = useState<BannerProfile | null>(null)
  const [, setLoading] = useState(true)
  const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null)

  // Remove body margins for full screen display
  useEffect(() => {
    document.body.style.margin = '0'
    document.body.style.padding = '0'
    document.body.style.overflow = 'hidden'
    document.body.style.background = '#000'
    
    return () => {
      document.body.style.margin = ''
      document.body.style.padding = ''
      document.body.style.overflow = ''
      document.body.style.background = ''
    }
  }, [])

  useEffect(() => {
    const fetchActiveProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('led_banner_settings')
          .select('*')
          .eq('is_active', true)
          .single()

        if (error) {
          console.error('Error fetching active profile:', error)
        } else {
          setActiveProfile(data)
          setLastUpdateTime(data?.updated_at || null)
        }
      } catch (err) {
        console.error('Failed to fetch active profile:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchActiveProfile()

    // Subscribe to changes in active profile
    const subscription = supabase
      .channel('led_banner_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'led_banner_settings',
        filter: 'is_active=eq.true'
      }, (payload) => {
        console.log('Active profile changed:', payload)
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
          const newProfile = payload.new as BannerProfile
          setActiveProfile(newProfile)
          setLastUpdateTime(newProfile.updated_at)
        }
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Smart polling fallback for OBS compatibility
  useEffect(() => {
    const pollForUpdates = async () => {
      try {
        const { data, error } = await supabase
          .from('led_banner_settings')
          .select('updated_at')
          .eq('is_active', true)
          .single()

        // Only refresh if we have a previous timestamp AND it has actually changed
        if (!error && data && lastUpdateTime && data.updated_at !== lastUpdateTime) {
          console.log(`Change detected: ${lastUpdateTime} → ${data.updated_at}`)
          console.log('Refreshing page to load new content...')
          window.location.reload()
        }
      } catch (err) {
        console.error('Polling error:', err)
      }
    }

    // Only start polling if we have an initial timestamp to compare against
    if (lastUpdateTime) {
      const interval = setInterval(pollForUpdates, 3000) // Poll every 3 seconds
      return () => clearInterval(interval)
    }
  }, [lastUpdateTime])


  return <LiveDisplayCanvas zones={activeProfile?.zones_data} />
}

export default DisplayPage