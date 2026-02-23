'use client';

import { useState } from 'react';

interface TranscriptViewerProps {
  content: string;
  source: string | null;
  videoId: string;
}

export default function TranscriptViewer({ content, source, videoId }: TranscriptViewerProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sourceLabel = source === 'gemini' ? 'Gemini AI' : 'YouTube Captions';

  return (
    <div className="glass-card rounded-3xl overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Transcription</h3>
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${source === 'gemini' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted/50 text-muted-foreground border-white/10'}`}>
            {sourceLabel}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={copyToClipboard}
            className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-white/5 text-foreground rounded-xl hover:bg-white/10 transition-all border border-white/10 active:scale-95"
          >
            {copied ? '✓ Copié' : '📋 Copier'}
          </button>
          <a
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all border border-red-500/20 active:scale-95"
          >
            ▶ YouTube
          </a>
        </div>
      </div>

      <div className="p-8 max-h-[700px] overflow-y-auto bg-black/20 custom-scrollbar">
        <p className="whitespace-pre-wrap text-sm leading-8 text-foreground/80 font-medium selection:bg-primary/30">
          {content}
        </p>
      </div>

      <div className="px-6 py-3 border-t border-white/10 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
            {content.split(' ').length} mots
          </span>
          <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
            {content.length} caractères
          </span>
        </div>
        <div className="text-[10px] font-black italic text-primary/40 uppercase tracking-widest">
          Transcrit avec succès
        </div>
      </div>
    </div>
  );
}
