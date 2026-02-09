import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';

// GET /api/videos/[id] - Get a single video by ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await db
      .select({
        video: schema.videos,
        channel: schema.channels,
        hasTranscript: schema.transcripts.videoId,
      })
      .from(schema.videos)
      .leftJoin(schema.channels, eq(schema.videos.channelId, schema.channels.id))
      .leftJoin(schema.transcripts, eq(schema.videos.id, schema.transcripts.videoId))
      .where(eq(schema.videos.id, id))
      .get();

    if (!result) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...result.video,
      channelName: result.channel?.name,
      channelThumbnail: result.channel?.thumbnail,
      hasTranscript: !!result.hasTranscript,
    });
  } catch (error) {
    console.error('Error fetching video:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video' },
      { status: 500 }
    );
  }
}
