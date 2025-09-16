import { useState } from 'react'
import LEDBannerCanvas from './components/LEDBannerCanvas'
import ZoneEditor from './components/ZoneEditor'
import './App.css'

export interface Zone {
  id: number
  text: string
  color: string
  speed: number
}

function App() {
  const [zones, setZones] = useState<Zone[]>([
    { id: 1, text: 'ZONE 1 👾', color: '#ff00ec', speed: 2 },
    { id: 2, text: 'ZONE 2 👀', color: '#ff00ec', speed: 1.5 },
    { id: 3, text: 'ZONE 3 🚀', color: '#ff00ec', speed: 2.5 },
    { id: 4, text: 'ZONE 4 🌍', color: '#ff00ec', speed: 1.8 }
  ])

  const updateZone = (id: number, updates: Partial<Zone>) => {
    setZones(prev => prev.map(zone => 
      zone.id === id ? { ...zone, ...updates } : zone
    ))
  }

  const exportForOBS = () => {
    const params = new URLSearchParams()
    zones.forEach(zone => {
      params.append(`zone${zone.id}text`, zone.text)
      params.append(`zone${zone.id}color`, zone.color)
      params.append(`zone${zone.id}speed`, zone.speed.toString())
    })
    
    const obsUrl = `${window.location.origin}/led-display.html?${params.toString()}`
    navigator.clipboard.writeText(obsUrl)
    alert(`OBS URL copied to clipboard!\n\nURL: ${obsUrl}`)
  }

  const openPreview = () => {
    const params = new URLSearchParams()
    zones.forEach(zone => {
      params.append(`zone${zone.id}text`, zone.text)
      params.append(`zone${zone.id}color`, zone.color)
      params.append(`zone${zone.id}speed`, zone.speed.toString())
    })
    
    const previewUrl = `${window.location.origin}/led-display.html?${params.toString()}`
    window.open(previewUrl, '_blank')
  }

  return (
    <div className="app">
      <h1>LED Banner Editor</h1>
      
      <div className="main-content">
        <div className="preview-section">
          <h2>Preview</h2>
          <LEDBannerCanvas zones={zones} />
          <div className="preview-buttons">
            <button onClick={exportForOBS} className="export-btn">
              Copy OBS URL
            </button>
            <button onClick={openPreview} className="preview-btn">
              Open Full Preview
            </button>
          </div>
        </div>
        
        <div className="editor-section">
          <h2>Zone Editor</h2>
          {zones.map(zone => (
            <ZoneEditor 
              key={zone.id} 
              zone={zone} 
              onUpdate={(updates) => updateZone(zone.id, updates)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default App