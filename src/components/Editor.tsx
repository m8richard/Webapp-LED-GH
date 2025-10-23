'use client';

import React, { useState } from 'react';
import type { Zone, NightMode } from '@/lib/supabase';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { FONTS } from '@/utils/constants';

interface EditorProps {
    zones: Zone[];
    onUpdateZone: (zoneId: number, updates: Partial<Zone>) => void;
    nightMode: NightMode;
    onUpdateNightMode: (update: Partial<NightMode>) => void;
}

export default function Editor({ zones, onUpdateZone, nightMode, onUpdateNightMode }: EditorProps) {
    const [expandedZone, setExpandedZone] = useState<number | null>(1);

    return (
        <div className="space-y-4">
            {zones.map(zone => (
                <ZoneEditor
                    key={zone.id}
                    zone={zone}
                    isExpanded={expandedZone === zone.id}
                    onToggle={() => setExpandedZone(expandedZone === zone.id ? null : zone.id)}
                    onUpdate={updates => onUpdateZone(zone.id, updates)}
                />
            ))}

            <NightModeEditor
                nightMode={nightMode}
                onUpdate={onUpdateNightMode}
            />
        </div>
    );
}

interface ZoneEditorProps {
    zone: Zone;
    isExpanded: boolean;
    onToggle: () => void;
    onUpdate: (updates: Partial<Zone>) => void;
}

function ZoneEditor({ zone, isExpanded, onToggle, onUpdate }: ZoneEditorProps) {
    const updateSubZone = (updates: Partial<Zone['subZone']>) => {
        onUpdate({
            subZone: {
                text: '',
                color: zone.color,
                speed: zone.speed,
                font: zone.font,
                ...zone.subZone,
                ...updates
            }
        });
    };

    const updateLineMode = (newLineMode: 'single' | 'double') => {
        if (newLineMode === 'double' && !zone.subZone) {
            onUpdate({
                lineMode: newLineMode,
                subZone: {
                    text: zone.text,
                    color: zone.color,
                    speed: zone.speed,
                    font: zone.font
                }
            });
        } else {
            onUpdate({ lineMode: newLineMode });
        }
    };

    return (
        <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-100 transition-colors"
            >
                <span className="font-semibold">Zone {zone.id}</span>
                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {isExpanded && (
                <div className="p-4 border-t space-y-4 bg-white">
                    <SelectField
                        label="Display Type"
                        value={zone.displayMode}
                        onChange={e => onUpdate({ displayMode: e.target.value as Zone['displayMode'] })}
                        options={[
                            { value: 'text', label: 'Text' },
                            { value: 'infographics', label: 'Infos' },
                            { value: 'cs2-data', label: 'CS2' }
                        ]}
                    />

                    {zone.displayMode === 'text' && (
                        <>
                            <SelectField
                                label="Line Mode"
                                value={zone.lineMode}
                                onChange={e => updateLineMode(e.target.value as 'single' | 'double')}
                                options={[
                                    { value: 'single', label: 'Single Line' },
                                    { value: 'double', label: 'Double Line' }
                                ]}
                            />

                            <LineEditor
                                title={zone.lineMode === 'double' ? 'Line 1' : 'Text'}
                                text={zone.text}
                                color={zone.color}
                                font={zone.font || 'HelveticaBoldExtended'}
                                speed={zone.speed}
                                onTextChange={text => onUpdate({ text })}
                                onColorChange={color => onUpdate({ color })}
                                onFontChange={font => onUpdate({ font })}
                                onSpeedChange={speed => onUpdate({ speed })}
                            />

                            {zone.lineMode === 'double' && (
                                <LineEditor
                                    title="Line 2"
                                    text={zone.subZone?.text || ''}
                                    color={zone.subZone?.color || zone.color}
                                    font={zone.subZone?.font || zone.font || 'HelveticaBoldExtended'}
                                    speed={zone.subZone?.speed || zone.speed}
                                    onTextChange={text => updateSubZone({ text })}
                                    onColorChange={color => updateSubZone({ color })}
                                    onFontChange={font => updateSubZone({ font })}
                                    onSpeedChange={speed => updateSubZone({ speed })}
                                />
                            )}
                        </>
                    )}

                    {zone.displayMode !== 'text' && (
                        <SpeedSlider
                            speed={zone.speed}
                            onChange={speed => onUpdate({ speed })}
                        />
                    )}

                    <BackgroundField
                        backgroundType={zone.backgroundType}
                        backgroundUrl={zone.backgroundUrl}
                        onTypeChange={backgroundType => onUpdate({ backgroundType })}
                        onUrlChange={backgroundUrl => onUpdate({ backgroundUrl })}
                    />

                    <CheckboxField
                        id={`uppercase-${zone.id}`}
                        checked={zone.forceUppercase}
                        onChange={checked => onUpdate({ forceUppercase: checked })}
                        label="Force Uppercase"
                    />
                </div>
            )}
        </div>
    );
}

interface SelectFieldProps {
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: Array<{ value: string; label: string }>;
}

function SelectField({ label, value, onChange, options }: SelectFieldProps) {
    return (
        <div>
            <label className="block text-sm font-medium mb-2">{label}</label>
            <select
                value={value}
                onChange={onChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
                {options.map(opt => (
                    <option
                        key={opt.value}
                        value={opt.value}
                    >
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

interface LineEditorProps {
    title: string;
    text: string;
    color: string;
    font: string;
    speed: number;
    onTextChange: (text: string) => void;
    onColorChange: (color: string) => void;
    onFontChange: (font: string) => void;
    onSpeedChange: (speed: number) => void;
}

function LineEditor({ title, text, color, font, speed, onTextChange, onColorChange, onFontChange, onSpeedChange }: LineEditorProps) {
    return (
        <div className="border border-gray-200 rounded-lg p-4 space-y-4 bg-gray-50">
            <h4 className="font-semibold text-sm text-gray-700">{title}</h4>

            <TextField
                label="Content"
                value={text}
                onChange={onTextChange}
                placeholder="Enter text..."
            />

            <ColorField
                label="Color"
                value={color}
                onChange={onColorChange}
            />

            <div>
                <label className="block text-sm font-medium mb-2">Font</label>
                <select
                    value={font}
                    onChange={e => onFontChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                    {FONTS.map(f => (
                        <option
                            key={f.name}
                            value={f.name}
                        >
                            {f.displayName}
                        </option>
                    ))}
                </select>
            </div>

            <SpeedSlider
                speed={speed}
                onChange={onSpeedChange}
            />
        </div>
    );
}

interface TextFieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

function TextField({ label, value, onChange, placeholder }: TextFieldProps) {
    return (
        <div>
            <label className="block text-sm font-medium mb-2">{label}</label>
            <input
                type="text"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
        </div>
    );
}

interface ColorFieldProps {
    label: string;
    value: string;
    onChange: (color: string) => void;
}

function ColorField({ label, value, onChange }: ColorFieldProps) {
    const handleChange = (newColor: string) => {
        if (/^#[0-9A-Fa-f]{0,6}$/.test(newColor)) {
            onChange(newColor);
        }
    };

    return (
        <div>
            <label className="block text-sm font-medium mb-2">{label}</label>
            <div className="flex gap-2">
                <input
                    type="color"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className="w-12 h-10 rounded-md cursor-pointer border border-gray-300"
                />
                <input
                    type="text"
                    value={value}
                    onChange={e => handleChange(e.target.value)}
                    placeholder="#FFFFFF"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                />
            </div>
        </div>
    );
}

interface SpeedSliderProps {
    speed: number;
    onChange: (speed: number) => void;
}

function SpeedSlider({ speed, onChange }: SpeedSliderProps) {
    return (
        <div>
            <label className="block text-sm font-medium mb-2">Speed: {speed.toFixed(1)}x</label>
            <input
                type="range"
                min="0.5"
                max="5"
                step="0.1"
                value={speed}
                onChange={e => onChange(parseFloat(e.target.value))}
                className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0.5x (Slow)</span>
                <span>5x (Fast)</span>
            </div>
        </div>
    );
}

interface BackgroundFieldProps {
    backgroundType: Zone['backgroundType'];
    backgroundUrl?: string;
    onTypeChange: (type: Zone['backgroundType']) => void;
    onUrlChange: (url: string) => void;
}

function BackgroundField({ backgroundType, backgroundUrl, onTypeChange, onUrlChange }: BackgroundFieldProps) {
    return (
        <div>
            <label className="block text-sm font-medium mb-2">Background Type</label>
            <select
                value={backgroundType}
                onChange={e => onTypeChange(e.target.value as Zone['backgroundType'])}
                className={`$"w-full px-3 py-2 border border-gray-300 rounded-md" mb-2`}
            >
                <option value="none">None (Black)</option>
                <option value="color">Color</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
            </select>

            {backgroundType === 'color' && (
                <ColorField
                    label=""
                    value={backgroundUrl || '#000000'}
                    onChange={onUrlChange}
                />
            )}

            {(backgroundType === 'image' || backgroundType === 'video') && (
                <input
                    type="text"
                    value={backgroundUrl || ''}
                    onChange={e => onUrlChange(e.target.value)}
                    placeholder={`Enter URL...`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
            )}
        </div>
    );
}

interface CheckboxFieldProps {
    id: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
}

function CheckboxField({ id, checked, onChange, label }: CheckboxFieldProps) {
    return (
        <div className="flex items-center gap-2">
            <input
                type="checkbox"
                id={id}
                checked={checked}
                onChange={e => onChange(e.target.checked)}
                className="w-4 h-4"
            />
            <label
                htmlFor={id}
                className="text-sm cursor-pointer"
            >
                {label}
            </label>
        </div>
    );
}

interface NightModeEditorProps {
    nightMode: NightMode;
    onUpdate: (updates: Partial<NightMode>) => void;
}

function NightModeEditor({ nightMode, onUpdate }: NightModeEditorProps) {
    const formatTime = (hour: number, minute: number) => `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    const handleTimeChange = (value: string, isStart: boolean) => {
        const [hours, minutes] = value.split(':').map(Number);

        if (isStart) {
            onUpdate({ startHour: hours, startMinute: minutes });
        } else {
            onUpdate({ endHour: hours, endMinute: minutes });
        }
    };

    return (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-4">
            <h3 className="font-semibold">Night Mode</h3>

            <CheckboxField
                id="night-mode-enabled"
                checked={nightMode.enabled}
                onChange={checked => onUpdate({ enabled: checked })}
                label="Enable Night Mode"
            />

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-2">Start Time</label>
                    <input
                        type="time"
                        value={formatTime(nightMode.startHour, nightMode.startMinute)}
                        onChange={e => handleTimeChange(e.target.value, true)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md time-picker-clickable"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">End Time</label>
                    <input
                        type="time"
                        value={formatTime(nightMode.endHour, nightMode.endMinute)}
                        onChange={e => handleTimeChange(e.target.value, false)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md time-picker-clickable"
                    />
                </div>
            </div>

            <CheckboxField
                id="night-mode-next-day"
                checked={nightMode.endNextDay}
                onChange={checked => onUpdate({ endNextDay: checked })}
                label="End time is next day"
            />
        </div>
    );
}
