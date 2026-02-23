'use client';

import { useState } from 'react';
import VideoCard from './VideoCard';

interface Video {
  id: string;
  title: string;
  thumbnail: string | null;
  channelName?: string;
  publishedAt: Date | null;
  duration: number | null;
  status: string | null;
  hasTranscript: boolean;
}

interface ChannelGroupProps {
  channelName: string;
  videos: Video[];
  selectedIds: Set<string>;
  onSelect: (id: string, selected: boolean) => void;
  defaultOpen?: boolean;
}

export default function ChannelGroup({
  channelName,
  videos,
  selectedIds,
  onSelect,
  defaultOpen = true,
}: ChannelGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const selectedInGroup = videos.filter((v) => selectedIds.has(v.id)).length;

  return (
    <div className="mb-8">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group w-full flex items-center justify-between px-5 py-3.5 glass-card rounded-xl hover:bg-white/5 transition-all duration-300"
      >
        <div className="flex items-center gap-4">
          <div className={`p-1.5 rounded-lg bg-primary/10 text-primary transition-transform duration-300 ${isOpen ? 'rotate-90' : 'rotate-0'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
          </div>
          <div className="flex flex-col items-start">
            <span className="font-bold text-base text-foreground tracking-tight group-hover:text-primary transition-colors">{channelName}</span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                {videos.length} vidéo{videos.length > 1 ? 's' : ''}
              </span>
              {selectedInGroup > 0 && (
                <>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                  <span className="text-[11px] font-bold text-primary italic">
                    {selectedInGroup} sélectionnée{selectedInGroup > 1 ? 's' : ''}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="text-muted-foreground/40 group-hover:text-primary/60 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
        </div>
      </button>

      {isOpen && (
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              id={video.id}
              title={video.title}
              thumbnail={video.thumbnail || ''}
              channelName={video.channelName}
              publishedAt={video.publishedAt}
              duration={video.duration}
              status={video.status}
              hasTranscript={video.hasTranscript}
              selected={selectedIds.has(video.id)}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
