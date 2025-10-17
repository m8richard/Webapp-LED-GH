'use client';

import { useState, useEffect } from 'react';
import type { BannerProfile } from '@/lib/supabase';
import { ProfileService } from '../lib/profileService';

export default function useProfiles() {
    const [profils, setProfiles] = useState<BannerProfile[]>([]);
    const [activeProfile, setActiveProfile] = useState<BannerProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);

                const [all, active] = await Promise.all([ProfileService.getAllProfiles(), ProfileService.getActiveProfile()]);

                setProfiles(all);
                setActiveProfile(active);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return { profils, activeProfile, loading };
}
