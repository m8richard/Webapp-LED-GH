import { useEffect, useRef, useState } from 'react'
import { Zone } from '../lib/supabase'

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
  
  const defaultZones: Zone[] = [
    { id: 1, text: 'ZONE 1 👾', color: '#ff00ec', speed: 2, lineMode: 'single', backgroundType: 'none', backgroundMode: 'contain' },
    { id: 2, text: 'ZONE 2 👀', color: '#ff00ec', speed: 1.5, lineMode: 'single', backgroundType: 'none', backgroundMode: 'contain' },
    { id: 3, text: 'ZONE 3 🚀', color: '#ff00ec', speed: 2.5, lineMode: 'single', backgroundType: 'none', backgroundMode: 'contain' },
    { id: 4, text: 'ZONE 4 🌍', color: '#ff00ec', speed: 1.8, lineMode: 'single', backgroundType: 'none', backgroundMode: 'contain' }
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

    // Load fonts
    const fontFace1 = new FontFace(
      'HelveticaNeue',
      `url('https://gmrxbbhhyyrtmsftofdp.supabase.co/storage/v1/object/public/gentle-mates-assets/livedata-overlay/HelveticaNeueBold.ttf')`
    )
    
    const fontFace2 = new FontFace(
      'HelveticaBoldExtended',
      `url('https://gmrxbbhhyyrtmsftofdp.supabase.co/storage/v1/object/public/gentle-mates-assets/livedata-overlay/HelveticaNeue-BlackExt.otf')`
    )

    Promise.all([fontFace1.load(), fontFace2.load()]).then(() => {
      document.fonts.add(fontFace1)
      document.fonts.add(fontFace2)
    }).catch(console.error)

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

    const drawZone = async (zone: Zone, yPosition: number, scrollOffset: number, subScrollOffset: number) => {
      const width = zone.id === 4 ? 864 : CANVAS_WIDTH
      const currentZoneHeight = ZONE_HEIGHT
      
      if ((zone.lineMode || 'single') === 'single') {
        // Single line mode - background covers entire zone
        await drawBackground(zone, 0, yPosition, width, currentZoneHeight)
      } else {
        // Double line mode - background covers entire zone (not split per sub-zone)
        await drawBackground(zone, 0, yPosition, width, currentZoneHeight)
      }
      
      if ((zone.lineMode || 'single') === 'single') {
        // Single line mode
        const fontSize = 48
        ctx.font = `bold ${fontSize}px 'HelveticaBoldExtended', 'HelveticaNeue', Arial, sans-serif`
        ctx.fillStyle = zone.color
        
        const textWidth = ctx.measureText(zone.text).width
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
          ctx.fillText(zone.text, currentX, textY)
        }
        
        ctx.restore()
      } else {
        // Double line mode
        const subZoneHeight = currentZoneHeight / 2
        const fontSize = 32
        
        // First line
        ctx.font = `bold ${fontSize}px 'HelveticaBoldExtended', 'HelveticaNeue', Arial, sans-serif`
        ctx.fillStyle = zone.color
        
        const textWidth1 = ctx.measureText(zone.text).width
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
          ctx.fillText(zone.text, currentX1, textY1)
        }
        
        ctx.restore()
        
        // Second line
        if (zone.subZone) {
          ctx.fillStyle = zone.subZone.color
          
          const textWidth2 = ctx.measureText(zone.subZone.text).width
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
            ctx.fillText(zone.subZone.text, currentX2, textY2)
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
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      style={{ 
        display: 'block',
        background: '#000',
        width: '100vw',
        height: '100vh',
        objectFit: 'contain'
      }}
    />
  )
}

export default LiveDisplayCanvas