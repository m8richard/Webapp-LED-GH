import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import AccessDeniedPage from './pages/AccessDeniedPage'
import Dashboard from './pages/Dashboard'
import DisplayPage from './pages/DisplayPage'
import './App.css'

function AppContent() {
  const { user, loading, isValidUser } = useAuth()

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        {/* Public route for OBS display */}
        <Route path="/display" element={<DisplayPage />} />
        
        {/* Protected routes */}
        {!user ? (
          <Route path="*" element={<LoginPage />} />
        ) : !isValidUser ? (
          <Route path="*" element={<AccessDeniedPage />} />
        ) : (
          <>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </>
        )}
      </Routes>
    </Router>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App