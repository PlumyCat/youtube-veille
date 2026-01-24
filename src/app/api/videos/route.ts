import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';

// GET /api/videos - List all videos with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = db
      .select({
        video: schema.videos,
        channel: schema.channels,
        hasTranscript: schema.transcripts.videoId,
      })
      .from(schema.videos)
      .leftJoin(schema.channels, eq(schema.videos.channelId, schema.channels.id))
      .leftJoin(schema.transcripts, eq(schema.videos.id, schema.transcripts.videoId))
      .orderBy(desc(schema.videos.publishedAt))
      .limit(limit)
      .$dynamic();

    if (channelId) {
      query = query.where(eq(schema.videos.channelId, channelId));
    }

    if (status) {
      query = query.where(eq(schema.videos.status, status as 'new' | 'transcribing' | 'transcribed' | 'read'));
    }

    const results = await query.all();

    const videos = results.map((row) => ({
      ...row.video,
      channelName: row.channel?.name,
      channelThumbnail: row.channel?.thumbnail,
      hasTranscript: !!row.hasTranscript,
    }));

    return NextResponse.json(videos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}

// PATCH /api/videos - Update video status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Video ID and status required' },
        { status: 400 }
      );
    }

    const validStatuses = ['new', 'transcribing', 'transcribed', 'read'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    await db
      .update(schema.videos)
      .set({ status })
      .where(eq(schema.videos.id, id))
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating video:', error);
    return NextResponse.json(
      { error: 'Failed to update video' },
      { status: 500 }
    );
  }
}
