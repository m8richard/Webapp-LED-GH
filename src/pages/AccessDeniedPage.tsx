import { useAuth } from '../contexts/AuthContext'
import './AccessDeniedPage.css'

const AccessDeniedPage = () => {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="access-denied-page">
      <div className="access-denied-container">
        <div className="access-denied-icon">🚫</div>
        <h1>Access Denied</h1>
        <p>Sorry, only Gentle Mates team members can access this application.</p>
        
        <div className="user-info">
          <p>You are signed in as:</p>
          <strong>{user?.email}</strong>
        </div>

        <div className="access-requirements">
          <h3>Requirements:</h3>
          <ul>
            <li>✅ Google account authentication</li>
            <li>❌ Email must end with @gentlemates.com</li>
          </ul>
        </div>

        <button onClick={handleSignOut} className="sign-out-btn">
          Sign Out & Try Different Account
        </button>

        <div className="contact-info">
          <p>Need access? Contact your administrator.</p>
        </div>
      </div>
    </div>
  )
}

export default AccessDeniedPage