'use client';

import { useState, useEffect } from 'react';
import { BannerProfile, isInNightMode } from '@/lib/supabase';

export default function useNighMode(activeProfile: BannerProfile | null) {
    const [nightMode, setNightMode] = useState(false);

    useEffect(() => {
        if (!activeProfile) {
            return;
        }

        setNightMode(isInNightMode(activeProfile.night_mode));

        const interval = setInterval(() => {
            setNightMode(isInNightMode(activeProfile.night_mode));
        }, 30 * 1000);

        return () => clearInterval(interval);
    }, [activeProfile]);

    return { nightMode, setNightMode };
}
