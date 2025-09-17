import { useEffect, useRef, useState } from 'react'

interface Zone {
  id: number
  text: string
  color: string
  speed: number
}

interface LiveDisplayCanvasProps {
  zones?: Zone[]
}

const LiveDisplayCanvas = ({ zones: propZones }: LiveDisplayCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const scrollOffsetsRef = useRef<number[]>([0, 0, 0, 0])
  const [isAnimating, setIsAnimating] = useState(true)
  
  const defaultZones: Zone[] = [
    { id: 1, text: 'ZONE 1 👾', color: '#ff00ec', speed: 2 },
    { id: 2, text: 'ZONE 2 👀', color: '#ff00ec', speed: 1.5 },
    { id: 3, text: 'ZONE 3 🚀', color: '#ff00ec', speed: 2.5 },
    { id: 4, text: 'ZONE 4 🌍', color: '#ff00ec', speed: 1.8 }
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

    const drawZone = (zone: Zone, yPosition: number, scrollOffset: number) => {
      const width = zone.id === 4 ? 864 : CANVAS_WIDTH
      
      // Draw zone background
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, yPosition, width, ZONE_HEIGHT)
      
      // Configure text
      const fontSize = 48
      ctx.font = `bold ${fontSize}px 'HelveticaBoldExtended', 'HelveticaNeue', Arial, sans-serif`
      ctx.fillStyle = zone.color
      ctx.shadowColor = zone.color
      ctx.shadowBlur = 0
      
      // Calculate text metrics
      const textWidth = ctx.measureText(zone.text).width
      const spacing = 50
      const totalWidth = textWidth + spacing
      
      const textY = yPosition + (ZONE_HEIGHT / 2) + (fontSize / 3)
      
      // Clip to zone boundaries
      ctx.save()
      ctx.beginPath()
      ctx.rect(0, yPosition, width, ZONE_HEIGHT)
      ctx.clip()
      
      // Draw scrolling text
      const startX = scrollOffset % totalWidth
      let currentX = startX
      
      while (currentX < width + textWidth) {
        ctx.fillText(zone.text, currentX, textY)
        currentX += totalWidth
      }
      
      ctx.restore()
      ctx.shadowBlur = 0
    }

    const animate = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      
      // Draw each zone
      zones.forEach((zone, index) => {
        const yPosition = index * ZONE_HEIGHT
        drawZone(zone, yPosition, scrollOffsetsRef.current[index])
      })
      
      // Update scroll offsets
      if (isAnimating) {
        zones.forEach((zone, index) => {
          scrollOffsetsRef.current[index] -= zone.speed
          
          // Reset scroll when text has completely scrolled
          ctx.font = `bold 48px 'HelveticaBoldExtended', 'HelveticaNeue', Arial, sans-serif`
          const textWidth = ctx.measureText(zone.text).width + 50
          
          if (scrollOffsetsRef.current[index] <= -textWidth) {
            scrollOffsetsRef.current[index] = 0
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

  return (
    <div className="live-display-container">
      <div className="live-canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="live-canvas"
        />
      </div>
      <style>{`
        .live-display-container {
          margin: 0;
          padding: 0;
          background: #000;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        
        .live-canvas-wrapper {
          width: 100%;
          max-width: min(1056px, 100vw - 40px);
          border: 8px solid #333;
          background: #000;
          overflow: hidden;
        }
        
        .live-canvas {
          width: 100%;
          height: auto;
          display: block;
          background: #000;
        }
        
        @media (min-width: 1600px) {
          .live-canvas-wrapper {
            max-width: min(1400px, 100vw - 120px);
            border: 10px solid #333;
          }
        }
        
        @media (min-width: 1200px) and (max-width: 1599px) {
          .live-canvas-wrapper {
            max-width: min(1200px, 100vw - 80px);
          }
        }
        
        @media (max-width: 1200px) {
          .live-canvas-wrapper {
            max-width: 100%;
            margin: 20px;
          }
        }
        
        @media (max-width: 768px) {
          .live-canvas-wrapper {
            border: 6px solid #333;
            margin: 15px;
          }
        }
        
        @media (max-width: 480px) {
          .live-canvas-wrapper {
            border: 4px solid #333;
            margin: 10px;
          }
        }
        
        @media (orientation: landscape) and (max-height: 600px) {
          .live-display-container {
            align-items: flex-start;
            padding-top: 20px;
          }
          
          .live-canvas-wrapper {
            margin: 10px;
          }
        }
      `}</style>
    </div>
  )
}

export default LiveDisplayCanvas