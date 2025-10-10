'use client';

import { Edit2, Copy, Trash2, Upload } from 'lucide-react';
import type { BannerProfile } from '@/lib/supabase';

interface ProfileCardProps {
    profile: BannerProfile;
    onEdit: (id: string) => void;
    onCopy: (id: string) => void;
    onDelete: (id: string) => void;
    onSetActive: (id: string) => void;
}

export default function ProfileCard({ profile, onEdit, onCopy, onDelete, onSetActive }: ProfileCardProps) {
    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
        });

    return (
        <div
            className={`rounded-lg p-4 shadow-sm transition-all hover:shadow-md hover:scale-103 ${profile.is_active ? 'border-2 border-green-600' : 'border border-gray-200'}`}
        >
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold flex-1">{profile.profile_name}</h3>
                <button
                    onClick={() => onSetActive(profile.id)}
                    className="hover:scale-110"
                    aria-label={profile.is_active ? 'Active profile' : 'Set as active profile'}
                    title={profile.is_active ? 'Active profile' : 'Set as active profile'}
                >
                    <Upload
                        size={20}
                        className={profile.is_active ? 'text-green-600' : 'text-gray-400'}
                    />
                </button>
            </div>

            <div className="space-y-1 mb-4">
                <p className="text-xs text-gray-400">
                    Created by <span className="font-bold">{profile.user_email}</span>
                </p>
                <p className="text-xs text-gray-400">
                    Created <span className="font-bold">{formatDate(profile.created_at)}</span>
                </p>
                <p className="text-xs text-gray-400">
                    Updated <span className="font-bold">{formatDate(profile.updated_at)}</span>
                </p>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => onEdit(profile.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded text-white text-sm font-medium transition-opacity hover:opacity-80 bg-blue-500"
                    aria-label="Edit profile"
                >
                    <Edit2 size={16} />
                </button>
                <button
                    onClick={() => onCopy(profile.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded text-white text-sm font-medium transition-opacity hover:opacity-80 bg-blue-500"
                    aria-label="Copy profile"
                >
                    <Copy size={16} />
                </button>
                <button
                    onClick={() => onDelete(profile.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded text-white text-sm font-medium transition-opacity hover:opacity-80 bg-red-500"
                    aria-label="Delete profile"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
}
