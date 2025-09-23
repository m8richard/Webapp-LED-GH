import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { ProfileService } from '../lib/profileService'
import { BannerProfile, Zone, NightMode, validateNightMode } from '../lib/supabase'
import LEDBannerCanvas from '../components/LEDBannerCanvas'
import ZoneEditor from '../components/ZoneEditor'
import './Dashboard.css'

const Dashboard = () => {
  const { user, signOut } = useAuth()
  const [profiles, setProfiles] = useState<BannerProfile[]>([])
  const [activeProfile, setActiveProfile] = useState<BannerProfile | null>(null)
  const [selectedProfile, setSelectedProfile] = useState<BannerProfile | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newProfileName, setNewProfileName] = useState('')
  const [currentZones, setCurrentZones] = useState<Zone[]>([
    { id: 1, text: 'ZONE 1 👾', color: '#ff00ec', speed: 2, lineMode: 'single', backgroundType: 'none', backgroundMode: 'contain', font: 'HelveticaBoldExtended', displayMode: 'text' },
    { id: 2, text: 'ZONE 2 👀', color: '#ff00ec', speed: 1.5, lineMode: 'single', backgroundType: 'none', backgroundMode: 'contain', font: 'HelveticaBoldExtended', displayMode: 'text' },
    { id: 3, text: 'ZONE 3 🚀', color: '#ff00ec', speed: 2.5, lineMode: 'single', backgroundType: 'none', backgroundMode: 'contain', font: 'HelveticaBoldExtended', displayMode: 'text' },
    { id: 4, text: 'ZONE 4 🌍', color: '#ff00ec', speed: 1.8, lineMode: 'single', backgroundType: 'none', backgroundMode: 'contain', font: 'HelveticaBoldExtended', displayMode: 'text' }
  ])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activating, setActivating] = useState(false)
  const [copying, setCopying] = useState(false)
  const [nightMode, setNightMode] = useState<NightMode>({
    enabled: false,
    startHour: 23,
    startMinute: 0,
    endHour: 7,
    endMinute: 0,
    endNextDay: true
  })
  const [nightModeError, setNightModeError] = useState('')

  useEffect(() => {
    loadData()
  }, [user])

  const loadData = async () => {
    if (!user?.email) return
    
    try {
      setLoading(true)
      const [allProfiles, active] = await Promise.all([
        ProfileService.getAllProfiles(),
        ProfileService.getActiveProfile()
      ])
      
      setProfiles(allProfiles)
      setActiveProfile(active)
      
      // If editing an existing profile, load its data
      if (selectedProfile) {
        const updated = allProfiles.find(p => p.id === selectedProfile.id)
        if (updated) {
          setSelectedProfile(updated)
          setCurrentZones(updated.zones_data)
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
      alert('Error loading profiles. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const handleCreateNew = () => {
    setIsCreating(true)
    setSelectedProfile(null)
    setNewProfileName('')
    setCurrentZones([
      { id: 1, text: 'ZONE 1 👾', color: '#ff00ec', speed: 2, lineMode: 'single', backgroundType: 'none', backgroundMode: 'contain', font: 'HelveticaBoldExtended', displayMode: 'text' },
      { id: 2, text: 'ZONE 2 👀', color: '#ff00ec', speed: 1.5, lineMode: 'single', backgroundType: 'none', backgroundMode: 'contain', font: 'HelveticaBoldExtended', displayMode: 'text' },
      { id: 3, text: 'ZONE 3 🚀', color: '#ff00ec', speed: 2.5, lineMode: 'single', backgroundType: 'none', backgroundMode: 'contain', font: 'HelveticaBoldExtended', displayMode: 'text' },
      { id: 4, text: 'ZONE 4 🌍', color: '#ff00ec', speed: 1.8, lineMode: 'single', backgroundType: 'none', backgroundMode: 'contain', font: 'HelveticaBoldExtended', displayMode: 'text' }
    ])
    setNightMode({
      enabled: false,
      startHour: 23,
      startMinute: 0,
      endHour: 7,
      endMinute: 0,
      endNextDay: true
    })
    setNightModeError('')
  }

  const handleEditProfile = (profile: BannerProfile) => {
    setIsCreating(false)
    setSelectedProfile(profile)
    setNewProfileName(profile.profile_name)
    setCurrentZones(profile.zones_data)
    setNightMode(profile.night_mode || {
      enabled: false,
      startHour: 23,
      startMinute: 0,
      endHour: 7,
      endMinute: 0,
      endNextDay: true
    })
    setNightModeError('')
  }

  const handleSaveProfile = async () => {
    if (!user?.email || !newProfileName.trim()) {
      alert('Please enter a profile name')
      return
    }

    // Validate night mode if enabled
    if (nightMode.enabled) {
      const error = validateNightMode(nightMode)
      if (error) {
        setNightModeError(error)
        return
      }
    }

    try {
      setSaving(true)
      
      if (selectedProfile) {
        // Updating existing profile - use updateProfileById
        await ProfileService.updateProfileById(selectedProfile.id, newProfileName.trim(), currentZones, nightMode)
      } else {
        // Creating new profile - use saveProfile
        await ProfileService.saveProfile(user.email, newProfileName.trim(), currentZones, nightMode)
      }
      
      await loadData()
      setIsCreating(false)
      setSelectedProfile(null)
      alert('Profile saved successfully!')
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Error saving profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteProfile = async (profile: BannerProfile) => {
    if (!user?.email) return
    
    if (!confirm(`Are you sure you want to delete "${profile.profile_name}"?`)) {
      return
    }

    try {
      await ProfileService.deleteProfile(user.email, profile.profile_name)
      await loadData()
      if (selectedProfile?.id === profile.id) {
        setSelectedProfile(null)
        setIsCreating(false)
      }
      alert('Profile deleted successfully!')
    } catch (error) {
      console.error('Error deleting profile:', error)
      alert('Error deleting profile. Please try again.')
    }
  }

  const handleActivateProfile = async (profile: BannerProfile) => {
    if (profile.is_active) {
      alert('This profile is already active!')
      return
    }

    const currentActive = profiles.find(p => p.is_active)
    const confirmMessage = currentActive 
      ? `This will deactivate "${currentActive.profile_name}" and activate "${profile.profile_name}". Continue?`
      : `Activate "${profile.profile_name}" for the live display?`
    
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      setActivating(true)
      console.log('Activating profile:', profile.id, profile.profile_name)
      await ProfileService.activateProfile(profile.id)
      console.log('Profile activated successfully')
      await loadData()
      alert(`"${profile.profile_name}" is now active and visible on the display!`)
    } catch (error: any) {
      console.error('Error activating profile:', error)
      const errorMessage = error?.message || 'Unknown error occurred'
      alert(`Error activating profile: ${errorMessage}\n\nPlease try again or check the console for details.`)
    } finally {
      setActivating(false)
    }
  }

  const handleCopyProfile = async (profile: BannerProfile) => {
    if (!user?.email) return

    if (!confirm(`Create a copy of "${profile.profile_name}"?`)) {
      return
    }

    try {
      setCopying(true)
      console.log('Copying profile:', profile.id, profile.profile_name)
      await ProfileService.copyProfile(profile.id, user.email)
      console.log('Profile copied successfully')
      await loadData()
      alert(`Copy of "${profile.profile_name}" created successfully!`)
    } catch (error: any) {
      console.error('Error copying profile:', error)
      const errorMessage = error?.message || 'Unknown error occurred'
      alert(`Error copying profile: ${errorMessage}\n\nPlease try again or check the console for details.`)
    } finally {
      setCopying(false)
    }
  }

  const updateZone = (id: number, updates: Partial<Zone>) => {
    setCurrentZones(prev => prev.map(zone => 
      zone.id === id ? { ...zone, ...updates } : zone
    ))
  }

  const isEditing = isCreating || selectedProfile !== null

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-logo-title">
          <img src="/M8PatchBlack.png" alt="GH Gentle Mates Logo" className="header-logo" />
          <h1>Editeur de bannière LED (GH Gentle Mates)</h1>
        </div>
        <div className="user-info">
          <span>Welcome, {user?.email}</span>
          <button onClick={handleSignOut} className="sign-out-btn">
            Sign Out
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        {loading ? (
          <div className="loading-section">
            <div className="loading-spinner"></div>
            <p>Loading profiles...</p>
          </div>
        ) : (
          <div className="dashboard-content">
            {/* Profile Management Section */}
            <div className="profiles-section">
              <div className="section-header">
                <h2>Banner Profiles</h2>
                <button onClick={handleCreateNew} className="create-btn">
                  + Create New Profile
                </button>
              </div>

              <div className="profiles-grid">
                {profiles.map(profile => (
                  <div key={profile.id} className={`profile-card ${profile.is_active ? 'active' : ''}`}>
                    <div className="profile-header">
                      <h3>{profile.profile_name}</h3>
                      {profile.is_active && <span className="active-badge">LIVE</span>}
                    </div>
                    <div className="profile-info">
                      <p>Created by: {profile.user_email}</p>
                      <p>Created: {new Date(profile.created_at).toLocaleDateString()}</p>
                      <p>Updated: {new Date(profile.updated_at).toLocaleDateString()}</p>
                    </div>
                    <div className="profile-actions">
                      <button type="button" onClick={() => handleEditProfile(profile)} className="edit-btn">
                        Edit
                      </button>
                      <button type="button"
                        onClick={() => handleCopyProfile(profile)}
                        className="copy-btn"
                        disabled={copying}
                      >
                        Copy
                      </button>
                      <button type="button"
                        onClick={() => handleActivateProfile(profile)} 
                        className="activate-btn"
                        disabled={activating || profile.is_active}
                      >
                        {profile.is_active ? 'Active' : 'Activate'}
                      </button>
                      <button type="button" onClick={() => handleDeleteProfile(profile)} className="delete-btn">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}

                {profiles.length === 0 && (
                  <div className="no-profiles">
                    <p>No profiles yet. Create your first banner profile!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Editor Section */}
            {isEditing && (
              <div className="editor-section">
                <div className="section-header">
                  <h2>{isCreating ? 'Create New Profile' : `Edit: ${selectedProfile?.profile_name}`}</h2>
                  <div className="editor-actions">
                    <input
                      type="text"
                      value={newProfileName}
                      onChange={(e) => setNewProfileName(e.target.value)}
                      placeholder="Profile name"
                      className="profile-name-input"
                    />
                    <button onClick={handleSaveProfile} disabled={saving} className="save-btn">
                      {saving ? 'Saving...' : 'Save Profile'}
                    </button>
                    <button onClick={() => {
                      setIsCreating(false)
                      setSelectedProfile(null)
                    }} className="cancel-btn">
                      Cancel
                    </button>
                  </div>
                </div>

                <div className="editor-content">
                  <div className="config-section">
                    {/* Night Mode Indicator */}
                    {nightMode.enabled && (
                      <div className="night-mode-indicator">
                        🌙 Night mode is ON - All banners will be black from {nightMode.startHour.toString().padStart(2, '0')}:{nightMode.startMinute.toString().padStart(2, '0')} to {nightMode.endHour.toString().padStart(2, '0')}:{nightMode.endMinute.toString().padStart(2, '0')}{nightMode.endNextDay ? ' (+1 day)' : ''}
                      </div>
                    )}
                    
                    {/* Preview Section */}
                    <div className="preview-section">
                      <h3>Preview</h3>
                      <LEDBannerCanvas zones={currentZones} />
                    </div>
                    
                    {/* Night Mode Panel */}
                    <div className="night-mode-config">
                      <h3>Night Mode</h3>
                      <div className="night-mode-controls">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={nightMode.enabled}
                            onChange={(e) => {
                              setNightMode(prev => ({ ...prev, enabled: e.target.checked }))
                              setNightModeError('')
                            }}
                          />
                          Enable night mode (all zones black to save energy)
                        </label>
                        
                        {nightMode.enabled && (
                          <div className="time-selectors">
                            <div className="time-row">
                              <label>Start time:</label>
                              <div className="time-inputs">
                                <input
                                  title='start-time'
                                  placeholder=''
                                  type="time"
                                  value={`${nightMode.startHour.toString().padStart(2, '0')}:${nightMode.startMinute.toString().padStart(2, '0')}`}
                                  onChange={(e) => {
                                    const timeValue = e.target.value
                                    if (timeValue && timeValue.includes(':')) {
                                      const [hourStr, minuteStr] = timeValue.split(':')
                                      const hour = parseInt(hourStr, 10)
                                      const minute = parseInt(minuteStr, 10)
                                      if (!isNaN(hour) && !isNaN(minute) && hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
                                        setNightMode(prev => ({ ...prev, startHour: hour, startMinute: minute }))
                                        setNightModeError('')
                                      }
                                    }
                                  }}
                                />
                              </div>
                            </div>
                            
                            <div className="time-row">
                              <label>End time:</label>
                              <div className="time-inputs">
                                <input
                                  title='end-time'
                                  placeholder=''
                                  type="time"
                                  value={`${nightMode.endHour.toString().padStart(2, '0')}:${nightMode.endMinute.toString().padStart(2, '0')}`}
                                  onChange={(e) => {
                                    const timeValue = e.target.value
                                    if (timeValue && timeValue.includes(':')) {
                                      const [hourStr, minuteStr] = timeValue.split(':')
                                      const hour = parseInt(hourStr, 10)
                                      const minute = parseInt(minuteStr, 10)
                                      if (!isNaN(hour) && !isNaN(minute) && hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
                                        setNightMode(prev => ({ ...prev, endHour: hour, endMinute: minute }))
                                        setNightModeError('')
                                      }
                                    }
                                  }}
                                />
                                
                                <label className="checkbox-label">
                                  <input
                                    type="checkbox"
                                    checked={nightMode.endNextDay}
                                    onChange={(e) => {
                                      setNightMode(prev => ({ ...prev, endNextDay: e.target.checked }))
                                      setNightModeError('')
                                    }}
                                  />
                                  End time is next day
                                </label>
                              </div>
                            </div>
                            
                            {nightModeError && (
                              <div className="error-message">
                                {nightModeError}
                              </div>
                            )}
                            
                            <div className="night-mode-actions">
                              <button 
                                type="button"
                                className="save-night-mode-btn"
                                onClick={() => {
                                  const error = validateNightMode(nightMode)
                                  if (error) {
                                    setNightModeError(error)
                                  } else {
                                    setNightModeError('')
                                    alert('Night mode configuration validated! Remember to save the profile to persist changes.')
                                  }
                                }}
                              >
                                Validate Night Mode
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="zones-section">
                    <h3>Zone Configuration</h3>
                    <div className="zones-scroll-container">
                      {currentZones.map(zone => (
                        <ZoneEditor 
                          key={zone.id} 
                          zone={zone} 
                          onUpdate={(updates) => updateZone(zone.id, updates)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Active Profile Display */}
            {!isEditing && activeProfile && (
              <div className="active-display-section">
                <div className="section-header">
                  <h2>Current Live Display</h2>
                  <p>This is what's currently showing on <strong>/display</strong> (for OBS)</p>
                </div>
                <div className="active-display">
                  <h3>"{activeProfile.profile_name}"</h3>
                  <LEDBannerCanvas zones={activeProfile.zones_data} />
                  <div className="obs-info">
                    <p><strong>OBS URL:</strong> <code>{window.location.origin}/display</code></p>
                  </div>
                </div>
              </div>
            )}

            {!isEditing && !activeProfile && (
              <div className="no-active-section">
                <div className="section-header">
                  <h2>No Active Display</h2>
                  <p>Activate a profile to make it visible on the display.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default Dashboard