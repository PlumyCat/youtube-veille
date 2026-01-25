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
    <div className="mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-750 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg transition-transform duration-200" style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>
            ▶
          </span>
          <span className="font-medium text-gray-100">{channelName}</span>
          <span className="text-sm text-gray-400">
            {videos.length} vidéo{videos.length > 1 ? 's' : ''}
          </span>
          {selectedInGroup > 0 && (
            <span className="text-sm text-blue-400">
              ({selectedInGroup} sélectionnée{selectedInGroup > 1 ? 's' : ''})
            </span>
          )}
        </div>
      </button>

      {isOpen && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
