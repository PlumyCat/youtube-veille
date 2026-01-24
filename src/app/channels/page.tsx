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
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800 shadow-sm border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-blue-400 hover:text-blue-300">
              ← Retour
            </Link>
            <h1 className="text-xl font-bold text-gray-100">Gérer les chaînes</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
          <AddChannelForm onAdd={handleAddChannel} />
        </div>

        <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-100">
            Chaînes suivies ({channels.length})
          </h2>
          {loading ? (
            <div className="text-center py-8 text-gray-400">Chargement...</div>
          ) : (
            <ChannelList
              channels={channels}
              onDelete={handleDeleteChannel}
              onRefresh={handleRefreshChannel}
            />
          )}
        </div>
      </main>
    </div>
  );
}
