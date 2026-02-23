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
      const [videoRes, transcriptRes] = await Promise.all([
        fetch(`/api/videos/${id}`),
        fetch(`/api/transcribe?videoId=${id}`),
      ]);

      if (videoRes.ok) {
        const videoData = await videoRes.json();
        setVideo(videoData);
      }

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

  // Mark as read on first load if video is transcribed
  useEffect(() => {
    if (video && video.status === 'transcribed' && transcript) {
      fetch('/api/videos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'read' }),
      });
      setVideo((prev) => prev ? { ...prev, status: 'read' } : prev);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

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
      setVideo((prev) => prev ? { ...prev, status: 'transcribed' } : prev);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transcription failed');
    } finally {
      setTranscribing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="font-bold tracking-widest uppercase text-xs text-muted-foreground animate-pulse">Chargement...</p>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
        <div className="text-muted-foreground italic">Vidéo non trouvée</div>
        <Link href="/" className="px-6 py-2 bg-primary/10 text-primary border border-primary/20 font-bold rounded-xl hover:bg-primary/20 transition-all text-xs uppercase tracking-widest">
          ← Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <header className="glass-header sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <Link href="/" className="group flex items-center gap-2 text-muted-foreground hover:text-primary transition-all">
            <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-primary/10 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            </div>
            <span className="text-xs font-bold uppercase tracking-widest">Retour</span>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        {/* Video info */}
        <div className="glass-card rounded-3xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="md:flex">
            <div className="md:w-2/5 relative aspect-video md:aspect-auto">
              {video.thumbnail ? (
                <>
                  <Image
                    src={video.thumbnail}
                    alt={video.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent md:hidden" />
                </>
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-sm">
                  Pas de miniature
                </div>
              )}
            </div>
            <div className="p-8 md:w-3/5 flex flex-col justify-center">
              <div className="mb-4">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-primary italic mb-2">{video.channelName || 'Chaîne inconnue'}</h2>
                <h1 className="text-2xl font-black tracking-tight leading-tight text-foreground">{video.title}</h1>
              </div>

              <div className="flex flex-wrap gap-6 text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-8 items-center">
                {video.publishedAt && (
                  <div className="flex items-center gap-2">
                    <span className="text-primary">📅</span>
                    <span>{new Date(video.publishedAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                )}
                {video.duration && (
                  <div className="flex items-center gap-2">
                    <span className="text-primary">⏱️</span>
                    <span>{formatDuration(video.duration)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <a
                  href={`https://www.youtube.com/watch?v=${video.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 bg-[#FF0000] text-white font-black rounded-2xl hover:opacity-90 transition-all shadow-xl shadow-red-500/20 text-xs uppercase tracking-widest"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" /></svg>
                  YOUTUBE
                </a>

                {!transcript && (
                  <button
                    onClick={handleTranscribe}
                    disabled={transcribing}
                    className="px-6 py-3 bg-primary text-primary-foreground font-black rounded-2xl hover:opacity-90 disabled:opacity-50 transition-all shadow-xl shadow-primary/20 text-xs uppercase tracking-widest"
                  >
                    {transcribing ? 'Transcription...' : 'Transcrire'}
                  </button>
                )}
              </div>

              {error && (
                <div className="mt-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-widest">
                  ⚠️ {error}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Transcript */}
        <section className="animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="mb-6 px-2">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-1">Analyse</h2>
            <p className="text-xl font-bold tracking-tight">Transcription détaillée</p>
          </div>

          {transcript ? (
            <TranscriptViewer
              content={transcript.content}
              source={transcript.source}
              videoId={video.id}
            />
          ) : (
            <div className="glass-card rounded-3xl p-16 text-center shadow-2xl">
              <div className="mb-6 text-4xl opacity-20">📝</div>
              <p className="text-muted-foreground mb-8 font-medium italic">Aucune transcription disponible pour le moment.</p>
              <button
                onClick={handleTranscribe}
                disabled={transcribing}
                className="inline-block px-10 py-4 bg-primary text-primary-foreground font-black rounded-2xl hover:opacity-90 disabled:opacity-50 transition-all shadow-xl shadow-primary/20 text-xs uppercase tracking-widest"
              >
                {transcribing ? 'LANCEMENT...' : 'LANCER LA TRANSCRIPTION'}
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
