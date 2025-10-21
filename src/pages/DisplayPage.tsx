import { useEffect, useState } from 'react'
import { supabase, BannerProfile, isInNightMode } from '../lib/supabase'
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

    // Test if we can read cs_player_stats table
    const testCS2Access = async () => {
      try {
        console.log('🧪 Testing access to cs_player_stats table...')
        const { data, error } = await supabase
          .from('cs_player_stats')
          .select('*')
          .limit(1)
        
        if (error) {
          console.error('❌ Cannot access cs_player_stats:', error)
        } else {
          console.log('✅ cs_player_stats accessible, sample data:', data)
        }
      } catch (err) {
        console.error('❌ Exception accessing cs_player_stats:', err)
      }
    }

    testCS2Access()

    // Subscribe to changes in active profile
    console.log('Setting up real-time subscriptions...')
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
      .subscribe((status, err) => {
        console.log('📡 Banner subscription status:', status)
        if (err) {
          console.error('❌ Banner subscription error:', err)
        }
      })

    // Separate subscription for CS2 player stats to avoid conflicts
    console.log('Setting up CS2 stats subscription...')
    const cs2Subscription = supabase
      .channel('cs2_stats_changes') // Different channel name
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'valorant_player_stats'
      }, (payload) => {
        console.log('🎯 CS2 player stats changed - FULL PAYLOAD:', JSON.stringify(payload, null, 2))
        console.log('🎯 Event type:', payload.eventType)
        console.log('🎯 Table:', payload.table)
        console.log('🎯 Schema:', payload.schema)
        console.log('🔄 CS2 stats updated, refreshing display...')
        window.location.reload()
      })
      .subscribe((status, err) => {
        console.log('📡 CS2 subscription status:', status)
        if (err) {
          console.error('❌ CS2 subscription error:', err)
        }
        if (status === 'SUBSCRIBED') {
          console.log('✅ CS2 subscription active')
        }
      })

    return () => {
      subscription.unsubscribe()
      cs2Subscription.unsubscribe()
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

  // Daily auto-refresh at midnight for fresh weather data and birthdays
  useEffect(() => {
    const scheduleMidnightRefresh = () => {
      const now = new Date()
      const midnight = new Date()
      midnight.setHours(24, 0, 1, 0) // Next day at 00:00:01
      
      const timeUntilMidnight = midnight.getTime() - now.getTime()
      
      console.log(`⏰ Scheduling midnight refresh in ${Math.round(timeUntilMidnight / 1000 / 60)} minutes`)
      
      const timeoutId = setTimeout(() => {
        console.log('🌅 Midnight refresh triggered - refreshing for new day data...')
        window.location.reload()
      }, timeUntilMidnight)
      
      return timeoutId
    }

    // Schedule the first midnight refresh
    const timeoutId = scheduleMidnightRefresh()
    
    // Set up daily interval (every 24 hours) starting from the first midnight
    const intervalId = setInterval(() => {
      console.log('🌅 Daily midnight refresh - refreshing for new day data...')
      window.location.reload()
    }, 24 * 60 * 60 * 1000) // 24 hours

    return () => {
      clearTimeout(timeoutId)
      clearInterval(intervalId)
    }
  }, [])

  // Schedule night mode refreshes
  useEffect(() => {
    if (!activeProfile || !activeProfile.night_mode || !activeProfile.night_mode.enabled) {
      return
    }

    const { startHour, startMinute, endHour, endMinute, endNextDay } = activeProfile.night_mode

    const scheduleNightModeRefresh = (targetHour: number, targetMinute: number, isNextDay: boolean = false) => {
      const now = new Date()
      const target = new Date()
      
      if (isNextDay) {
        target.setDate(target.getDate() + 1)
      }
      
      target.setHours(targetHour, targetMinute, 0, 0)
      
      // If target time has already passed today and it's not next day, schedule for tomorrow
      if (target.getTime() <= now.getTime() && !isNextDay) {
        target.setDate(target.getDate() + 1)
      }
      
      const timeUntilTarget = target.getTime() - now.getTime()
      
      console.log(`⏰ Scheduling night mode refresh for ${target.toLocaleTimeString()} (in ${Math.round(timeUntilTarget / 1000 / 60)} minutes)`)
      
      const timeoutId = setTimeout(() => {
        console.log('🌙 Night mode refresh triggered - refreshing display...')
        window.location.reload()
      }, timeUntilTarget)
      
      return timeoutId
    }

    const timeouts: NodeJS.Timeout[] = []

    // Schedule start time refresh
    timeouts.push(scheduleNightModeRefresh(startHour, startMinute))
    
    // Schedule end time refresh
    if (endNextDay) {
      // End time is next day
      timeouts.push(scheduleNightModeRefresh(endHour, endMinute, true))
    } else {
      // End time is same day
      timeouts.push(scheduleNightModeRefresh(endHour, endMinute))
    }

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout))
    }
  }, [activeProfile])

  // Check if we're in night mode and should show black screen
  const isNight = activeProfile && isInNightMode(activeProfile.night_mode)
  
  if (isNight) {
    return (
      <div style={{ 
        width: '100vw', 
        height: '100vh', 
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Completely black screen for energy saving */}
      </div>
    )
  }

  return <LiveDisplayCanvas zones={activeProfile?.zones_data} />
}

export default DisplayPage