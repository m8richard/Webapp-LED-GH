'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { BackgroundLayer, TextModeLayer, getBackgroundColor } from '@/components/Zone';
import type { Zone } from '@/lib/supabase';
import { ZONE_DIMENSIONS } from '@/utils/constants';

interface PreviewProps {
    zones: Zone[];
}

export default function Preview({ zones }: PreviewProps) {
    const [isPlaying, setIsPlaying] = useState(true);

    return (
        <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Preview</h3>
                <PlayButton
                    isPlaying={isPlaying}
                    onToggle={() => setIsPlaying(!isPlaying)}
                />
            </div>
            <div className="space-y-4">
                {zones.map((zone, index) => (
                    <PreviewZone
                        key={zone.id}
                        zone={zone}
                        dimensions={ZONE_DIMENSIONS[index]}
                        isPlaying={isPlaying}
                    />
                ))}
            </div>
        </div>
    );
}

interface PlayButtonProps {
    isPlaying: boolean;
    onToggle: () => void;
}

function PlayButton({ isPlaying, onToggle }: PlayButtonProps) {
    return (
        <button
            onClick={onToggle}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-500 transition-colors"
        >
            {isPlaying ? (
                <>
                    <Pause size={16} />
                    <span className="text-sm">Pause</span>
                </>
            ) : (
                <>
                    <Play size={16} />
                    <span className="text-sm">Play</span>
                </>
            )}
        </button>
    );
}

interface PreviewZoneProps {
    zone: Zone;
    dimensions: { width: number; height: number; name: string };
    isPlaying: boolean;
}

function PreviewZone({ zone, dimensions, isPlaying }: PreviewZoneProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (isPlaying) {
            video.play().catch(() => {});
        } else {
            video.pause();
        }
    }, [isPlaying]);

    const backgroundColor = getBackgroundColor(zone);
    const aspectRatio = `${dimensions.width}/${dimensions.height}`;
    const containerWidth = `${(dimensions.width / 1056) * 100}%`;

    return (
        <div className="space-y-2">
            <span className="text-sm text-gray-400">{dimensions.name}</span>
            <div
                className="relative overflow-hidden rounded"
                style={{
                    aspectRatio,
                    width: containerWidth,
                    maxWidth: '100%',
                    backgroundColor
                }}
            >
                <BackgroundLayer
                    zone={zone}
                    videoRef={videoRef}
                />
                <TextModeLayer
                    zone={zone}
                    isPlaying={isPlaying}
                    fontSize="2rem"
                    doubleFontSize="1.3rem"
                />
            </div>
        </div>
    );
}
