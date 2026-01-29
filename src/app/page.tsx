'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import VideoCard from '@/components/VideoCard';
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
  const [viewMode, setViewMode] = useState<'date' | 'channel'>('date');

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

  // Load view mode from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('videoViewMode');
    if (saved === 'date' || saved === 'channel') {
      setViewMode(saved);
    }
  }, []);

  // Save view mode to localStorage
  const handleViewModeChange = (mode: 'date' | 'channel') => {
    setViewMode(mode);
    localStorage.setItem('videoViewMode', mode);
  };

  // Group videos by channel, sorted by most recent video
  const groupedVideos = useMemo(() => {
    const groups: Record<string, Video[]> = {};

    for (const video of videos) {
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
  }, [videos]);

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
              <div className="flex rounded-lg border border-gray-600 overflow-hidden">
                <button
                  onClick={() => handleViewModeChange('date')}
                  className={`px-3 py-1.5 text-sm transition-colors ${
                    viewMode === 'date'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Par date
                </button>
                <button
                  onClick={() => handleViewModeChange('channel')}
                  className={`px-3 py-1.5 text-sm transition-colors ${
                    viewMode === 'channel'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Par chaîne
                </button>
              </div>

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

      <main className="max-w-7xl mx-auto px-4 py-6">
        {selectedIds.size > 0 && (
          <div className="bg-blue-900/50 border border-blue-700 rounded-lg p-4 mb-6 flex items-center justify-between">
            <span className="text-blue-200">
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
        )}

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

            {viewMode === 'date' ? (
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
            ) : (
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
            )}
          </>
        )}
      </main>
    </div>
  );
}
