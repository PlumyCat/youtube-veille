'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import TranscriptViewer from '@/components/TranscriptViewer';

interface Video {
  id: string;
  channelId: string | null;
  title: string;
  thumbnail: string | null;
  publishedAt: Date | null;
  duration: number | null;
  status: string | null;
  channelName?: string;
}

interface Transcript {
  videoId: string;
  content: string;
  source: string | null;
  segmentsCount: number | null;
  createdAt: Date | null;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}h ${m}min ${s}s`;
  }
  return `${m}min ${s}s`;
}

export default function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [video, setVideo] = useState<Video | null>(null);
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [loading, setLoading] = useState(true);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      // Fetch video details
      const videosRes = await fetch(`/api/videos?limit=1000`);
      const videos = await videosRes.json();
      const foundVideo = videos.find((v: Video) => v.id === id);

      if (foundVideo) {
        setVideo(foundVideo);

        // Mark as read if transcribed
        if (foundVideo.status === 'transcribed') {
          await fetch('/api/videos', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status: 'read' }),
          });
        }
      }

      // Fetch transcript
      const transcriptRes = await fetch(`/api/transcribe?videoId=${id}`);
      if (transcriptRes.ok) {
        const transcriptData = await transcriptRes.json();
        setTranscript(transcriptData);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTranscribe = async () => {
    setTranscribing(true);
    setError(null);

    try {
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Transcription failed');
      }

      const data = await res.json();
      setTranscript(data.transcript);
      await fetchData(); // Refresh video status
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transcription failed');
    } finally {
      setTranscribing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <div className="text-gray-500">Vidéo non trouvée</div>
        <Link href="/" className="text-blue-600 hover:text-blue-800">
          ← Retour au dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            ← Retour
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Video info */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="md:flex">
            <div className="md:w-1/3 relative aspect-video md:aspect-auto">
              {video.thumbnail ? (
                <Image
                  src={video.thumbnail}
                  alt={video.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                  No thumbnail
                </div>
              )}
            </div>
            <div className="p-6 md:w-2/3">
              <h1 className="text-xl font-bold mb-2">{video.title}</h1>
              <p className="text-gray-600 mb-4">{video.channelName}</p>

              <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                {video.publishedAt && (
                  <span>
                    📅 {new Date(video.publishedAt).toLocaleDateString('fr-FR')}
                  </span>
                )}
                {video.duration && (
                  <span>⏱️ {formatDuration(video.duration)}</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={`https://www.youtube.com/watch?v=${video.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  ▶ Regarder sur YouTube
                </a>

                {!transcript && (
                  <button
                    onClick={handleTranscribe}
                    disabled={transcribing}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {transcribing ? 'Transcription...' : '📝 Transcrire'}
                  </button>
                )}
              </div>

              {error && (
                <p className="mt-4 text-red-600 text-sm">{error}</p>
              )}
            </div>
          </div>
        </div>

        {/* Transcript */}
        {transcript ? (
          <TranscriptViewer
            content={transcript.content}
            source={transcript.source}
            videoId={video.id}
          />
        ) : (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center text-gray-500">
            <p className="mb-4">Pas encore de transcription pour cette vidéo</p>
            <button
              onClick={handleTranscribe}
              disabled={transcribing}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {transcribing ? 'Transcription en cours...' : 'Lancer la transcription'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
