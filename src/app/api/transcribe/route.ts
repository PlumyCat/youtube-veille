import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { transcribeVideo } from '@/lib/transcribe';

// POST /api/transcribe - Transcribe a video
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoId } = body;

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID required' },
        { status: 400 }
      );
    }

    // Check if video exists
    const video = await db
      .select()
      .from(schema.videos)
      .where(eq(schema.videos.id, videoId))
      .get();

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Check if already transcribed
    const existing = await db
      .select()
      .from(schema.transcripts)
      .where(eq(schema.transcripts.videoId, videoId))
      .get();

    if (existing) {
      return NextResponse.json({
        success: true,
        transcript: existing,
        cached: true,
      });
    }

    // Update status to transcribing
    await db
      .update(schema.videos)
      .set({ status: 'transcribing' })
      .where(eq(schema.videos.id, videoId))
      .run();

    try {
      // Transcribe the video
      const result = await transcribeVideo(videoId);

      // Save transcript
      const transcript = await db
        .insert(schema.transcripts)
        .values({
          videoId,
          content: result.content,
          source: result.source,
          segmentsCount: result.segmentsCount,
        })
        .returning()
        .get();

      // Update video status
      await db
        .update(schema.videos)
        .set({ status: 'transcribed' })
        .where(eq(schema.videos.id, videoId))
        .run();

      return NextResponse.json({
        success: true,
        transcript,
        cached: false,
      });
    } catch (error) {
      // Reset status on error
      await db
        .update(schema.videos)
        .set({ status: 'new' })
        .where(eq(schema.videos.id, videoId))
        .run();

      throw error;
    }
  } catch (error) {
    console.error('Error transcribing video:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Transcription failed' },
      { status: 500 }
    );
  }
}

// GET /api/transcribe?videoId=XXX - Get transcript
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID required' },
        { status: 400 }
      );
    }

    const transcript = await db
      .select()
      .from(schema.transcripts)
      .where(eq(schema.transcripts.videoId, videoId))
      .get();

    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(transcript);
  } catch (error) {
    console.error('Error fetching transcript:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transcript' },
      { status: 500 }
    );
  }
}
