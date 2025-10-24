import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import type { Zone } from '@/lib/supabase';

const ANIMATION_CONFIG = {
    SMOOTH_TAU: 0.25,
    MIN_COPIES: 2,
    COPY_HEADROOM: 2
};

interface BackgroundLayerProps {
    zone: Zone;
    videoRef: React.RefObject<HTMLVideoElement>;
}

function BackgroundLayer({ zone, videoRef }: BackgroundLayerProps) {
    if (zone.backgroundType === 'image' && zone.backgroundUrl) {
        return (
            <img
                src={zone.backgroundUrl}
                alt="Background"
                className="absolute inset-0 w-full h-full object-cover"
            />
        );
    }

    if (zone.backgroundType === 'video' && zone.backgroundUrl) {
        return (
            <video
                ref={videoRef}
                src={zone.backgroundUrl}
                autoPlay
                loop
                muted
                className="absolute inset-0 w-full h-full object-cover"
            />
        );
    }

    return null;
}

interface ScrollingTextProps {
    text: string;
    color: string;
    font?: string;
    speed: number;
    fontSize: number | string;
    isPlaying?: boolean;
}

function ScrollingText({ text, color, font, speed, fontSize, isPlaying = true }: ScrollingTextProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const seqRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef<number | null>(null);
    const lastTimestampRef = useRef<number | null>(null);
    const offsetRef = useRef(0);
    const velocityRef = useRef(0);

    const [seqWidth, setSeqWidth] = useState(0);
    const [copyCount, setCopyCount] = useState(ANIMATION_CONFIG.MIN_COPIES);

    const fontSizeStr = useMemo(() => (typeof fontSize === 'number' ? `${fontSize}px` : fontSize), [fontSize]);
    const targetVelocity = useMemo(() => speed * 60, [speed]);

    const updateDimensions = useCallback(() => {
        const containerWidth = containerRef.current?.clientWidth ?? 0;
        const sequenceWidth = seqRef.current?.getBoundingClientRect?.()?.width ?? 0;

        if (sequenceWidth > 0) {
            setSeqWidth(Math.ceil(sequenceWidth));
            setCopyCount(Math.max(ANIMATION_CONFIG.MIN_COPIES, Math.ceil(containerWidth / sequenceWidth) + ANIMATION_CONFIG.COPY_HEADROOM));
        }
    }, []);

    useEffect(() => {
        updateDimensions();

        if (!window.ResizeObserver) {
            const handleResize = () => updateDimensions();

            window.addEventListener('resize', handleResize);

            return () => window.removeEventListener('resize', handleResize);
        }

        const observer = new ResizeObserver(updateDimensions);

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        if (seqRef.current) {
            observer.observe(seqRef.current);
        }

        return () => observer.disconnect();
    }, [text, font, fontSizeStr, updateDimensions]);

    useEffect(() => {
        const track = trackRef.current;
        if (!track) return;

        const prefersReduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

        if (seqWidth > 0) {
            offsetRef.current = ((offsetRef.current % seqWidth) + seqWidth) % seqWidth;
            track.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
        }

        if (prefersReduced) {
            track.style.transform = 'translate3d(0, 0, 0)';

            return () => {
                lastTimestampRef.current = null;
            };
        }

        const animate = (timestamp: number) => {
            if (lastTimestampRef.current === null) {
                lastTimestampRef.current = timestamp;
            }

            const deltaTime = Math.max(0, timestamp - lastTimestampRef.current) / 1000;
            const target = isPlaying ? targetVelocity : 0;

            lastTimestampRef.current = timestamp;
            velocityRef.current += (target - velocityRef.current) * (1 - Math.exp(-deltaTime / ANIMATION_CONFIG.SMOOTH_TAU));

            if (seqWidth > 0) {
                offsetRef.current = (((offsetRef.current + velocityRef.current * deltaTime) % seqWidth) + seqWidth) % seqWidth;
                track.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
            }

            rafRef.current = requestAnimationFrame(animate);
        };

        rafRef.current = requestAnimationFrame(animate);

        return () => {
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }

            lastTimestampRef.current = null;
        };
    }, [targetVelocity, seqWidth, isPlaying]);

    const containerStyle = useMemo(
        () => ({
            fontFamily: font || 'Helvetica Neue, sans-serif',
            fontSize: fontSizeStr,
            color
        }),
        [font, fontSizeStr, color]
    );

    return (
        <div
            ref={containerRef}
            className="w-full h-full flex items-center overflow-hidden"
            style={containerStyle}
        >
            <div
                ref={trackRef}
                className="flex w-max will-change-transform select-none"
                style={{ willChange: isPlaying ? 'transform' : 'auto' }}
            >
                {Array.from({ length: copyCount }, (_, copyIndex) => (
                    <div
                        key={`copy-${copyIndex}`}
                        ref={copyIndex === 0 ? seqRef : undefined}
                        className="flex items-center"
                    >
                        <span
                            className="inline-block font-bold whitespace-nowrap"
                            style={{
                                marginRight: '40px',
                                position: 'relative',
                                overflow: 'visible',
                                top: '0.15em'
                            }}
                        >
                            {text}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

interface TextModeLayerProps {
    zone: Zone;
    isPlaying?: boolean;
    fontSize?: number | string;
    doubleFontSize?: number | string;
}

function getBackgroundColor(zone: Zone): string | undefined {
    if (zone.backgroundType === 'color') {
        return zone.backgroundUrl;
    }

    if (zone.backgroundType === 'none') {
        return '#000000';
    }

    return undefined;
}

function TextModeLayer({ zone, isPlaying = true, fontSize = 48, doubleFontSize = 32 }: TextModeLayerProps) {
    if (zone.displayMode !== 'text') {
        return null;
    }

    if (zone.lineMode === 'double' && zone.subZone) {
        return (
            <>
                <div className="absolute top-0 left-0 right-0 h-1/2 pb-1 flex items-start overflow-visible">
                    <ScrollingText
                        text={zone.forceUppercase ? (zone.text || '').toUpperCase() : zone.text || ''}
                        color={zone.color}
                        font={zone.font}
                        speed={zone.speed}
                        fontSize={doubleFontSize}
                        isPlaying={isPlaying}
                    />
                </div>
                <div className="absolute bottom-0 left-0 right-0 flex items-end pb-2 overflow-visible">
                    <ScrollingText
                        text={zone.forceUppercase ? zone.subZone.text.toUpperCase() : zone.subZone.text}
                        color={zone.subZone.color}
                        font={zone.subZone.font}
                        speed={zone.subZone.speed}
                        fontSize={doubleFontSize}
                        isPlaying={isPlaying}
                    />
                </div>
            </>
        );
    }

    return (
        <div className="absolute inset-0 flex items-center overflow-hidden">
            <ScrollingText
                text={zone.forceUppercase ? (zone.text || '').toUpperCase() : zone.text || ''}
                color={zone.color}
                font={zone.font}
                speed={zone.speed}
                fontSize={fontSize}
                isPlaying={isPlaying}
            />
        </div>
    );
}

export { BackgroundLayer, getBackgroundColor, TextModeLayer };
