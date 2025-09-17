import { Zone } from '../lib/supabase'
import './ZoneEditor.css'

interface ZoneEditorProps {
  zone: Zone
  onUpdate: (updates: Partial<Zone>) => void
}

const ZoneEditor = ({ zone, onUpdate }: ZoneEditorProps) => {
  return (
    <div className="zone-editor">
      <h3>Zone {zone.id}</h3>
      
      <div className="form-group">
        <label htmlFor={`text-${zone.id}`}>Text:</label>
        <div className="text-input-group">
          <input
            type="text"
            id={`text-${zone.id}`}
            value={zone.text}
            onChange={(e) => onUpdate({ text: e.target.value })}
            className="text-input"
          />
        </div>
      </div>
      
      <div className="form-group">
        <label htmlFor={`color-${zone.id}`}>Color:</label>
        <div className="color-input-group">
          <input
            type="color"
            id={`color-${zone.id}`}
            value={zone.color}
            onChange={(e) => onUpdate({ color: e.target.value })}
            className="color-picker"
          />
          <input
            type="text"
            value={zone.color}
            onChange={(e) => onUpdate({ color: e.target.value })}
            className="color-text"
            placeholder="#ff00ec"
          />
        </div>
      </div>
      
      <div className="form-group">
        <label htmlFor={`speed-${zone.id}`}>Speed:</label>
        <div className="speed-input-group">
          <input
            type="range"
            id={`speed-${zone.id}`}
            min="0.5"
            max="5"
            step="0.1"
            value={zone.speed}
            onChange={(e) => onUpdate({ speed: parseFloat(e.target.value) })}
            className="speed-slider"
          />
          <input
            type="number"
            min="0.5"
            max="5"
            step="0.1"
            value={zone.speed}
            onChange={(e) => onUpdate({ speed: parseFloat(e.target.value) })}
            className="speed-number"
            placeholder="Speed (0.5-5.0)"
          />
        </div>
      </div>
    </div>
  )
}

export default ZoneEditor