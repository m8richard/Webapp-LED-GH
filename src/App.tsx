import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Dashboard from './pages/Dashboard';
import DisplayPage from './pages/Display';

function App() {
    const { user, loading, isValidUser } = useAuth();

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <Router>
            <Routes>
                {/* Public route for OBS display */}
                <Route
                    path="/display"
                    element={<DisplayPage />}
                />

                {/* Protected routes */}
                {!user ? (
                    <Route
                        path="*"
                        element={<Dashboard />}
                    /> //TODO: Update later
                ) : !isValidUser ? (
                    <Route
                        path="*"
                        element={<Dashboard />}
                    /> //TODO: Update later
                ) : (
                    <Route
                        path="/"
                        element={<Dashboard />}
                    />
                )}
            </Routes>
        </Router>
    );
}

export default App;
