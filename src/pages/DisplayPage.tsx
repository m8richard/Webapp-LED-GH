import { useEffect, useState } from 'react'
import { supabase, BannerProfile } from '../lib/supabase'
import LiveDisplayCanvas from '../components/LiveDisplayCanvas'

const DisplayPage = () => {
  const [activeProfile, setActiveProfile] = useState<BannerProfile | null>(null)
  const [, setLoading] = useState(true)

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
          setActiveProfile(payload.new as BannerProfile)
        }
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return <LiveDisplayCanvas zones={activeProfile?.zones_data} />
}

export default DisplayPage