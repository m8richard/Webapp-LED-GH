import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

import LoginPage from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import DisplayPage from '@/pages/Display';

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
                {/* Public routes */}
                <Route
                    path="/display"
                    element={<DisplayPage />}
                />

                <Route
                    path="/login"
                    element={<LoginPage />}
                />

                {/* Protected routes */}
                {!user || !isValidUser ? (
                    <Route
                        path="*"
                        element={<LoginPage />}
                    />
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
