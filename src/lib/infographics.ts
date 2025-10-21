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

export interface DailyWeatherData {
  date: string
  weatherCode: number
  tempMin: number
  tempMax: number
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
const PARIS_COORDS = { lat: 48.8566, lon: 2.3522 }

export const get3DayWeatherForecast = async (): Promise<DailyWeatherData[]> => {
  try {
    // Using OpenMeteo API (free)
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${PARIS_COORDS.lat}&longitude=${PARIS_COORDS.lon}&daily=weather_code,temperature_2m_min,temperature_2m_max&timezone=Europe/Paris&forecast_days=3`
    )
    
    if (!response.ok) {
      throw new Error('Weather API failed')
    }
    
    const data = await response.json()
    const forecasts: DailyWeatherData[] = []
    
    for (let i = 0; i < 3; i++) {
      const date = new Date(data.daily.time[i])
      const dateOptions: Intl.DateTimeFormatOptions = { 
        weekday: i === 0 ? undefined : 'short',
        day: 'numeric', 
        month: 'short' 
      }
      
      let formattedDate = ''
      if (i === 0) {
        formattedDate = "Aujourd'hui : "
      } else if (i === 1) {
        formattedDate = "Demain :"
      } else {
        formattedDate = date.toLocaleDateString('fr-FR', dateOptions) + " :"
      }
      
      forecasts.push({
        date: formattedDate,
        weatherCode: data.daily.weather_code[i],
        tempMin: Math.round(data.daily.temperature_2m_min[i]),
        tempMax: Math.round(data.daily.temperature_2m_max[i]),
        icon: getWeatherIconFromCode(data.daily.weather_code[i])
      })
    }
    
    return forecasts
  } catch (error) {
    console.error('Weather API error:', error)
    // Fallback weather data
    return [
      {
        date: "Aujourd'hui :",
        weatherCode: 3,
        tempMin: 15,
        tempMax: 22,
        icon: '☁️'
      },
      {
        date: "Demain :", 
        weatherCode: 1,
        tempMin: 12,
        tempMax: 20,
        icon: '🌤️'
      },
      {
        date: "Après-demain :",
        weatherCode: 61,
        tempMin: 14,
        tempMax: 18,
        icon: '🌧️'
      }
    ]
  }
}

const getWeatherIconFromCode = (weatherCode: number): string => {
  // OpenMeteo weather codes mapping
  const codeMap: Record<number, string> = {
    0: '☀️',     // Clear sky
    1: '🌤️',     // Mainly clear
    2: '⛅',     // Partly cloudy
    3: '☁️',     // Overcast
    45: '🌫️',    // Fog
    48: '🌫️',    // Depositing rime fog
    51: '🌦️',    // Light drizzle
    53: '🌧️',    // Moderate drizzle
    55: '🌧️',    // Dense drizzle
    56: '🌧️',    // Light freezing drizzle
    57: '🌧️',    // Dense freezing drizzle
    61: '🌧️',    // Slight rain
    63: '🌧️',    // Moderate rain
    65: '🌧️',    // Heavy rain
    66: '🌧️',    // Light freezing rain
    67: '🌧️',    // Heavy freezing rain
    71: '❄️',    // Slight snow
    73: '❄️',    // Moderate snow
    75: '❄️',    // Heavy snow
    77: '❄️',    // Snow grains
    80: '🌦️',    // Slight rain showers
    81: '🌧️',    // Moderate rain showers
    82: '🌧️',    // Violent rain showers
    85: '❄️',    // Slight snow showers
    86: '❄️',    // Heavy snow showers
    95: '⛈️',    // Thunderstorm
    96: '⛈️',    // Thunderstorm with slight hail
    99: '⛈️'     // Thunderstorm with heavy hail
  }
  return codeMap[weatherCode] || '🌤️'
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

export interface CS2PlayerData {
  player_id: string
  pseudo: string
  matches_month: number
  winrate_month: number
  matches_week: number
  winrate_week: number
}

export const getCS2PlayerData = async (): Promise<CS2PlayerData[]> => {
  try {
    console.log('Attempting to fetch CS2 player data from cs_player_stats table...')

    // Import supabase from the main project (same as led_banner_settings)
    const { supabase } = await import('./supabase')

    const { data: playerData, error } = await supabase
      .from('cs_player_stats')
      .select('player_id, pseudo, matches_month, winrate_month, matches_week, winrate_week')
      .order('pseudo', { ascending: true })

    console.log('CS2 player data query result:', { data: playerData, error })

    if (error) {
      console.error('Detailed error fetching CS2 player data:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return []
    }

    if (!playerData || playerData.length === 0) {
      console.warn('CS2 player data table is empty or returned no data')
      return []
    }

    console.log(`Successfully fetched ${playerData.length} CS2 player data records`)
    return playerData
  } catch (error) {
    console.error('Exception while fetching CS2 player data:', error)
    return []
  }
}

export interface ValorantPlayerData {
  player_id: string
  player_name: string
  matches_month: number
  winrate_month: number
  matches_week: number
  winrate_week: number
  avg_kills_month: number
  avg_deaths_month: number
  kd_ratio_month: number
}

export const getValorantPlayerData = async (): Promise<ValorantPlayerData[]> => {
  try {
    console.log('Attempting to fetch Valorant player data from valorant_player_stats table...')

    // Import supabase from the main project (same as led_banner_settings)
    const { supabase } = await import('./supabase')

    const { data: playerData, error } = await supabase
      .from('valorant_player_stats')
      .select('player_id, player_name, matches_month, winrate_month, matches_week, winrate_week, avg_kills_month, avg_deaths_month, kd_ratio_month')
      .order('player_name', { ascending: true })

    console.log('Valorant player data query result:', { data: playerData, error })

    if (error) {
      console.error('Detailed error fetching Valorant player data:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return []
    }

    if (!playerData || playerData.length === 0) {
      console.warn('Valorant player data table is empty or returned no data')
      return []
    }

    console.log(`Successfully fetched ${playerData.length} Valorant player data records`)
    return playerData
  } catch (error) {
    console.error('Exception while fetching Valorant player data:', error)
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
    // 1. 3-day Weather forecast for Paris
    const weatherForecast = await get3DayWeatherForecast()
    
    // Add Paris header only once (French on top, English on bottom)
    elements.push({
      id: 'weather-header',
      type: 'weather',
      content: 'Météo Paris',
      color: '#00BFFF',
      duration: 3000,
      customData: {
        matchInfo: 'Météo Paris', // French on top
        dateInfo: 'Paris Weather' // English on bottom
      }
    })
    
    weatherForecast.forEach((forecast, index) => {
      elements.push({
        id: `weather-day-${index}`,
        type: 'weather',
        content: forecast.date, // This will be the main content
        color: '#00BFFF',
        duration: 4000,
        customData: {
          matchInfo: forecast.date, // Top line: date
          dateInfo: `${forecast.icon} ${forecast.tempMin}°/${forecast.tempMax}°C` // Bottom line: emoji and temps
        }
      })
    })

    // 4. Upcoming matches
    const matchesData = await getUpcomingMatches(3)
    if (matchesData.length > 0) {
      // Add matches header with sword emoji (French on top, English on bottom)
      elements.push({
        id: 'matches-header',
        type: 'match',
        content: 'Prochains matchs',
        color: '#EDEDED',
        duration: 4000,
        icon: '⚔️', // Sword emoji spanning both lines
        customData: {
          matchInfo: 'Prochains matchs', // French on top
          dateInfo: 'Next matches' // English on bottom
        }
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
      
      // Regular match display (no header integration)
      elements.push({
        id: `match-${match.id}`,
        type: 'match',
        content: matchInfo,
        color: game.secondary_color || '#FF6B35',
        imageUrl: game.colored_logo_url || game.dark_logo_url,
        duration: 5000,
        customData: {
          matchInfo,
          dateInfo
        }
      })
    })
    
    // 2. Clean facility reminder (French/English combined)
    elements.push({
      id: 'clean-reminder',
      type: 'clean-reminder',
      content: 'Merci de garder la Gaming House propre !',
      color: '#FFFFFF',
      duration: 5000,
      icon: '🧹', // Single emoji for both lines
      customData: {
        matchInfo: 'Merci de garder la Gaming House propre !', // French on top (no emoji)
        dateInfo: 'Please keep the Gaming House clean!' // English on bottom (no emoji)
      }
    })

    elements.push({
      id: 'lights-reminder',
      type: 'clean-reminder',
      content: 'Éteignez les lumières quand vous partez !',
      color: '#FFFF00',
      duration: 5000,
      icon: '💡', // Single emoji for both lines
      customData: {
        matchInfo: 'Éteignez les lumières quand vous partez !', // French on top (no emoji)
        dateInfo: 'Switch off lights when leaving!' // English on bottom (no emoji)
      }
    })
    
    // 3. Stay hydrated reminder (French/English combined) with Volvic bottle
    elements.push({
      id: 'hydration-reminder',
      type: 'hydration',
      content: 'Restez hydratés !',
      color: '#00CC00',
      duration: 5000,
      imageUrl: 'https://media.evianchezvous.com/media/catalog/product/cache/a40b1ffa2f2a502a78b9cb14b017380a/v/o/volvic_1_5l_1.png', // Volvic bottle image
      customData: {
        matchInfo: 'Restez hydratés ! Buvez de l\'eau régulièrement', // French on top (no emoji)
        dateInfo: 'Stay hydrated! Drink water regularly' // English on bottom (no emoji)
      }
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
      // Header for upcoming birthdays (French/English combined)
      elements.push({
        id: 'birthday-header',
        type: 'birthday',
        content: 'Prochains anniversaires',
        color: '#FFB6C1',
        duration: 4000,
        icon: '🎂', // Single emoji for both lines
        customData: {
          matchInfo: 'Prochains anniversaires', // French on top (no emoji)
          dateInfo: 'Upcoming birthdays' // English on bottom (no emoji)
        }
      })
      
      // Individual upcoming birthdays (name on top, date on bottom)
      upcomingBirthdays.forEach((player: Player & { daysUntil: number }) => {
        const birthDate = formatBirthday(player.birthDate)
        elements.push({
          id: `birthday-upcoming-${player.id}`,
          type: 'birthday',
          content: `${player.first_name} (${player.pseudo})`,
          color: '#FFB6C1',
          duration: 4000,
          customData: {
            matchInfo: `${player.first_name} (${player.pseudo})`, // Name on top
            dateInfo: `${birthDate}` // Date on bottom
          }
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
        content: 'Merci de garder la Gaming House propre !',
        color: '#32CD32',
        duration: 5000,
        icon: '🧹',
        customData: {
          matchInfo: 'Merci de garder la Gaming House propre !',
          dateInfo: 'Please keep the Gaming House clean!'
        }
      },
      {
        id: 'fallback-2',
        type: 'clean-reminder',
        content: 'Éteignez les lumières quand vous partez !',
        color: '#32CD32',
        duration: 5000,
        icon: '💡',
        customData: {
          matchInfo: 'Éteignez les lumières quand vous partez !',
          dateInfo: 'Switch off lights when leaving!'
        }
      },
      {
        id: 'fallback-3',
        type: 'hydration',
        content: 'Restez hydratés !',
        color: '#1E90FF',
        duration: 5000,
        imageUrl: 'https://media.evianchezvous.com/media/catalog/product/cache/a40b1ffa2f2a502a78b9cb14b017380a/v/o/volvic_1_5l_1.png',
        customData: {
          matchInfo: 'Restez hydratés ! Buvez de l\'eau régulièrement',
          dateInfo: 'Stay hydrated! Drink water regularly'
        }
      }
    )
  }
  
  return elements
}