'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import ChannelGroup from '@/components/ChannelGroup';

interface Video {
  id: string;
  channelId: string | null;
  title: string;
  thumbnail: string | null;
  publishedAt: Date | null;
  duration: number | null;
  status: string | null;
  createdAt: Date | null;
  channelName?: string;
  hasTranscript: boolean;
}

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [transcribing, setTranscribing] = useState(false);
  const [filter, setFilter] = useState<string>('new');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchVideos = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.set('status', filter);
      }
      const res = await fetch(`/api/videos?${params}`);
      const data = await res.json();
      setVideos(data);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);


  // Filter videos by search query, then group by channel
  const groupedVideos = useMemo(() => {
    const searchLower = search.toLowerCase();
    const filtered = search
      ? videos.filter(
          (v) =>
            v.title.toLowerCase().includes(searchLower) ||
            (v.channelName || '').toLowerCase().includes(searchLower)
        )
      : videos;

    const groups: Record<string, Video[]> = {};

    for (const video of filtered) {
      const channelName = video.channelName || 'Chaîne inconnue';
      if (!groups[channelName]) {
        groups[channelName] = [];
      }
      groups[channelName].push(video);
    }

    // Sort videos within each group by date (recent first)
    for (const channelName of Object.keys(groups)) {
      groups[channelName].sort((a, b) => {
        const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return dateB - dateA;
      });
    }

    // Sort groups by most recent video date
    const sortedEntries = Object.entries(groups).sort(([, videosA], [, videosB]) => {
      const latestA = videosA[0]?.publishedAt ? new Date(videosA[0].publishedAt).getTime() : 0;
      const latestB = videosB[0]?.publishedAt ? new Date(videosB[0].publishedAt).getTime() : 0;
      return latestB - latestA;
    });

    return sortedEntries;
  }, [videos, search]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleRefreshAll = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/videos/fetch', { method: 'POST', body: JSON.stringify({}) });
      const data = await res.json();
      if (data.newVideos > 0 || data.markedUnavailable > 0) {
        await fetchVideos();
      }
      const parts: string[] = [];
      parts.push(`${data.newVideos} nouvelle(s) vidéo(s)`);
      if (data.markedUnavailable > 0) {
        parts.push(`${data.markedUnavailable} supprimée(s)`);
      }
      showToast(parts.join(' • '));
    } catch (error) {
      console.error('Error refreshing:', error);
      showToast('Erreur lors du rafraîchissement', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSelect = (id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const handleTranscribeSelected = async () => {
    if (selectedIds.size === 0) return;

    setTranscribing(true);
    const ids = Array.from(selectedIds);

    for (const videoId of ids) {
      try {
        await fetch('/api/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoId }),
        });
      } catch (error) {
        console.error(`Error transcribing ${videoId}:`, error);
      }
    }

    setSelectedIds(new Set());
    await fetchVideos();
    setTranscribing(false);
  };

  const selectAll = () => {
    setSelectedIds(new Set(videos.map((v) => v.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800 shadow-sm sticky top-0 z-10 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-100">📺 YouTube Veille</h1>
              <Link
                href="/channels"
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Gérer les chaînes →
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="px-3 py-1.5 border border-gray-600 rounded text-sm bg-gray-700 text-gray-100 placeholder-gray-400 w-48"
              />

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-1.5 border border-gray-600 rounded text-sm bg-gray-700 text-gray-100"
              >
                <option value="new">À transcrire</option>
                <option value="all">Toutes</option>
                <option value="transcribed">Transcrites</option>
                <option value="read">Lues</option>
              </select>

              <button
                onClick={handleRefreshAll}
                disabled={refreshing}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                {refreshing ? 'Chargement...' : '🔄 Actualiser'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {toast && (
        <div className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm transition-all ${
          toast.type === 'error'
            ? 'bg-red-900 text-red-200 border border-red-700'
            : 'bg-green-900 text-green-200 border border-green-700'
        }`}>
          <div className="flex items-center gap-2">
            <span>{toast.type === 'error' ? '⚠️' : '✓'} {toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100">✕</button>
          </div>
        </div>
      )}

      {selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-800/95 backdrop-blur border-t border-blue-700 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <span className="text-blue-200 text-sm">
              {selectedIds.size} vidéo(s) sélectionnée(s)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={clearSelection}
                className="px-3 py-1.5 text-sm text-blue-400 hover:text-blue-300"
              >
                Annuler
              </button>
              <button
                onClick={handleTranscribeSelected}
                disabled={transcribing}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm"
              >
                {transcribing ? 'Transcription...' : '📝 Transcrire la sélection'}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Chargement...</div>
        ) : videos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">Aucune vidéo</p>
            <Link
              href="/channels"
              className="text-blue-400 hover:text-blue-300"
            >
              Ajouter des chaînes pour commencer
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-400">
                {videos.length} vidéo(s)
              </p>
              <button
                onClick={selectAll}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Tout sélectionner
              </button>
            </div>

            <div>
              {groupedVideos.map(([channelName, channelVideos]) => (
                <ChannelGroup
                  key={channelName}
                  channelName={channelName}
                  videos={channelVideos}
                  selectedIds={selectedIds}
                  onSelect={handleSelect}
                  defaultOpen={true}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
