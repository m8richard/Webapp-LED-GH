import { useEffect, useRef, useState } from 'react'
import { supabase, TemporaryMessage, ActiveMessage } from '../lib/supabase'
import './TemporaryMessages.css'

const TemporaryMessagesOverlay = () => {
  const [activeMessages, setActiveMessages] = useState<ActiveMessage[]>([])
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Canvas dimensions - must match LiveDisplayCanvas
  const CANVAS_WIDTH = 1056
  const CANVAS_HEIGHT = 384
  const ZONE_HEIGHT = 96

  useEffect(() => {
    // Subscribe to real-time updates
    const channel = supabase
      .channel('temporary-messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'temporary_messages',
        },
        (payload) => {
          console.log('New temporary message received:', payload.new)
          const newMessage = payload.new as TemporaryMessage
          
          // Create active message for each zone
          newMessage.zone.forEach(zoneId => {
            const activeMessage: ActiveMessage = {
              id: `${newMessage.id}-${zoneId}`,
              message: newMessage.message,
              zoneId: zoneId,
              animation_type: newMessage.animation_type,
              duration: newMessage.duration,
              startTime: Date.now(),
              isAnimatingIn: true,
              isAnimatingOut: false
            }
            
            // Remove existing messages for this zone (priority system)
            setActiveMessages(prev => prev.filter(msg => msg.zoneId !== zoneId))
            
            // Add new message
            setActiveMessages(prev => [...prev, activeMessage])
            
            // Set timeout to start fade out animation
            const timeout = setTimeout(() => {
              setActiveMessages(prev => 
                prev.map(msg => 
                  msg.id === activeMessage.id 
                    ? { ...msg, isAnimatingIn: false, isAnimatingOut: true }
                    : msg
                )
              )
              
              // Remove message after animation completes
              setTimeout(() => {
                setActiveMessages(prev => prev.filter(msg => msg.id !== activeMessage.id))
                timeoutsRef.current.delete(activeMessage.id)
              }, 500) // Animation duration
              
            }, newMessage.duration)
            
            timeoutsRef.current.set(activeMessage.id, timeout)
            
            // Set initial animation state
            setTimeout(() => {
              setActiveMessages(prev =>
                prev.map(msg =>
                  msg.id === activeMessage.id
                    ? { ...msg, isAnimatingIn: false }
                    : msg
                )
              )
            }, 500) // Animation duration
          })
        }
      )
      .subscribe()

    return () => {
      // Cleanup
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout))
      timeoutsRef.current.clear()
      supabase.removeChannel(channel)
    }
  }, [])

  const getZonePosition = (zoneId: number) => {
    const zoneIndex = zoneId - 1 // Convert to 0-based index
    return {
      top: zoneIndex * ZONE_HEIGHT,
      left: 0,
      width: zoneId === 4 ? 864 : CANVAS_WIDTH, // Zone 4 is smaller
      height: ZONE_HEIGHT
    }
  }

  const getAnimationClass = (message: ActiveMessage) => {
    const baseClass = `message-${message.animation_type}`
    if (message.isAnimatingIn) {
      return `${baseClass} animating-in`
    } else if (message.isAnimatingOut) {
      return `${baseClass} animating-out`
    } else {
      return `${baseClass} displaying`
    }
  }

  return (
    <div 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: `${CANVAS_WIDTH}px`,
        height: `${CANVAS_HEIGHT}px`,
        pointerEvents: 'none',
        zIndex: 10
      }}
    >
      {activeMessages.map(message => {
        const position = getZonePosition(message.zoneId)
        return (
          <div
            key={message.id}
            className={getAnimationClass(message)}
            style={{
              position: 'absolute',
              top: `${position.top}px`,
              left: `${position.left}px`,
              width: `${position.width}px`,
              height: `${position.height}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '32px',
              fontWeight: 'bold',
              fontFamily: 'Arial, sans-serif',
              textAlign: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              zIndex: 10,
              overflow: 'hidden'
            }}
          >
            {message.message}
          </div>
        )
      })}
    </div>
  )
}

export default TemporaryMessagesOverlay