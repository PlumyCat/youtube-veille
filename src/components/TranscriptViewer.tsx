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
  const sourceBadgeClass = source === 'gemini'
    ? 'bg-blue-900 text-blue-200 border border-blue-700'
    : 'bg-gray-700 text-gray-300 border border-gray-600';

  return (
    <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-gray-100">Transcription</h3>
          <span className={`text-xs px-2 py-0.5 rounded ${sourceBadgeClass}`}>
            {sourceLabel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyToClipboard}
            className="px-3 py-1.5 text-sm bg-gray-700 text-gray-200 rounded hover:bg-gray-600"
          >
            {copied ? '✓ Copié' : '📋 Copier'}
          </button>
          <a
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-sm bg-red-900 text-red-200 rounded hover:bg-red-800"
          >
            ▶ YouTube
          </a>
        </div>
      </div>

      <div className="p-4 max-h-[600px] overflow-y-auto">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
          {content}
        </p>
      </div>

      <div className="px-4 py-2 border-t border-gray-700 bg-gray-800 text-xs text-gray-500">
        {content.split(' ').length} mots • {content.length} caractères
      </div>
    </div>
  );
}
