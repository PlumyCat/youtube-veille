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
    <div className={`glass-card group rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-white/20 ${selected ? 'ring-2 ring-primary border-transparent' : ''}`}>
      <div className="relative overflow-hidden">
        <Link href={`/video/${id}`}>
          <div className="relative aspect-video bg-muted/50 transition-transform duration-500 group-hover:scale-105">
            {thumbnail ? (
              <Image
                src={thumbnail}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                Sans miniature
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            {duration && (
              <span className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                {formatDuration(duration)}
              </span>
            )}
          </div>
        </Link>
        {onSelect && (
          <div className="absolute top-2 left-2 z-10 transition-opacity duration-300 opacity-100 sm:opacity-0 group-hover:opacity-100">
            <input
              type="checkbox"
              checked={selected}
              onChange={(e) => onSelect(id, e.target.checked)}
              className="w-5 h-5 rounded-md border-white/20 bg-black/40 cursor-pointer accent-primary"
            />
          </div>
        )}
      </div>

      <div className="p-4">
        <Link href={`/video/${id}`}>
          <h3 className="font-semibold text-sm line-clamp-2 transition-colors group-hover:text-primary mb-2 text-foreground leading-tight">
            {title}
          </h3>
        </Link>

        <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
          <span className="truncate max-w-[60%]">{channelName}</span>
          {publishedAt && <span>{formatDate(new Date(publishedAt))}</span>}
        </div>

        <div className="flex items-center gap-2 mt-3">
          {status && (
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColors[status] || 'bg-muted text-muted-foreground'}`}>
              {statusLabels[status] || status}
            </span>
          )}
          {hasTranscript && (
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary border border-primary/30 text-[10px]" title="Transcrite">
              📝
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
