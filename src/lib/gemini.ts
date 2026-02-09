import { GoogleGenAI } from '@google/genai';

const VALID_VIDEO_ID = /^[a-zA-Z0-9_-]{11}$/;

interface GeminiTranscriptResult {
  content: string;
  source: 'gemini';
  segmentsCount: number;
}

export async function transcribeWithGemini(videoId: string): Promise<GeminiTranscriptResult> {
  if (!VALID_VIDEO_ID.test(videoId)) {
    throw new Error('Invalid video ID format');
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY is not configured');
  }

  const ai = new GoogleGenAI({ apiKey });
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const prompt = `Tu es un assistant de veille technologique.
Analyse cette vidéo YouTube et fournis une transcription fidèle et complète du contenu parlé.

Règles :
- Transcris le contenu parlé le plus fidèlement possible.
- Si la vidéo est très longue (>1h), fournis un résumé très détaillé plutôt qu'une transcription mot à mot.
- Retourne UNIQUEMENT le texte de la transcription, sans formatage JSON, sans titres, sans balises.
- Pas de commentaires, pas d'introduction comme "Voici la transcription".
- Juste le texte brut de ce qui est dit dans la vidéo.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [prompt, videoUrl],
  });

  const text = response.text?.trim();
  if (!text) {
    throw new Error('Gemini returned empty response');
  }

  return {
    content: text,
    source: 'gemini',
    segmentsCount: text.split('\n\n').filter(p => p.trim()).length,
  };
}
