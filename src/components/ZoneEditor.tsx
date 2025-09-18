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
      
      {/* Line Mode Selection */}
      <div className="form-group">
        <label>Lines:</label>
        <div className="line-mode-group">
          <label className="radio-label">
            <input
              type="radio"
              name={`lineMode-${zone.id}`}
              value="single"
              checked={(zone.lineMode || 'single') === 'single'}
              onChange={(e) => onUpdate({ lineMode: e.target.value as 'single' | 'double' })}
            />
            Single Line
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name={`lineMode-${zone.id}`}
              value="double"
              checked={(zone.lineMode || 'single') === 'double'}
              onChange={(e) => onUpdate({ lineMode: e.target.value as 'single' | 'double' })}
            />
            Double Lines
          </label>
        </div>
      </div>

      {/* First Line (or Single Line) */}
      <div className="line-section">
        <h4>{(zone.lineMode || 'single') === 'double' ? 'Line 1' : 'Text'}</h4>
        
        <div className="form-group">
          <label htmlFor={`text-${zone.id}`}>Text:</label>
          <input
            type="text"
            id={`text-${zone.id}`}
            value={zone.text}
            onChange={(e) => onUpdate({ text: e.target.value })}
            className="text-input"
          />
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
              placeholder="Speed"
            />
          </div>
        </div>
      </div>

      {/* Second Line (only for double line mode) */}
      {(zone.lineMode || 'single') === 'double' && (
        <div className="line-section">
          <h4>Line 2</h4>
          
          <div className="form-group">
            <label htmlFor={`subtext-${zone.id}`}>Text:</label>
            <input
              type="text"
              id={`subtext-${zone.id}`}
              value={zone.subZone?.text || ''}
              onChange={(e) => onUpdate({ 
                subZone: { 
                  ...zone.subZone, 
                  text: e.target.value,
                  color: zone.subZone?.color || '#ff00ec',
                  speed: zone.subZone?.speed || 2
                } 
              })}
              className="text-input"
              placeholder="Second line text"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor={`subcolor-${zone.id}`}>Color:</label>
            <div className="color-input-group">
              <input
                type="color"
                id={`subcolor-${zone.id}`}
                value={zone.subZone?.color || '#ff00ec'}
                onChange={(e) => onUpdate({ 
                  subZone: { 
                    ...zone.subZone, 
                    color: e.target.value,
                    text: zone.subZone?.text || '',
                    speed: zone.subZone?.speed || 2
                  } 
                })}
                className="color-picker"
              />
              <input
                type="text"
                value={zone.subZone?.color || '#ff00ec'}
                onChange={(e) => onUpdate({ 
                  subZone: { 
                    ...zone.subZone, 
                    color: e.target.value,
                    text: zone.subZone?.text || '',
                    speed: zone.subZone?.speed || 2
                  } 
                })}
                className="color-text"
                placeholder="#ff00ec"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor={`subspeed-${zone.id}`}>Speed:</label>
            <div className="speed-input-group">
              <input
                type="range"
                id={`subspeed-${zone.id}`}
                min="0.5"
                max="5"
                step="0.1"
                value={zone.subZone?.speed || 2}
                onChange={(e) => onUpdate({ 
                  subZone: { 
                    ...zone.subZone, 
                    speed: parseFloat(e.target.value),
                    text: zone.subZone?.text || '',
                    color: zone.subZone?.color || '#ff00ec'
                  } 
                })}
                className="speed-slider"
              />
              <input
                type="number"
                min="0.5"
                max="5"
                step="0.1"
                value={zone.subZone?.speed || 2}
                onChange={(e) => onUpdate({ 
                  subZone: { 
                    ...zone.subZone, 
                    speed: parseFloat(e.target.value),
                    text: zone.subZone?.text || '',
                    color: zone.subZone?.color || '#ff00ec'
                  } 
                })}
                className="speed-number"
                placeholder="Speed"
              />
            </div>
          </div>
        </div>
      )}

      {/* Background Settings */}
      <div className="background-section">
        <h4>Background</h4>
        
        <div className="form-group">
          <label>Background Type:</label>
          <select 
            title="Background Type"
            value={zone.backgroundType || 'none'}
            onChange={(e) => onUpdate({ backgroundType: e.target.value as 'none' | 'image' | 'video' })}
            className="background-type-select"
          >
            <option value="none">None</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
        </div>

        {((zone.backgroundType || 'none') === 'image' || (zone.backgroundType || 'none') === 'video') && (
          <div className="form-group">
            <label htmlFor={`bg-url-${zone.id}`}>Background URL:</label>
            <input
              type="url"
              id={`bg-url-${zone.id}`}
              value={zone.backgroundUrl || ''}
              onChange={(e) => onUpdate({ backgroundUrl: e.target.value })}
              className="url-input"
              placeholder={(zone.backgroundType || 'none') === 'image' ? 'https://example.com/image.jpg' : 'https://example.com/video.mp4'}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default ZoneEditor