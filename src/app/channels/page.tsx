'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import ChannelList from '@/components/ChannelList';
import AddChannelForm from '@/components/AddChannelForm';

interface Channel {
  id: string;
  name: string;
  thumbnail: string | null;
  addedAt: Date | null;
}

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChannels = useCallback(async () => {
    try {
      const res = await fetch('/api/channels');
      const data = await res.json();
      setChannels(data);
    } catch (error) {
      console.error('Error fetching channels:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const handleAddChannel = async (input: string) => {
    const res = await fetch('/api/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to add channel');
    }

    await fetchChannels();

    // Auto-fetch videos for the new channel
    const channel = await res.json();
    await fetch('/api/videos/fetch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelId: channel.id }),
    });
  };

  const handleDeleteChannel = async (id: string) => {
    try {
      const res = await fetch(`/api/channels?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchChannels();
      }
    } catch (error) {
      console.error('Error deleting channel:', error);
    }
  };

  const handleRefreshChannel = async (id: string) => {
    try {
      const res = await fetch('/api/videos/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId: id }),
      });
      const data = await res.json();
      alert(`${data.newVideos} nouvelle(s) vidéo(s) ajoutée(s)`);
    } catch (error) {
      console.error('Error refreshing channel:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <header className="glass-header sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="group flex items-center gap-2 text-muted-foreground hover:text-primary transition-all">
              <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-primary/10 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
              </div>
              <span className="text-xs font-bold uppercase tracking-widest">Retour</span>
            </Link>
            <h1 className="text-xl font-black tracking-tighter">GÉRER LES <span className="text-primary">CHAÎNES</span></h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-10">
        <section className="glass-card rounded-2xl p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-6">
            <h2 className="text-xs font-black uppercase tracking-widest text-primary italic mb-1">Source</h2>
            <p className="text-xl font-bold">Ajouter une chaîne</p>
          </div>
          <AddChannelForm onAdd={handleAddChannel} />
        </section>

        <section className="glass-card rounded-2xl p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest text-primary italic mb-1">Index</h2>
              <p className="text-xl font-bold">Chaînes suivies</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
              {channels.length} Total
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-4">
              <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="font-bold tracking-widest uppercase text-[10px] animate-pulse">Chargement...</p>
            </div>
          ) : (
            <ChannelList
              channels={channels}
              onDelete={handleDeleteChannel}
              onRefresh={handleRefreshChannel}
            />
          )}
        </section>
      </main>
    </div>
  );
}
