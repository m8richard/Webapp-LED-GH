import { useEffect, useRef, useState } from 'react'
import { Zone } from '../lib/supabase'
import { loadAllFonts, getFontFamily } from '../lib/fonts'
import { generateInfographicElements, InfographicElement, getCS2PlayerData, CS2PlayerData } from '../lib/infographics'

interface LiveDisplayCanvasProps {
  zones?: Zone[]
}

const LiveDisplayCanvas = ({ zones: propZones }: LiveDisplayCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const scrollOffsetsRef = useRef<number[]>([0, 0, 0, 0])
  const subScrollOffsetsRef = useRef<number[]>([0, 0, 0, 0])
  const lastTimeRef = useRef<number>(0)
  const [isAnimating] = useState(true)
  const backgroundElementsRef = useRef<Map<string, HTMLImageElement | HTMLVideoElement>>(new Map())
  const infographicElementsRef = useRef<Record<number, InfographicElement[]>>({})
  const currentInfographicRef = useRef<Record<number, number>>({})
  const infographicTimerRef = useRef<Record<number, number>>({})
  const logoImagesRef = useRef<Map<string, HTMLImageElement>>(new Map())
  const cs2PlayerDataRef = useRef<Record<number, CS2PlayerData[]>>({})
  
  const defaultZones: Zone[] = [
    { id: 1, text: 'ZONE 1 👾', color: '#ff00ec', speed: 2, lineMode: 'single', backgroundType: 'none', backgroundMode: 'contain', font: 'HelveticaBoldExtended', displayMode: 'text' },
    { id: 2, text: 'ZONE 2 👀', color: '#ff00ec', speed: 1.5, lineMode: 'single', backgroundType: 'none', backgroundMode: 'contain', font: 'HelveticaBoldExtended', displayMode: 'text' },
    { id: 3, text: 'ZONE 3 🚀', color: '#ff00ec', speed: 2.5, lineMode: 'single', backgroundType: 'none', backgroundMode: 'contain', font: 'HelveticaBoldExtended', displayMode: 'text' },
    { id: 4, text: 'ZONE 4 🌍', color: '#ff00ec', speed: 1.8, lineMode: 'single', backgroundType: 'none', backgroundMode: 'contain', font: 'HelveticaBoldExtended', displayMode: 'text' }
  ]

  const zones = propZones || defaultZones

  const CANVAS_WIDTH = 1056
  const CANVAS_HEIGHT = 384
  const ZONE_HEIGHT = 96

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Load all fonts
    loadAllFonts().catch(console.error)

    // Initialize infographics for zones in infographics mode
    const initializeInfographics = async () => {
      for (const zone of zones) {
        if (zone.displayMode === 'infographics') {
          try {
            const elements = await generateInfographicElements()
            infographicElementsRef.current[zone.id] = elements
            currentInfographicRef.current[zone.id] = 0
            infographicTimerRef.current[zone.id] = Date.now()
          } catch (error) {
            console.error(`Error initializing infographics for zone ${zone.id}:`, error)
          }
        }
      }
    }

    // Initialize CS2 player data for zones in CS2 data mode
    const initializeCS2Data = async () => {
      for (const zone of zones) {
        if (zone.displayMode === 'cs2-data') {
          try {
            console.log('Initializing CS2 data for LiveDisplay zone', zone.id)
            const playerData = await getCS2PlayerData()
            cs2PlayerDataRef.current[zone.id] = playerData
            console.log('CS2 player data loaded for LiveDisplay zone', zone.id, ':', playerData)
          } catch (error) {
            console.error(`Error initializing CS2 data for zone ${zone.id}:`, error)
          }
        }
      }
    }

    initializeInfographics()
    initializeCS2Data()

    const loadBackgroundElement = (zone: Zone): Promise<HTMLImageElement | HTMLVideoElement | null> => {
      return new Promise((resolve) => {
        if (zone.backgroundType === 'none' || !zone.backgroundUrl) {
          resolve(null)
          return
        }

        const cacheKey = `${zone.id}-${zone.backgroundUrl}`
        const cached = backgroundElementsRef.current.get(cacheKey)
        if (cached) {
          resolve(cached)
          return
        }

        if (zone.backgroundType === 'image') {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.onload = () => {
            backgroundElementsRef.current.set(cacheKey, img)
            resolve(img)
          }
          img.onerror = () => resolve(null)
          img.src = zone.backgroundUrl
        } else if (zone.backgroundType === 'video') {
          const video = document.createElement('video')
          video.crossOrigin = 'anonymous'
          video.muted = true
          video.loop = true
          video.oncanplay = () => {
            video.play().catch(console.error)
            backgroundElementsRef.current.set(cacheKey, video)
            resolve(video)
          }
          video.onerror = () => resolve(null)
          video.src = zone.backgroundUrl
        }
      })
    }

    const drawBackground = async (zone: Zone, bgX: number, bgY: number, bgWidth: number, bgHeight: number) => {
      if ((zone.backgroundType || 'none') === 'none' || !zone.backgroundUrl) {
        ctx.fillStyle = '#000000'
        ctx.fillRect(bgX, bgY, bgWidth, bgHeight)
        return
      }

      const bgElement = await loadBackgroundElement(zone)
      if (!bgElement || !(bgElement instanceof HTMLImageElement || bgElement instanceof HTMLVideoElement)) {
        ctx.fillStyle = '#000000'
        ctx.fillRect(bgX, bgY, bgWidth, bgHeight)
        return
      }

      // Get media dimensions
      const mediaWidth = bgElement instanceof HTMLImageElement ? bgElement.naturalWidth : bgElement.videoWidth
      const mediaHeight = bgElement instanceof HTMLImageElement ? bgElement.naturalHeight : bgElement.videoHeight
      const mediaRatio = mediaWidth / mediaHeight
      const targetRatio = bgWidth / bgHeight
      
      // Fill background with black first
      ctx.fillStyle = '#000000'
      ctx.fillRect(bgX, bgY, bgWidth, bgHeight)
      
      // Set up clipping to ensure background stays within bounds
      ctx.save()
      ctx.beginPath()
      ctx.rect(bgX, bgY, bgWidth, bgHeight)
      ctx.clip()
      
      let drawWidth, drawHeight, drawX, drawY
      const mode = zone.backgroundMode || 'contain'
      
      switch (mode) {
        case 'contain':
          // Fit entire media within area, maintain aspect ratio
          if (mediaRatio > targetRatio) {
            drawWidth = bgWidth
            drawHeight = bgWidth / mediaRatio
            drawX = bgX
            drawY = bgY + (bgHeight - drawHeight) / 2
          } else {
            drawHeight = bgHeight
            drawWidth = bgHeight * mediaRatio
            drawX = bgX + (bgWidth - drawWidth) / 2
            drawY = bgY
          }
          break
          
        case 'cover':
          // Fill entire area, maintain aspect ratio, may crop
          if (mediaRatio > targetRatio) {
            drawHeight = bgHeight
            drawWidth = bgHeight * mediaRatio
            drawX = bgX + (bgWidth - drawWidth) / 2
            drawY = bgY
          } else {
            drawWidth = bgWidth
            drawHeight = bgWidth / mediaRatio
            drawX = bgX
            drawY = bgY + (bgHeight - drawHeight) / 2
          }
          break
          
        case 'fill':
        case 'stretch':
          // Fill entire area, ignore aspect ratio
          drawWidth = bgWidth
          drawHeight = bgHeight
          drawX = bgX
          drawY = bgY
          break
          
        default:
          // Default to contain
          if (mediaRatio > targetRatio) {
            drawWidth = bgWidth
            drawHeight = bgWidth / mediaRatio
            drawX = bgX
            drawY = bgY + (bgHeight - drawHeight) / 2
          } else {
            drawHeight = bgHeight
            drawWidth = bgHeight * mediaRatio
            drawX = bgX + (bgWidth - drawWidth) / 2
            drawY = bgY
          }
      }
      
      ctx.drawImage(bgElement, drawX, drawY, drawWidth, drawHeight)
      ctx.restore() // Restore clipping
    }

    const drawInfographics = async (zone: Zone, yPosition: number, width: number, height: number, scrollOffset: number) => {
      const elements = infographicElementsRef.current[zone.id]
      if (!elements || elements.length === 0) return

      const fontSize = 36
      const elementSpacing = 150 // Space between different elements
      const infographicsFont = 'VCR_OSD_MONO' // Use VCR font for infographics
      
      ctx.save()
      ctx.beginPath()
      ctx.rect(0, yPosition, width, height)
      ctx.clip()
      
      // Calculate total carousel width
      let totalCarouselWidth = 0
      const elementData: { element: InfographicElement, width: number, logoWidth: number }[] = []
      
      for (const element of elements) {
        ctx.font = `bold ${fontSize}px ${getFontFamily(infographicsFont)}`
        
        let textWidth = 0
        if (element.type === 'match' && element.customData) {
          // For matches with custom data, measure both lines and use the wider one
          const matchInfo = zone.forceUppercase ? (element.customData.matchInfo || '').toUpperCase() : (element.customData.matchInfo || '')
          const dateInfo = zone.forceUppercase ? (element.customData.dateInfo || '').toUpperCase() : (element.customData.dateInfo || '')
          const matchInfoWidth = ctx.measureText(matchInfo).width
          const dateInfoWidth = ctx.measureText(dateInfo).width
          textWidth = Math.max(matchInfoWidth, dateInfoWidth)
        } else {
          const content = zone.forceUppercase ? element.content.toUpperCase() : element.content
          textWidth = ctx.measureText(content).width
        }
        
        let logoWidth = 0
        if (element.imageUrl) {
          const logoImg = logoImagesRef.current.get(element.imageUrl)
          if (logoImg && logoImg.complete) {
            // Maintain aspect ratio with max width constraint
            const logoHeight = height * 0.7 // 70% of zone height
            const calculatedWidth = (logoImg.naturalWidth / logoImg.naturalHeight) * logoHeight
            logoWidth = Math.min(calculatedWidth, 200) // Max width 200px
          } else if (!logoImagesRef.current.has(element.imageUrl)) {
            // Load image if not in cache
            const newImg = new Image()
            newImg.crossOrigin = 'anonymous'
            newImg.onload = () => {
              logoImagesRef.current.set(element.imageUrl!, newImg)
            }
            newImg.onerror = () => {
              console.error('Failed to load logo:', element.imageUrl)
            }
            newImg.src = element.imageUrl
            logoWidth = 100 // Reserve space while loading
          } else {
            logoWidth = 100 // Reserve space while loading
          }
        }
        
        const logoSpacing = logoWidth > 0 ? 20 : 0
        const elementWidth = logoWidth + logoSpacing + textWidth
        elementData.push({ element, width: elementWidth, logoWidth })
        totalCarouselWidth += elementWidth + elementSpacing
      }
      
      // Draw all elements in sequence
      const textY = yPosition + (height / 2) + (fontSize / 3)
      let currentPosition = scrollOffset
      
      // Repeat the carousel to create seamless looping
      const numRepeats = Math.ceil((width + Math.abs(scrollOffset)) / totalCarouselWidth) + 1
      
      for (let repeat = 0; repeat < numRepeats; repeat++) {
        let elementX = currentPosition
        
        for (let i = 0; i < elementData.length; i++) {
          const { element, width: elementWidth, logoWidth } = elementData[i]
          
          // Skip if element is completely off screen
          if (elementX > width || elementX + elementWidth < 0) {
            elementX += elementWidth + elementSpacing
            continue
          }
          
          ctx.fillStyle = element.color || zone.color
          let drawX = elementX
          
          // Draw logo if available
          if (element.imageUrl && logoWidth > 0) {
            try {
              const logoImg = logoImagesRef.current.get(element.imageUrl)
              if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
                const logoHeight = height * 0.7
                const calculatedWidth = (logoImg.naturalWidth / logoImg.naturalHeight) * logoHeight
                const actualLogoWidth = Math.min(calculatedWidth, 200) // Max width 200px
                // Calculate height to maintain aspect ratio if width was constrained
                const actualLogoHeight = actualLogoWidth < calculatedWidth 
                  ? (logoImg.naturalHeight / logoImg.naturalWidth) * actualLogoWidth 
                  : logoHeight
                const adjustedLogoY = yPosition + (height - actualLogoHeight) / 2
                ctx.drawImage(logoImg, drawX, adjustedLogoY, actualLogoWidth, actualLogoHeight)
                drawX += actualLogoWidth + 20
              }
            } catch (error) {
              // Silently continue if logo fails to load
            }
          }
          
          // Draw text
          ctx.font = `bold ${fontSize}px ${getFontFamily(infographicsFont)}`
          
          if (element.type === 'match' && element.customData) {
            // Multi-line rendering for matches
            const lineHeight = fontSize * 1.2
            const matchY = yPosition + (height / 2) - (lineHeight / 4)
            const dateY = matchY + lineHeight
            
            const matchText = zone.forceUppercase ? (element.customData.matchInfo || '').toUpperCase() : (element.customData.matchInfo || '')
            const dateText = zone.forceUppercase ? (element.customData.dateInfo || '').toUpperCase() : (element.customData.dateInfo || '')
            ctx.fillText(matchText, drawX, matchY)
            ctx.fillText(dateText, drawX, dateY)
          } else {
            // Single line rendering
            const elementText = zone.forceUppercase ? element.content.toUpperCase() : element.content
            ctx.fillText(elementText, drawX, textY)
          }
          
          elementX += elementWidth + elementSpacing
        }
        
        currentPosition += totalCarouselWidth
      }
      
      ctx.restore()
    }

    const drawCS2Data = async (zone: Zone, yPosition: number, width: number, height: number, scrollOffset: number) => {
      const playerData = cs2PlayerDataRef.current[zone.id]
      console.log('DrawCS2Data called for LiveDisplay zone', zone.id, 'with data:', playerData)
      if (!playerData || playerData.length === 0) {
        console.log('No CS2 player data available for LiveDisplay zone', zone.id)
        return
      }

      const fontSize = 32
      const elementSpacing = 200 // Space between different players
      const cs2Font = 'VCR_OSD_MONO' // Use VCR font for CS2 mode
      
      ctx.save()
      ctx.beginPath()
      ctx.rect(0, yPosition, width, height)
      ctx.clip()
      
      // Calculate total carousel width
      let totalCarouselWidth = 0
      const playerDisplayData: { player: CS2PlayerData, width: number }[] = []
      
      for (const player of playerData) {
        ctx.font = `bold ${fontSize}px ${getFontFamily(cs2Font)}`
        // Format: "pseudo | Month: XM Y% | Week: XM Y%"
        const playerText = `${player.pseudo} | This month: ${player.matches_month} ranked games played, WR: ${player.winrate_month}% | This week: ${player.matches_week} ranked games played, WR: ${player.winrate_week}%`
        const displayText = zone.forceUppercase ? playerText.toUpperCase() : playerText
        const textWidth = ctx.measureText(displayText).width
        
        playerDisplayData.push({ player, width: textWidth })
        totalCarouselWidth += textWidth + elementSpacing
      }
      
      // Draw all elements in sequence
      const textY = yPosition + (height / 2) + (fontSize / 3)
      let currentPosition = scrollOffset
      
      // Repeat the carousel to create seamless looping
      const numRepeats = Math.ceil((width + Math.abs(scrollOffset)) / totalCarouselWidth) + 1
      
      for (let repeat = 0; repeat < numRepeats; repeat++) {
        let elementX = currentPosition
        
        for (let i = 0; i < playerDisplayData.length; i++) {
          const { player, width: playerWidth } = playerDisplayData[i]
          
          // Skip if element is completely off screen
          if (elementX > width || elementX + playerWidth < 0) {
            elementX += playerWidth + elementSpacing
            continue
          }
          
          ctx.fillStyle = zone.color
          const playerText = `${player.pseudo} | This month: ${player.matches_month} ranked games played, WR: ${player.winrate_month}% | This week: ${player.matches_week} ranked games played, WR: ${player.winrate_week}%`
          const displayText = zone.forceUppercase ? playerText.toUpperCase() : playerText
          ctx.fillText(displayText, elementX, textY)
          
          elementX += playerWidth + elementSpacing
        }
        
        currentPosition += totalCarouselWidth
      }
      
      ctx.restore()
    }

    const drawZone = async (zone: Zone, yPosition: number, scrollOffset: number, subScrollOffset: number) => {
      const width = zone.id === 4 ? 864 : CANVAS_WIDTH
      const currentZoneHeight = ZONE_HEIGHT
      
      // Always draw background first
      await drawBackground(zone, 0, yPosition, width, currentZoneHeight)

      // Handle infographics mode
      if (zone.displayMode === 'infographics') {
        await drawInfographics(zone, yPosition, width, currentZoneHeight, scrollOffset)
        return
      }
      
      // Handle CS2 data mode
      if (zone.displayMode === 'cs2-data') {
        await drawCS2Data(zone, yPosition, width, currentZoneHeight, scrollOffset)
        return
      }
      
      if ((zone.lineMode || 'single') === 'single') {
        // Single line mode
        const fontSize = 48
        ctx.font = `bold ${fontSize}px ${getFontFamily(zone.font)}`
        ctx.fillStyle = zone.color
        
        const displayText = zone.forceUppercase ? zone.text.toUpperCase() : zone.text
        const textWidth = ctx.measureText(displayText).width
        const spacing = 50
        const totalWidth = textWidth + spacing
        const textY = yPosition + (currentZoneHeight / 2) + (fontSize / 3)
        
        ctx.save()
        ctx.beginPath()
        ctx.rect(0, yPosition, width, currentZoneHeight)
        ctx.clip()
        
        // Draw scrolling text with true continuous scrolling
        // Start from the rightmost position that could be visible
        let startX = Math.ceil((width - scrollOffset) / totalWidth) * totalWidth + scrollOffset
        
        // Draw text instances from right to left to fill the entire width
        for (let currentX = startX; currentX > scrollOffset - totalWidth; currentX -= totalWidth) {
          const displayText = zone.forceUppercase ? zone.text.toUpperCase() : zone.text
          ctx.fillText(displayText, currentX, textY)
        }
        
        ctx.restore()
      } else {
        // Double line mode
        const subZoneHeight = currentZoneHeight / 2
        const fontSize = 32
        
        // First line
        ctx.font = `bold ${fontSize}px ${getFontFamily(zone.font)}`
        ctx.fillStyle = zone.color
        
        const displayText1 = zone.forceUppercase ? zone.text.toUpperCase() : zone.text
        const textWidth1 = ctx.measureText(displayText1).width
        const spacing1 = 40
        const totalWidth1 = textWidth1 + spacing1
        const textY1 = yPosition + (subZoneHeight / 2) + (fontSize / 3)
        
        ctx.save()
        ctx.beginPath()
        ctx.rect(0, yPosition, width, subZoneHeight)
        ctx.clip()
        
        // Draw first line with continuous scrolling
        let startX1 = Math.ceil((width - scrollOffset) / totalWidth1) * totalWidth1 + scrollOffset
        
        for (let currentX1 = startX1; currentX1 > scrollOffset - totalWidth1; currentX1 -= totalWidth1) {
          const displayText = zone.forceUppercase ? zone.text.toUpperCase() : zone.text
          ctx.fillText(displayText, currentX1, textY1)
        }
        
        ctx.restore()
        
        // Second line
        if (zone.subZone) {
          ctx.font = `bold ${fontSize}px ${getFontFamily(zone.subZone.font)}`
          ctx.fillStyle = zone.subZone.color
          
          const displayText2 = zone.forceUppercase ? zone.subZone.text.toUpperCase() : zone.subZone.text
          const textWidth2 = ctx.measureText(displayText2).width
          const spacing2 = 40
          const totalWidth2 = textWidth2 + spacing2
          const textY2 = yPosition + subZoneHeight + (subZoneHeight / 2) + (fontSize / 3)
          
          ctx.save()
          ctx.beginPath()
          ctx.rect(0, yPosition + subZoneHeight, width, subZoneHeight)
          ctx.clip()
          
          // Draw second line with continuous scrolling
          let startX2 = Math.ceil((width - subScrollOffset) / totalWidth2) * totalWidth2 + subScrollOffset
          
          for (let currentX2 = startX2; currentX2 > subScrollOffset - totalWidth2; currentX2 -= totalWidth2) {
            const displayText = zone.forceUppercase ? zone.subZone.text.toUpperCase() : zone.subZone.text
            ctx.fillText(displayText, currentX2, textY2)
          }
          
          ctx.restore()
        }
      }
    }

    const animate = async (currentTime: number) => {
      const deltaTime = currentTime - lastTimeRef.current
      lastTimeRef.current = currentTime
      
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      
      // Draw each zone
      for (let index = 0; index < zones.length; index++) {
        const zone = zones[index]
        const yPosition = index * ZONE_HEIGHT
        await drawZone(zone, yPosition, scrollOffsetsRef.current[index], subScrollOffsetsRef.current[index])
      }
      
      // Update scroll offsets with time-based animation
      if (isAnimating) {
        zones.forEach((zone, index) => {
          // Convert speed to pixels per second (assuming 60fps baseline)
          const pixelsPerSecond = zone.speed * 60
          const actualSpeed = (pixelsPerSecond * deltaTime) / 1000
          
          // Update main line scroll offset
          scrollOffsetsRef.current[index] -= actualSpeed
          
          // Update sub-line scroll offset for double line mode
          if ((zone.lineMode || 'single') === 'double' && zone.subZone) {
            const subPixelsPerSecond = zone.subZone.speed * 60
            const subActualSpeed = (subPixelsPerSecond * deltaTime) / 1000
            subScrollOffsetsRef.current[index] -= subActualSpeed
          }
        })
      }
      
      animationRef.current = requestAnimationFrame(animate)
    }

    animate(0)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [zones, isAnimating])

  return (
    <div style={{ 
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
      width: '100vw',
      height: '100vh',
      background: '#000'
    }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{ 
          display: 'block',
          background: '#000',
          width: `${CANVAS_WIDTH}px`,
          height: `${CANVAS_HEIGHT}px`
        }}
      />
    </div>
  )
}

export default LiveDisplayCanvas