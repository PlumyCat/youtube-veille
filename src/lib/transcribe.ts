import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

export interface TranscriptResult {
  content: string;
  source: 'youtube_captions' | 'whisper_ai';
  segmentsCount: number;
}

// Extract transcript using yt-dlp
export async function transcribeVideoDirect(videoId: string): Promise<TranscriptResult> {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const tmpDir = path.join(os.tmpdir(), 'youtube-veille');
  const outputPath = path.join(tmpDir, videoId);

  // Ensure temp directory exists
  await fs.mkdir(tmpDir, { recursive: true });

  try {
    // Try to get auto-generated subtitles (with cookies from Chrome to avoid bot detection)
    // Add deno to PATH for yt-dlp JavaScript runtime
    const homeDir = os.homedir();
    const pathWithDeno = `${homeDir}/.deno/bin:${process.env.PATH}`;

    await execAsync(
      `yt-dlp --cookies-from-browser chrome --write-auto-sub --skip-download --sub-format vtt --sub-lang fr,en -o "${outputPath}" "${videoUrl}"`,
      { maxBuffer: 10 * 1024 * 1024, timeout: 120000, env: { ...process.env, PATH: pathWithDeno } }
    );

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
        await fs.unlink(path.join(tmpDir, f)).catch(() => {});
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
