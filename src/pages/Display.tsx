'use client';

import { useEffect, useRef } from 'react';
import type { Zone } from '@/lib/supabase';
import useProfiles from '@/hooks/useProfiles';
import { BackgroundLayer, TextModeLayer, getBackgroundColor } from '@/components/Zone';
import { ZONE_DIMENSIONS } from '@/utils/constants';

export default function DisplayPage() {
    const { activeProfile, loading } = useProfiles();

    if (loading || !activeProfile) {
        return (
            <div className="w-screen h-screen bg-black flex items-center justify-center">
                <p className="text-white text-2xl">{loading ? 'Loading...' : 'No active profile.'}</p>
            </div>
        );
    }

    return (
        <div className="w-screen h-screen bg-black overflow-hidden">
            <div className="w-full h-full flex flex-col">
                {activeProfile.zones_data.map((zone, index) => (
                    <DisplayZone
                        key={zone.id}
                        zone={zone}
                        width={ZONE_DIMENSIONS[index].width}
                        height={ZONE_DIMENSIONS[index].height}
                    />
                ))}
            </div>
        </div>
    );
}

interface DisplayZoneProps {
    zone: Zone;
    width: number;
    height: number;
}

function DisplayZone({ zone, width, height }: DisplayZoneProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        videoRef.current?.play().catch(() => {});
    }, []);

    return (
        <div
            className="relative overflow-hidden"
            style={{
                width: `${width}px`,
                height: `${height}px`,
                backgroundColor: getBackgroundColor(zone)
            }}
        >
            <BackgroundLayer
                zone={zone}
                videoRef={videoRef}
            />
            <TextModeLayer
                zone={zone}
                isPlaying={true}
                fontSize={48}
                doubleFontSize={32}
            />
        </div>
    );
}
