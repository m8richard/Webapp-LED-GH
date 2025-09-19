import { createClient } from '@supabase/supabase-js'

// Gentle Mates Supabase connection
const GM_SUPABASE_URL = 'https://gmrxbbhhyyrtmsftofdp.supabase.co'
const GM_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtcnhiYmhoeXlydG1zZnRvZmRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDc0MDAxNTEsImV4cCI6MjAyMjk3NjE1MX0.JYVVlCII2iL97cevWvQi0Hlz0Gt_nZjonb9ApnNDscc'

const gmSupabase = createClient(GM_SUPABASE_URL, GM_SUPABASE_ANON_KEY)

export interface InfographicElement {
  id: string
  type: 'weather' | 'clean-reminder' | 'hydration' | 'match' | 'birthday'
  content: string
  icon?: string
  color?: string
  duration?: number // ms to display this element
  imageUrl?: string // For game logos or other images
  customData?: {
    matchInfo?: string
    dateInfo?: string
  }
}

export interface WeatherData {
  temperature: number
  description: string
  icon: string
}

export interface Match {
  id: number
  name: string
  live_datetime: string
  team_a_id?: number
  team_b_id?: number
  game_id: number
  twitch_live_link?: string
}

export interface Game {
  id: number
  name: string
  dark_logo_url?: string
  colored_logo_url?: string
  secondary_color?: string
}

export interface Team {
  id: number
  name: string
  dark_logo_url?: string
}

export interface Player {
  id: number
  pseudo: string
  first_name: string
  birthDate: string
  game_id: number
  player_image_url?: string
}

// Weather API (using free OpenWeatherMap)
const WEATHER_API_KEY = '7f7b8c5e9d7e8f3c2d6b4a1e8f5c9d2a' // You'll need to replace with actual API key
const PARIS_COORDS = { lat: 48.8566, lon: 2.3522 }

export const getWeatherData = async (): Promise<WeatherData | null> => {
  try {
    // Using OpenWeatherMap API (free tier)
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${PARIS_COORDS.lat}&lon=${PARIS_COORDS.lon}&appid=${WEATHER_API_KEY}&units=metric&lang=fr`
    )
    
    if (!response.ok) {
      throw new Error('Weather API failed')
    }
    
    const data = await response.json()
    
    return {
      temperature: Math.round(data.main.temp),
      description: data.weather[0].description,
      icon: getWeatherIcon(data.weather[0].icon)
    }
  } catch (error) {
    console.error('Weather API error:', error)
    // Fallback weather data
    return {
      temperature: 18,
      description: 'nuageux',
      icon: '☁️'
    }
  }
}

const getWeatherIcon = (iconCode: string): string => {
  const iconMap: Record<string, string> = {
    '01d': '☀️', '01n': '🌙',
    '02d': '⛅', '02n': '☁️',
    '03d': '☁️', '03n': '☁️',
    '04d': '☁️', '04n': '☁️',
    '09d': '🌧️', '09n': '🌧️',
    '10d': '🌦️', '10n': '🌧️',
    '11d': '⛈️', '11n': '⛈️',
    '13d': '❄️', '13n': '❄️',
    '50d': '🌫️', '50n': '🌫️'
  }
  return iconMap[iconCode] || '🌤️'
}

export const getUpcomingMatches = async (limit: number = 5): Promise<{ match: Match, game: Game, teamA?: Team, teamB?: Team }[]> => {
  try {
    const now = new Date().toISOString()
    
    const { data: matches, error: matchError } = await gmSupabase
      .from('matches')
      .select('*')
      .gt('live_datetime', now)
      .order('live_datetime', { ascending: true })
      .limit(limit)
    
    if (matchError) {
      console.error('Error fetching matches:', matchError)
      return []
    }
    
    const matchesWithDetails = await Promise.all(
      (matches || []).map(async (match) => {
        // Fetch game details
        const { data: game } = await gmSupabase
          .from('games')
          .select('*')
          .eq('id', match.game_id)
          .single()
        
        // Fetch team details if they exist
        let teamA, teamB
        if (match.team_a_id) {
          const { data } = await gmSupabase
            .from('teams')
            .select('*')
            .eq('id', match.team_a_id)
            .single()
          teamA = data
        }
        
        if (match.team_b_id) {
          const { data } = await gmSupabase
            .from('teams')
            .select('*')
            .eq('id', match.team_b_id)
            .single()
          teamB = data
        }
        
        return {
          match,
          game: game || { id: 0, name: 'Unknown Game' },
          teamA,
          teamB
        }
      })
    )
    
    return matchesWithDetails
  } catch (error) {
    console.error('Error fetching matches:', error)
    return []
  }
}

export const getBirthdayInfo = async (): Promise<{ todayBirthdays: Player[], upcomingBirthdays: (Player & { daysUntil: number })[] }> => {
  try {
    const { data: players, error } = await gmSupabase
      .from('players')
      .select('*')
      .not('birthDate', 'is', null) as { data: Player[] | null, error: any }
    
    if (error) {
      console.error('Error fetching players:', error)
      return { todayBirthdays: [], upcomingBirthdays: [] }
    }
    
    const today = new Date()
    const todayBirthdays: Player[] = []
    const upcomingBirthdays: (Player & { daysUntil: number })[] = []
    
    const playersArray: Player[] = players || []
    playersArray.forEach((player: Player) => {
      const birthDate = new Date(player.birthDate)
      const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())
      
      // If birthday already passed this year, check next year
      if (thisYearBirthday < today) {
        thisYearBirthday.setFullYear(today.getFullYear() + 1)
      }
      
      const daysUntil = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysUntil === 0) {
        todayBirthdays.push(player)
      } else {
        upcomingBirthdays.push({ ...player, daysUntil })
      }
    })
    
    // Sort upcoming birthdays by days until
    upcomingBirthdays.sort((a, b) => a.daysUntil - b.daysUntil)
    
    return {
      todayBirthdays,
      upcomingBirthdays: upcomingBirthdays.slice(0, 3) // Next 3 birthdays
    }
  } catch (error) {
    console.error('Error fetching birthday info:', error)
    return { todayBirthdays: [], upcomingBirthdays: [] }
  }
}

export const formatDateTime = (dateTimeStr: string): { date: string, time: string } => {
  const dateObj = new Date(dateTimeStr)
  const now = new Date()
  
  const isToday = dateObj.getDate() === now.getDate() &&
                  dateObj.getMonth() === now.getMonth() &&
                  dateObj.getFullYear() === now.getFullYear()
  
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const isTomorrow = dateObj.getDate() === tomorrow.getDate() &&
                     dateObj.getMonth() === tomorrow.getMonth() &&
                     dateObj.getFullYear() === tomorrow.getFullYear()
  
  let formattedDate
  if (isToday) {
    formattedDate = "Aujourd'hui"
  } else if (isTomorrow) {
    formattedDate = "Demain"
  } else {
    const dateOptions: Intl.DateTimeFormatOptions = { 
      weekday: "long", 
      day: "numeric", 
      month: "long" 
    }
    formattedDate = dateObj.toLocaleDateString("fr-FR", dateOptions)
    formattedDate = formattedDate.split(" ").map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(" ")
  }
  
  const hours = dateObj.getHours()
  const minutes = dateObj.getMinutes()
  const formattedTime = `${hours.toString().padStart(2, "0")}H${minutes.toString().padStart(2, "0")}`
  
  return { date: formattedDate, time: formattedTime }
}

export const formatBirthday = (birthDate: string): string => {
  const date = new Date(birthDate)
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' }
  return date.toLocaleDateString('fr-FR', options)
}

export const generateInfographicElements = async (): Promise<InfographicElement[]> => {
  const elements: InfographicElement[] = []
  
  try {
    // 1. Weather in Paris
    const weather = await getWeatherData()
    if (weather) {
      elements.push({
        id: 'weather',
        type: 'weather',
        content: `Paris ${weather.icon} ${weather.temperature}°C • ${weather.description}`,
        color: '#00BFFF',
        duration: 4000
      })
    }
    
    // 2. Clean facility reminder (French then English)
    elements.push({
      id: 'clean-fr',
      type: 'clean-reminder',
      content: '🧹 Merci de garder la Gaming House propre !',
      color: '#32CD32',
      duration: 4000
    })

    elements.push({
      id: 'lights-fr',
      type: 'clean-reminder',
      content: '💡 Éteignez les lumières quand vous partez !',
      color: '#32CD32',
      duration: 4000
    })
    
    elements.push({
      id: 'clean-en',
      type: 'clean-reminder',
      content: '🧹 Please keep the Gaming House clean!',
      color: '#32CD32',
      duration: 4000
    })

    elements.push({
      id: 'lights-en',
      type: 'clean-reminder',
      content: '💡 Switch off lights when leaving!',
      color: '#32CD32',
      duration: 4000
    })
    
    // 3. Stay hydrated reminder (French then English)
    elements.push({
      id: 'hydration-fr',
      type: 'hydration',
      content: '💧 Restez hydratés ! Buvez de l\'eau régulièrement',
      color: '#1E90FF',
      duration: 4000
    })
    
    elements.push({
      id: 'hydration-en',
      type: 'hydration',
      content: '💧 Stay hydrated! Drink water regularly',
      color: '#1E90FF',
      duration: 4000
    })
    
    // 4. Upcoming matches
    const matchesData = await getUpcomingMatches(3)
    if (matchesData.length > 0) {
      // Add matches header
      elements.push({
        id: 'matches-header',
        type: 'match',
        content: 'Prochains matchs / Next matches :',
        color: '#000000',
        duration: 4000
      })
    }
    
    matchesData.forEach((matchData) => {
      const { match, game, teamA, teamB } = matchData
      const { date, time } = formatDateTime(match.live_datetime)
      
      let matchInfo = ''
      if (teamA && teamB) {
        matchInfo = `${teamA.name} vs ${teamB.name}`
      } else {
        matchInfo = match.name
      }
      
      const dateInfo = `${date} ${time}`
      
      // Create a combined element with structured data for custom rendering
      elements.push({
        id: `match-${match.id}`,
        type: 'match',
        content: matchInfo,
        color: game.secondary_color || '#FF6B35',
        imageUrl: game.colored_logo_url || game.dark_logo_url,
        duration: 5000,
        // Add custom data for multi-line rendering
        customData: {
          matchInfo,
          dateInfo
        }
      })
    })
    
    // 5. Birthday information
    const { todayBirthdays, upcomingBirthdays } = await getBirthdayInfo()
    
    // Today's birthdays
    todayBirthdays.forEach((player: Player) => {
      elements.push({
        id: `birthday-today-${player.id}`,
        type: 'birthday',
        content: `🎂 HAPPY BIRTHDAY ${player.first_name} (${player.pseudo}) !!`,
        color: '#FF69B4',
        duration: 6000
      })
    })
    
    // Upcoming birthdays - grouped together
    if (upcomingBirthdays.length > 0) {
      // Header for upcoming birthdays
      elements.push({
        id: 'birthday-header',
        type: 'birthday',
        content: '🎂 Prochains anniversaires / Upcoming birthdays :',
        color: '#FFB6C1',
        duration: 4000
      })
      
      // Individual upcoming birthdays
      upcomingBirthdays.forEach((player: Player & { daysUntil: number }) => {
        const birthDate = formatBirthday(player.birthDate)
        elements.push({
          id: `birthday-upcoming-${player.id}`,
          type: 'birthday',
          content: `${player.first_name} (${player.pseudo}) • ${birthDate}`,
          color: '#FFB6C1',
          duration: 3000
        })
      })
    }
    
  } catch (error) {
    console.error('Error generating infographic elements:', error)
  }
  
  // Fallback elements if API calls fail
  if (elements.length === 0) {
    elements.push(
      {
        id: 'fallback-1',
        type: 'clean-reminder',
        content: '🧹 Merci de garder la Gaming House propre !',
        color: '#32CD32',
        duration: 4000
      },
      {
        id: 'fallback-2',
        type: 'clean-reminder',
        content: '💡 Éteignez les lumières quand vous partez !',
        color: '#32CD32',
        duration: 4000
      },
      {
        id: 'fallback-3',
        type: 'clean-reminder',
        content: '🧹 Please keep the Gaming House clean!',
        color: '#32CD32',
        duration: 4000
      },
      {
        id: 'fallback-4',
        type: 'clean-reminder',
        content: '💡 Switch off lights when leaving!',
        color: '#32CD32',
        duration: 4000
      },
      {
        id: 'fallback-5',
        type: 'hydration',
        content: '💧 Restez hydratés ! Buvez de l\'eau régulièrement 🚰',
        color: '#1E90FF',
        duration: 4000
      },
      {
        id: 'fallback-6',
        type: 'hydration',
        content: '💧 Stay hydrated! Drink water regularly 🚰',
        color: '#1E90FF',
        duration: 4000
      }
    )
  }
  
  return elements
}