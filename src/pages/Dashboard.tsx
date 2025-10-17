'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Zone } from '@/lib/supabase';

import Header from '@/components/Header';
import ProfileCard from '@/components/ProfileCard';
import Preview from '@/components/Preview';
import Editor from '@/components/Editor';
import useProfiles from '@/hooks/useProfiles';

export default function DashboardPage() {
    const { user } = useAuth();
    const { profils, loading } = useProfiles();

    const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
    const [editingProfileName, setEditingProfileName] = useState('');
    const [editingZones, setEditingZones] = useState<Zone[]>([]);

    const handleCreateProfile = () => {
        setEditingProfileId('new');
        setEditingProfileName('');
        setEditingZones([
            {
                id: 1,
                text: 'Zone 1',
                color: '#FFFFFF',
                speed: 1,
                displayMode: 'text',
                backgroundType: 'none',
                forceUppercase: false,
                lineMode: 'single'
            },
            {
                id: 2,
                text: 'Zone 2',
                color: '#FFFFFF',
                speed: 1,
                displayMode: 'text',
                backgroundType: 'none',
                forceUppercase: false,
                lineMode: 'single'
            },
            {
                id: 3,
                text: 'Zone 3',
                color: '#FFFFFF',
                speed: 1,
                displayMode: 'text',
                backgroundType: 'none',
                forceUppercase: false,
                lineMode: 'single'
            },
            {
                id: 4,
                text: 'Zone 4',
                color: '#FFFFFF',
                speed: 1,
                displayMode: 'text',
                backgroundType: 'none',
                forceUppercase: false,
                lineMode: 'single'
            }
        ]);
    };

    const handleEdit = (id: string) => {
        const profile = profils.find(p => p.id === id);

        if (profile) {
            setEditingProfileId(id);
            setEditingProfileName(profile.profile_name);
            setEditingZones(profile.zones_data);
        }
    };

    const handleCancelEdit = () => {
        setEditingProfileId(null);
        setEditingProfileName('');
    };

    const handleSave = () => {
        setEditingProfileId(null);
    };

    const handleUpdateZone = (zoneId: number, updates: Partial<Zone>) => {
        setEditingZones(zones => zones.map(zone => (zone.id === zoneId ? { ...zone, ...updates } : zone)));
    };

    const handleCopy = (id: string) => {};

    const handleDelete = (id: string) => {};

    const handleSetActive = (id: string) => {};

    return (
        <div className="min-h-screen">
            <Header />

            <main className="container mx-auto px-4 py-8">
                {/* Welcome */}
                <div className="mb-8">
                    <p className="text-sm mb-2 text-[#A1A1A1] font-[family-name:var(--font-geist-sans)]">
                        {new Date().toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: '2-digit'
                        })}
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <h1 className="text-2xl sm:text-3xl font-normal font-[family-name:var(--font-geist-sans)]">
                            Welcome, <span className="font-semibold">{user?.email}</span> ! 👋
                        </h1>
                        <button
                            onClick={handleCreateProfile}
                            className="flex items-center gap-2 px-4 py-2 rounded-md text-white font-medium transition-opacity hover:opacity-90 self-start sm:self-auto bg-green-600 font-[family-name:var(--font-geist-sans)]"
                        >
                            <Plus size={20} />
                            Create new profile
                        </button>
                    </div>
                </div>

                {/* Profiles */}
                {loading ? (
                    <div className="text-center py-12 text-[#A1A1A1]">Loading profiles...</div>
                ) : profils.length === 0 && !editingProfileId ? (
                    <div className="text-center py-12 text-[#A1A1A1]">No profiles yet. Create your first profile!</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                        {profils.map(profile => (
                            <ProfileCard
                                key={profile.id}
                                profile={profile}
                                onEdit={handleEdit}
                                onCopy={handleCopy}
                                onDelete={handleDelete}
                                onSetActive={handleSetActive}
                            />
                        ))}
                    </div>
                )}

                {editingProfileId && (
                    <div className="mt-8 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold font-[family-name:var(--font-geist-sans)]">
                                {editingProfileId === 'new' ? 'Create New Profile' : 'Edit Profile'}
                            </h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleCancelEdit}
                                    className="px-4 py-2 rounded-md border border-gray-300 font-[family-name:var(--font-geist-sans)] hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-4 py-2 rounded-md text-white bg-green-600 font-[family-name:var(--font-geist-sans)] hover:opacity-90"
                                >
                                    Save
                                </button>
                            </div>
                        </div>

                        {/* Profile name */}
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                            <label className="block text-sm font-medium mb-2 font-[family-name:var(--font-geist-sans)]">Name</label>
                            <input
                                type="text"
                                value={editingProfileName}
                                onChange={e => setEditingProfileName(e.target.value)}
                                placeholder="Enter profile name..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md font-[family-name:var(--font-geist-sans)]"
                            />
                        </div>

                        {/* Preview and Editor */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                            <div className="lg:sticky lg:top-4">
                                <Preview zones={editingZones} />
                            </div>
                            <div className="bg-white rounded-lg p-6 shadow-sm">
                                <h3 className="text-lg font-semibold mb-8">Configuration</h3>
                                <Editor
                                    zones={editingZones}
                                    onUpdateZone={handleUpdateZone}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
