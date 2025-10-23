'use client';

import { useAuth } from '@/contexts/AuthContext';

function Header() {
    const { signOut } = useAuth();

    return (
        <header className="w-full px-4 py-4">
            <div className="container mx-auto flex items-center justify-between rounded-lg shadow-sm px-6 py-4">
                <div className="flex items-center gap-3">
                    <img
                        src="/M8.png"
                        alt="Gaming House Logo"
                        width={48}
                        height={48}
                        className="object-contain"
                    />
                    <div>
                        <h1 className="text-lg sm:text-xl font-bold leading-tight">Gaming House</h1>
                        <p className="text-xs sm:text-sm text-gray-400">LED banner editor</p>
                    </div>
                </div>

                <button
                    onClick={signOut}
                    className="px-4 py-2 rounded-md text-white font-medium text-sm sm:text-base transition-opacity hover:opacity-90 bg-red-500"
                >
                    Sign out
                </button>
            </div>
        </header>
    );
}

export default Header;
