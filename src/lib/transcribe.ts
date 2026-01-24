import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execFileAsync = promisify(execFile);

// Strict validation for YouTube video IDs (11 chars: alphanumeric, hyphens, underscores)
const VALID_VIDEO_ID = /^[a-zA-Z0-9_-]{11}$/;

export interface TranscriptResult {
  content: string;
  source: 'youtube_captions' | 'whisper_ai';
  segmentsCount: number;
}

/**
 * Validate YouTube video ID format
 * @throws Error if invalid
 */
function validateVideoId(videoId: string): void {
  if (!videoId || typeof videoId !== 'string') {
    throw new Error('Video ID is required');
  }
  if (!VALID_VIDEO_ID.test(videoId)) {
    throw new Error('Invalid video ID format');
  }
}

// Extract transcript using yt-dlp (secure version using execFile)
export async function transcribeVideoDirect(videoId: string): Promise<TranscriptResult> {
  // Validate input to prevent command injection
  validateVideoId(videoId);

  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const tmpDir = path.join(os.tmpdir(), 'youtube-veille');
  const outputPath = path.join(tmpDir, videoId);

  // Ensure temp directory exists with restrictive permissions
  await fs.mkdir(tmpDir, { recursive: true, mode: 0o700 });

  try {
    // Add deno to PATH for yt-dlp JavaScript runtime
    const homeDir = os.homedir();
    const pathWithDeno = `${homeDir}/.deno/bin:${process.env.PATH}`;

    // Use execFile with array arguments (secure - no shell interpolation)
    await execFileAsync('yt-dlp', [
      '--cookies-from-browser', 'chrome',
      '--write-auto-sub',
      '--skip-download',
      '--sub-format', 'vtt',
      '--sub-lang', 'fr,en',
      '-o', outputPath,
      videoUrl
    ], {
      maxBuffer: 10 * 1024 * 1024,
      timeout: 120000,
      env: { ...process.env, PATH: pathWithDeno }
    });

    // Check for subtitle files - prioritize French
    const files = await fs.readdir(tmpDir);
    const frSubFile = files.find(f => f.startsWith(videoId) && f.includes('.fr') && f.endsWith('.vtt'));
    const enSubFile = files.find(f => f.startsWith(videoId) && f.includes('.en') && f.endsWith('.vtt'));
    const subFile = frSubFile || enSubFile || files.find(f => f.startsWith(videoId) && f.endsWith('.vtt'));

    if (subFile) {
      const vttContent = await fs.readFile(path.join(tmpDir, subFile), 'utf-8');
      const content = parseVTT(vttContent);

      // Clean up all subtitle files
      for (const f of files.filter(f => f.startsWith(videoId) && f.endsWith('.vtt'))) {
        await fs.unlink(path.join(tmpDir, f)).catch((err) => {
          console.warn(`Failed to clean up temp file: ${f}`, err.message);
        });
      }

      return {
        content,
        source: 'youtube_captions',
        segmentsCount: content.split('\n\n').filter(p => p.trim()).length,
      };
    }

    throw new Error('No subtitles available for this video');
  } catch (error) {
    // Clean up any partial files
    const files = await fs.readdir(tmpDir).catch(() => []);
    for (const file of files) {
      if (file.startsWith(videoId)) {
        await fs.unlink(path.join(tmpDir, file)).catch(() => {});
      }
    }

    throw new Error(
      `Failed to get transcript: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

function parseVTT(vtt: string): string {
  const lines = vtt.split('\n');
  const textLines: string[] = [];
  let inCue = false;
  let lastLine = '';

  for (const line of lines) {
    // Skip WEBVTT header and empty lines
    if (line.startsWith('WEBVTT') || line.startsWith('Kind:') || line.startsWith('Language:')) {
      continue;
    }

    // Timestamp line indicates start of cue
    if (line.includes('-->')) {
      inCue = true;
      continue;
    }

    // Process cue text
    if (inCue && line.trim()) {
      // Remove VTT formatting tags and HTML entities
      const cleanLine = line
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .trim();

      // Skip duplicate lines (common in auto-generated subs)
      if (cleanLine && cleanLine !== lastLine) {
        textLines.push(cleanLine);
        lastLine = cleanLine;
      }
    }

    // Empty line ends the cue
    if (line.trim() === '') {
      inCue = false;
    }
  }

  // Join lines and clean up spacing
  return textLines
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Alias for backwards compatibility
export const transcribeVideo = transcribeVideoDirect;
