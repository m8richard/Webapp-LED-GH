import { Zone } from '../lib/supabase'
import { AVAILABLE_FONTS } from '../lib/fonts'
import './ZoneEditor.css'

interface ZoneEditorProps {
  zone: Zone
  onUpdate: (updates: Partial<Zone>) => void
}

const ZoneEditor = ({ zone, onUpdate }: ZoneEditorProps) => {
  return (
    <div className="zone-editor">
      <h3>Zone {zone.id}</h3>
      
      {/* Display Mode Selection */}
      <div className="form-group">
        <label>Display Mode:</label>
        <div className="line-mode-group">
          <label className="radio-label">
            <input
              type="radio"
              name={`displayMode-${zone.id}`}
              value="text"
              checked={(zone.displayMode || 'text') === 'text'}
              onChange={(e) => onUpdate({ displayMode: e.target.value as 'text' | 'infographics' })}
            />
            Text Mode
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name={`displayMode-${zone.id}`}
              value="infographics"
              checked={(zone.displayMode || 'text') === 'infographics'}
              onChange={(e) => onUpdate({ displayMode: e.target.value as 'text' | 'infographics' })}
            />
            Infographics Mode
          </label>
        </div>
      </div>

      {/* Line Mode Selection - Only show in text mode */}
      {(zone.displayMode || 'text') === 'text' && (
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
      )}

      {/* Text Configuration - Only show in text mode */}
      {(zone.displayMode || 'text') === 'text' && (
        <>
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
        
        <div className="form-group">
          <label htmlFor={`font-${zone.id}`}>Font:</label>
          <select 
            id={`font-${zone.id}`}
            value={zone.font || 'HelveticaBoldExtended'}
            onChange={(e) => onUpdate({ font: e.target.value })}
            className="font-select"
          >
            {AVAILABLE_FONTS.map(font => (
              <option key={font.name} value={font.name}>
                {font.displayName}
              </option>
            ))}
          </select>
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
          
          <div className="form-group">
            <label htmlFor={`subfont-${zone.id}`}>Font:</label>
            <select 
              id={`subfont-${zone.id}`}
              value={zone.subZone?.font || 'HelveticaBoldExtended'}
              onChange={(e) => onUpdate({ 
                subZone: { 
                  ...zone.subZone, 
                  font: e.target.value,
                  text: zone.subZone?.text || '',
                  color: zone.subZone?.color || '#ff00ec',
                  speed: zone.subZone?.speed || 2
                } 
              })}
              className="font-select"
            >
              {AVAILABLE_FONTS.map(font => (
                <option key={font.name} value={font.name}>
                  {font.displayName}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
        </>
      )}

      {/* Infographics Information */}
      {(zone.displayMode || 'text') === 'infographics' && (
        <div className="infographics-section">
          <h4>Infographics Mode</h4>
          <p className="infographics-description">
            This zone will automatically display rotating infographics including:
          </p>
          <ul className="infographics-list">
            <li>🌤️ Weather and temperature in Paris</li>
            <li>🧹 Facility cleanliness reminders (FR/EN)</li>
            <li>💧 Hydration reminders (FR/EN)</li>
            <li>🎮 Upcoming Gentle Mates matches</li>
            <li>🎂 Player birthdays and anniversaries</li>
          </ul>
          <p className="infographics-note">
            <strong>Note:</strong> Text, line, and color settings are disabled in infographics mode. 
            Only background and speed settings apply. Colors are automatically set for each element type.
          </p>
          
          <div className="form-group">
            <label htmlFor={`infographics-speed-${zone.id}`}>Scrolling Speed:</label>
            <div className="speed-input-group">
              <input
                type="range"
                id={`infographics-speed-${zone.id}`}
                min="0.5"
                max="5"
                step="0.1"
                value={zone.speed}
                onChange={(e) => onUpdate({ speed: parseFloat(e.target.value) })}
                className="speed-slider"
              />
              <input
                title="Scrolling Speed"
                type="number"
                min="0.5"
                max="5"
                step="0.1"
                value={zone.speed}
                onChange={(e) => onUpdate({ speed: parseFloat(e.target.value) })}
                className="speed-number"
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
          <>
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
            
            <div className="form-group">
              <label htmlFor={`bg-mode-${zone.id}`}>Background Mode:</label>
              <select 
                id={`bg-mode-${zone.id}`}
                value={zone.backgroundMode || 'contain'}
                onChange={(e) => onUpdate({ backgroundMode: e.target.value as 'contain' | 'cover' | 'fill' | 'stretch' })}
                className="background-mode-select"
              >
                <option value="contain">Contain (fit with letterbox)</option>
                <option value="cover">Cover (fill zone, may crop)</option>
                <option value="fill">Fill (stretch to fit exactly)</option>
                <option value="stretch">Stretch (ignore aspect ratio)</option>
              </select>
              <small className="mode-description">
                {(zone.backgroundMode || 'contain') === 'contain' && 'Image/video fits completely within zone with black bars if needed'}
                {(zone.backgroundMode || 'contain') === 'cover' && 'Image/video fills entire zone, may crop edges to maintain aspect ratio'}
                {(zone.backgroundMode || 'contain') === 'fill' && 'Image/video stretches to fill zone exactly, may distort aspect ratio'}
                {(zone.backgroundMode || 'contain') === 'stretch' && 'Image/video stretches to fill zone, ignoring original aspect ratio'}
              </small>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ZoneEditor