'use client';

import Image from 'next/image';
import { useState } from 'react';

interface Channel {
  id: string;
  name: string;
  thumbnail: string | null;
  addedAt: Date | null;
}

interface ChannelListProps {
  channels: Channel[];
  onDelete: (id: string) => void;
  onRefresh: (id: string) => void;
}

export default function ChannelList({ channels, onDelete, onRefresh }: ChannelListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleRefresh = async (id: string) => {
    setLoadingId(id);
    await onRefresh(id);
    setLoadingId(null);
  };

  if (channels.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        Aucune chaîne suivie. Ajoutez une chaîne pour commencer.
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-700">
      {channels.map((channel) => (
        <div key={channel.id} className="flex items-center gap-4 py-4">
          <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
            {channel.thumbnail ? (
              <Image
                src={channel.thumbnail}
                alt={channel.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl">
                📺
              </div>
            )}
          </div>

          <div className="flex-grow min-w-0">
            <h3 className="font-medium truncate text-gray-100">{channel.name}</h3>
            <p className="text-sm text-gray-400 truncate">
              <a
                href={`https://youtube.com/channel/${channel.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-400"
              >
                Voir sur YouTube ↗
              </a>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleRefresh(channel.id)}
              disabled={loadingId === channel.id}
              className="px-3 py-1.5 text-sm bg-blue-900/50 text-blue-300 rounded hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingId === channel.id ? '...' : '🔄 Refresh'}
            </button>
            <button
              onClick={() => {
                if (confirm(`Supprimer ${channel.name} ?`)) {
                  onDelete(channel.id);
                }
              }}
              className="px-3 py-1.5 text-sm bg-red-900/50 text-red-300 rounded hover:bg-red-800"
            >
              🗑️
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
