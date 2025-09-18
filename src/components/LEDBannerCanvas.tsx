import { useEffect, useRef, useState } from 'react'
import { Zone } from '../lib/supabase'
import './LEDBannerCanvas.css'

interface LEDBannerCanvasProps {
  zones: Zone[]
}

const LEDBannerCanvas = ({ zones }: LEDBannerCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const scrollOffsetsRef = useRef<number[]>([0, 0, 0, 0])
  const subScrollOffsetsRef = useRef<number[]>([0, 0, 0, 0]) // For second lines
  const [isAnimating, setIsAnimating] = useState(true)
  const backgroundElementsRef = useRef<Map<string, HTMLImageElement | HTMLVideoElement>>(new Map())

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

    const drawZone = async (zone: Zone, yPosition: number, scrollOffset: number, subScrollOffset: number) => {
      const width = zone.id === 4 ? 864 : CANVAS_WIDTH // Zone 4 is smaller
      const currentZoneHeight = ZONE_HEIGHT
      
      // Draw zone background (solid color or media)
      if ((zone.backgroundType || 'none') !== 'none' && zone.backgroundUrl) {
        const bgElement = await loadBackgroundElement(zone)
        if (bgElement && bgElement instanceof HTMLImageElement) {
          // Calculate contain dimensions
          const imgRatio = bgElement.naturalWidth / bgElement.naturalHeight
          const zoneRatio = width / currentZoneHeight
          
          let drawWidth, drawHeight, drawX, drawY
          if (imgRatio > zoneRatio) {
            // Image is wider than zone, fit by width
            drawWidth = width
            drawHeight = width / imgRatio
            drawX = 0
            drawY = yPosition + (currentZoneHeight - drawHeight) / 2
          } else {
            // Image is taller than zone, fit by height
            drawHeight = currentZoneHeight
            drawWidth = currentZoneHeight * imgRatio
            drawX = (width - drawWidth) / 2
            drawY = yPosition
          }
          
          ctx.fillStyle = '#000000'
          ctx.fillRect(0, yPosition, width, currentZoneHeight)
          ctx.drawImage(bgElement, drawX, drawY, drawWidth, drawHeight)
        } else if (bgElement && bgElement instanceof HTMLVideoElement) {
          // Calculate contain dimensions for video
          const vidRatio = bgElement.videoWidth / bgElement.videoHeight
          const zoneRatio = width / currentZoneHeight
          
          let drawWidth, drawHeight, drawX, drawY
          if (vidRatio > zoneRatio) {
            drawWidth = width
            drawHeight = width / vidRatio
            drawX = 0
            drawY = yPosition + (currentZoneHeight - drawHeight) / 2
          } else {
            drawHeight = currentZoneHeight
            drawWidth = currentZoneHeight * vidRatio
            drawX = (width - drawWidth) / 2
            drawY = yPosition
          }
          
          ctx.fillStyle = '#000000'
          ctx.fillRect(0, yPosition, width, currentZoneHeight)
          ctx.drawImage(bgElement, drawX, drawY, drawWidth, drawHeight)
        } else {
          ctx.fillStyle = '#000000'
          ctx.fillRect(0, yPosition, width, currentZoneHeight)
        }
      } else {
        ctx.fillStyle = '#000000'
        ctx.fillRect(0, yPosition, width, currentZoneHeight)
      }
      
      // Draw zone border
      ctx.strokeStyle = '#333333'
      ctx.lineWidth = 2
      ctx.strokeRect(0, yPosition, width, currentZoneHeight)
      
      if ((zone.lineMode || 'single') === 'single') {
        // Single line mode - text in center of zone
        const fontSize = 48
        ctx.font = `bold ${fontSize}px 'HelveticaBoldExtended', 'HelveticaNeue', Arial, sans-serif`
        ctx.fillStyle = zone.color
        
        const textWidth = ctx.measureText(zone.text).width
        const spacing = 50
        const totalWidth = textWidth + spacing
        const textY = yPosition + (currentZoneHeight / 2) + (fontSize / 3)
        
        // Clip to zone boundaries
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
        // Double line mode - split zone into two sub-zones
        const subZoneHeight = currentZoneHeight / 2
        const fontSize = 32 // Smaller font for two lines
        
        // Draw first line (top half)
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
        
        // Draw second line (bottom half) if subZone exists
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
          
          // Draw divider line between sub-zones
          ctx.strokeStyle = '#555555'
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(0, yPosition + subZoneHeight)
          ctx.lineTo(width, yPosition + subZoneHeight)
          ctx.stroke()
        }
      }
    }

    const animate = async () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      
      // Draw each zone
      for (let index = 0; index < zones.length; index++) {
        const zone = zones[index]
        const yPosition = index * ZONE_HEIGHT
        await drawZone(zone, yPosition, scrollOffsetsRef.current[index], subScrollOffsetsRef.current[index])
      }
      
      // Update scroll offsets
      if (isAnimating) {
        zones.forEach((zone, index) => {
          // Update main line scroll offset
          scrollOffsetsRef.current[index] -= zone.speed
          
          // Update sub-line scroll offset for double line mode
          if ((zone.lineMode || 'single') === 'double' && zone.subZone) {
            subScrollOffsetsRef.current[index] -= zone.subZone.speed
          }
        })
      }
      
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [zones, isAnimating])

  const toggleAnimation = () => {
    setIsAnimating(!isAnimating)
  }

  return (
    <div className="led-banner-container">
      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="led-canvas"
        />
      </div>
      <button type="button" onClick={toggleAnimation} className="animation-toggle-btn">
        {isAnimating ? '⏸️ PAUSE' : '▶️ PLAY'}
      </button>
    </div>
  )
}

export default LEDBannerCanvas