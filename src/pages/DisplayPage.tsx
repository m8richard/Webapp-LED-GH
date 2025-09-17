import { useEffect, useState } from 'react'
import { supabase, BannerProfile } from '../lib/supabase'
import LiveDisplayCanvas from '../components/LiveDisplayCanvas'

const DisplayPage = () => {
  const [activeProfile, setActiveProfile] = useState<BannerProfile | null>(null)
  const [loading, setLoading] = useState(true)

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

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: '#000',
        color: 'white' 
      }}>
        <div>Loading display...</div>
      </div>
    )
  }

  if (!activeProfile) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: '#000',
        color: 'white',
        textAlign: 'center'
      }}>
        <div>
          <h2>No Active Banner Profile</h2>
          <p>Please activate a banner profile from the dashboard.</p>
        </div>
      </div>
    )
  }

  return <LiveDisplayCanvas zones={activeProfile.zones_data} />
}

export default DisplayPage