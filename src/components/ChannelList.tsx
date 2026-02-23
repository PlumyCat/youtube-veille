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
    <div className="space-y-4">
      {channels.map((channel) => (
        <div key={channel.id} className="group flex items-center gap-5 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-300">
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-muted border border-white/10 group-hover:border-primary/50 transition-colors shadow-lg">
            {channel.thumbnail ? (
              <Image
                src={channel.thumbnail}
                alt={channel.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-2xl">
                📺
              </div>
            )}
          </div>

          <div className="flex-grow min-w-0">
            <h3 className="font-black text-base truncate text-foreground tracking-tight group-hover:text-primary transition-colors">{channel.name}</h3>
            <div className="flex items-center gap-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 truncate">
                ID: {channel.id}
              </p>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
              <a
                href={`https://youtube.com/channel/${channel.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
              >
                YouTube ↗
              </a>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleRefresh(channel.id)}
              disabled={loadingId === channel.id}
              className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary rounded-xl hover:bg-primary/20 disabled:opacity-50 border border-primary/20 transition-all active:scale-95"
            >
              {loadingId === channel.id ? '...' : 'Refresh'}
            </button>
            <button
              onClick={() => {
                if (confirm(`Supprimer ${channel.name} ?`)) {
                  onDelete(channel.id);
                }
              }}
              className="p-2.5 text-sm bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 border border-red-500/20 hover:text-white transition-all active:scale-95"
              title="Supprimer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
