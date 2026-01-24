'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import VideoCard from '@/components/VideoCard';

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
  const [filter, setFilter] = useState<string>('all');

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

  const handleRefreshAll = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/videos/fetch', { method: 'POST', body: JSON.stringify({}) });
      const data = await res.json();
      if (data.newVideos > 0) {
        await fetchVideos();
      }
      alert(`${data.newVideos} nouvelle(s) vidéo(s) ajoutée(s)`);
    } catch (error) {
      console.error('Error refreshing:', error);
      alert('Erreur lors du rafraîchissement');
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
    const newVideos = videos.filter((v) => v.status === 'new');
    setSelectedIds(new Set(newVideos.map((v) => v.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">📺 YouTube Veille</h1>
              <Link
                href="/channels"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Gérer les chaînes →
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-1.5 border rounded text-sm"
              >
                <option value="all">Toutes</option>
                <option value="new">Nouvelles</option>
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

      <main className="max-w-7xl mx-auto px-4 py-6">
        {selectedIds.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
            <span className="text-blue-800">
              {selectedIds.size} vidéo(s) sélectionnée(s)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={clearSelection}
                className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800"
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
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500">Chargement...</div>
        ) : videos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">Aucune vidéo</p>
            <Link
              href="/channels"
              className="text-blue-600 hover:text-blue-800"
            >
              Ajouter des chaînes pour commencer
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">{videos.length} vidéo(s)</p>
              <button
                onClick={selectAll}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Sélectionner les nouvelles
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                  onSelect={handleSelect}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
