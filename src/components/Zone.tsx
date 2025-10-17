import React, { useEffect, useRef, useState, useMemo } from 'react';
import type { Zone } from '@/lib/supabase';

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
    const textRef = useRef<HTMLDivElement>(null);
    const scrollOffsetRef = useRef(0);
    const lastTimeRef = useRef<number>(0);
    const animationFrameRef = useRef<number>();
    const [textWidth, setTextWidth] = useState(0);

    const fontSizeStr = useMemo(() => (typeof fontSize === 'number' ? `${fontSize}px` : fontSize), [fontSize]);

    useEffect(() => {
        const tempSpan = document.createElement('span');

        Object.assign(tempSpan.style, {
            position: 'absolute',
            visibility: 'hidden',
            whiteSpace: 'nowrap',
            fontWeight: 'bold',
            fontFamily: font || 'Helvetica Neue, sans-serif',
            fontSize: fontSizeStr,
            lineHeight: '1'
        });

        tempSpan.textContent = text;

        document.body.appendChild(tempSpan);

        const width = tempSpan.offsetWidth;

        document.body.removeChild(tempSpan);

        setTextWidth(width);
    }, [text, font, fontSizeStr]);

    useEffect(() => {
        lastTimeRef.current = 0;
    }, [isPlaying]);

    useEffect(() => {
        scrollOffsetRef.current = 0;
        lastTimeRef.current = 0;
    }, [text, font, fontSizeStr]);

    useEffect(() => {
        if (!textRef.current || !containerRef.current || textWidth === 0) return;

        const totalWidth = textWidth + 40;

        const animate = (currentTime: number) => {
            if (!textRef.current) {
                animationFrameRef.current = requestAnimationFrame(animate);
                return;
            }

            if (!isPlaying) {
                lastTimeRef.current = 0;
                animationFrameRef.current = requestAnimationFrame(animate);
                return;
            }

            if (lastTimeRef.current === 0) {
                lastTimeRef.current = currentTime;
            }

            const deltaTime = Math.min(currentTime - lastTimeRef.current, 100);

            lastTimeRef.current = currentTime;
            scrollOffsetRef.current -= (speed * 50 * deltaTime) / 1000;

            if (scrollOffsetRef.current <= -totalWidth) {
                scrollOffsetRef.current += totalWidth;
            }

            textRef.current.style.transform = `translateX(${scrollOffsetRef.current}px)`;
            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animationFrameRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [textWidth, speed, isPlaying]);

    const containerWidth = containerRef.current?.clientWidth || 1000;
    const length = textWidth < containerWidth ? Math.ceil(containerWidth / (textWidth + 40)) + 2 : 2;

    return (
        <div
            ref={containerRef}
            className="w-full h-full flex items-center overflow-hidden"
        >
            <div
                ref={textRef}
                className="flex whitespace-nowrap font-bold"
                style={{ willChange: isPlaying ? 'transform' : 'auto' }}
            >
                {Array.from({ length }).map((_, i) => (
                    <span
                        key={i}
                        className="inline-block flex-shrink-0"
                        style={{
                            color,
                            fontFamily: font || 'Helvetica Neue, sans-serif',
                            fontSize: fontSizeStr,
                            lineHeight: '1',
                            marginRight: '40px',
                            position: 'relative',
                            top: '0.05em',
                            verticalAlign: 'baseline'
                        }}
                    >
                        {text}
                    </span>
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
                <div className="absolute top-0 left-0 right-0 h-1/2 flex items-center overflow-hidden">
                    <ScrollingText
                        text={zone.forceUppercase ? (zone.text || '').toUpperCase() : zone.text || ''}
                        color={zone.color}
                        font={zone.font}
                        speed={zone.speed}
                        fontSize={doubleFontSize}
                        isPlaying={isPlaying}
                    />
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1/2 flex items-center overflow-hidden">
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
