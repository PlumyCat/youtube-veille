'use client';

import Image from 'next/image';
import Link from 'next/link';

interface VideoCardProps {
  id: string;
  title: string;
  thumbnail: string;
  channelName?: string;
  publishedAt: Date | null;
  duration: number | null;
  status: string | null;
  hasTranscript: boolean;
  selected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Aujourd'hui";
  if (days === 1) return 'Hier';
  if (days < 7) return `Il y a ${days} jours`;
  if (days < 30) return `Il y a ${Math.floor(days / 7)} sem.`;
  return date.toLocaleDateString('fr-FR');
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-900 text-blue-200 border border-blue-700',
  transcribing: 'bg-yellow-900 text-yellow-200 border border-yellow-700',
  transcribed: 'bg-green-900 text-green-200 border border-green-700',
  read: 'bg-gray-700 text-gray-300 border border-gray-600',
};

const statusLabels: Record<string, string> = {
  new: 'Nouveau',
  transcribing: 'En cours...',
  transcribed: 'Transcrit',
  read: 'Lu',
};

export default function VideoCard({
  id,
  title,
  thumbnail,
  channelName,
  publishedAt,
  duration,
  status,
  hasTranscript,
  selected,
  onSelect,
}: VideoCardProps) {
  return (
    <div className={`bg-gray-800 rounded-lg shadow-sm border border-gray-700 overflow-hidden hover:shadow-md transition-shadow ${selected ? 'ring-2 ring-blue-500' : ''}`}>
      <div className="relative">
        <Link href={`/video/${id}`}>
          <div className="relative aspect-video bg-gray-700">
            {thumbnail ? (
              <Image
                src={thumbnail}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                Pas de miniature
              </div>
            )}
            {duration && (
              <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                {formatDuration(duration)}
              </span>
            )}
          </div>
        </Link>
        {onSelect && (
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelect(id, e.target.checked)}
            className="absolute top-2 left-2 w-5 h-5 rounded cursor-pointer"
          />
        )}
      </div>

      <div className="p-3">
        <Link href={`/video/${id}`}>
          <h3 className="font-medium text-sm line-clamp-2 hover:text-blue-400 mb-1 text-gray-100">
            {title}
          </h3>
        </Link>

        <div className="flex items-center justify-between text-xs text-gray-400">
          <span className="truncate">{channelName}</span>
          {publishedAt && <span>{formatDate(new Date(publishedAt))}</span>}
        </div>

        <div className="flex items-center gap-2 mt-2">
          {status && (
            <span className={`text-xs px-2 py-0.5 rounded ${statusColors[status] || 'bg-gray-700'}`}>
              {statusLabels[status] || status}
            </span>
          )}
          {hasTranscript && (
            <span className="text-xs px-2 py-0.5 rounded bg-purple-900 text-purple-200 border border-purple-700">
              📝
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
