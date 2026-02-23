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
    <div className="min-h-screen bg-background text-foreground font-sans">
      <header className="glass-header sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-primary">
                <span className="text-2xl">📺</span>
                <h1 className="text-xl font-black tracking-tighter text-foreground">
                  YOUTUBE <span className="text-primary italic">VEILLE</span>
                </h1>
              </div>
              <Link
                href="/channels"
                className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
              >
                Gérer les chaînes →
              </Link>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:flex-none">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher..."
                  className="w-full md:w-64 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50"
                />
              </div>

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer hover:bg-white/10 transition-colors"
              >
                <option value="new">À transcrire</option>
                <option value="all">Toutes</option>
                <option value="transcribed">Transcrites</option>
                <option value="read">Lues</option>
              </select>

              <button
                onClick={handleRefreshAll}
                disabled={refreshing}
                className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20 active:scale-95 text-sm"
              >
                {refreshing ? (
                  <span className="animate-spin text-lg">⏳</span>
                ) : (
                  <span className="text-lg">🔄</span>
                )}
                {refreshing ? 'Chargement...' : 'Actualiser'}
              </button>

              <button
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' });
                  window.location.href = '/login';
                }}
                className="px-3 py-2 text-muted-foreground hover:text-foreground text-sm transition-colors cursor-pointer"
                title="Se déconnecter"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {toast && (
        <div className={`fixed top-24 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl glass-card transition-all animate-in slide-in-from-right-4 duration-500 ${
          toast.type === 'error'
            ? 'border-red-500/50 text-red-100'
            : 'border-green-500/50 text-green-100'
        }`}>
          <div className="flex items-center gap-3 font-medium">
            <span className="text-lg">{toast.type === 'error' ? '⚠️' : '✨'}</span>
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-4 opacity-40 hover:opacity-100 transition-opacity">✕</button>
          </div>
        </div>
      )}

      {selectedIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-2xl">
          <div className="glass-card bg-primary/10 border-primary/30 rounded-2xl px-6 py-4 flex items-center justify-between shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="flex flex-col">
              <span className="text-primary font-black text-[10px] uppercase tracking-widest">
                SÉLECTION
              </span>
              <span className="text-foreground font-bold text-xs opacity-80">
                {selectedIds.size} vidéo(s) marquée(s)
              </span>
            </div>
            <div className="flex items-center gap-5">
              <button
                onClick={clearSelection}
                className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleTranscribeSelected}
                disabled={transcribing}
                className="px-6 py-2.5 bg-foreground text-background font-black rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50 text-xs uppercase tracking-widest"
              >
                {transcribing ? 'Transcription...' : 'Transcrire la sélection'}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="font-bold tracking-widest uppercase text-xs animate-pulse">Chargement...</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-24 glass-card rounded-3xl p-12 max-w-lg mx-auto">
            <p className="text-muted-foreground mb-8 font-medium italic">Aucune vidéo trouvée pour ce filtre.</p>
            <Link
              href="/channels"
              className="inline-block px-8 py-3 bg-primary text-primary-foreground font-bold rounded-2xl hover:opacity-90 transition-all shadow-lg shadow-primary/20"
            >
              Ajouter des chaînes →
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-10 px-2">
              <div className="flex flex-col">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-1">
                  Tableau de bord
                </h2>
                <p className="text-2xl font-bold tracking-tight">
                  {videos.length} <span className="text-muted-foreground font-medium text-lg italic">vidéos détectées</span>
                </p>
              </div>
              <button
                onClick={selectAll}
                className="text-[10px] font-black uppercase tracking-widest text-foreground hover:text-primary transition-all py-2 px-4 rounded-xl border border-white/10 hover:border-primary/50"
              >
                Tout sélectionner
              </button>
            </div>

            <div className="space-y-4">
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
