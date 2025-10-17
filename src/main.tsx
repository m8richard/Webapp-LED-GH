import React from 'react';
import ReactDOM from 'react-dom/client';
import loadFonts from '@/utils/fonts';
import App from './App';

import { AuthProvider } from './contexts/AuthContext';

import './styles/globals.css';

loadFonts();

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <AuthProvider>
            <App />
        </AuthProvider>
    </React.StrictMode>
);
