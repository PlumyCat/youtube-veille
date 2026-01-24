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

  const sourceLabel = source === 'whisper_ai' ? 'Whisper AI' : 'YouTube Captions';

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">Transcription</h3>
          <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-600">
            {sourceLabel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyToClipboard}
            className="px-3 py-1.5 text-sm bg-gray-100 rounded hover:bg-gray-200"
          >
            {copied ? '✓ Copié' : '📋 Copier'}
          </button>
          <a
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            ▶ YouTube
          </a>
        </div>
      </div>

      <div className="p-4 max-h-[600px] overflow-y-auto">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
          {content}
        </p>
      </div>

      <div className="px-4 py-2 border-t bg-gray-50 text-xs text-gray-500">
        {content.split(' ').length} mots • {content.length} caractères
      </div>
    </div>
  );
}
