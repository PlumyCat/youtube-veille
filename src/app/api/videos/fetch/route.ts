import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { getChannelVideos } from '@/lib/youtube';

// POST /api/videos/fetch - Fetch new videos from channels
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channelId } = body; // Optional: fetch only from specific channel

    let channels;
    if (channelId) {
      const channel = await db
        .select()
        .from(schema.channels)
        .where(eq(schema.channels.id, channelId))
        .get();
      channels = channel ? [channel] : [];
    } else {
      channels = await db.select().from(schema.channels).all();
    }

    if (channels.length === 0) {
      return NextResponse.json(
        { error: 'No channels to fetch from' },
        { status: 400 }
      );
    }

    let totalNew = 0;
    const errors: string[] = [];

    // Fetch videos from all channels in parallel
    const results = await Promise.allSettled(
      channels.map(async (channel) => {
        const videos = await getChannelVideos(channel.id, 10);
        return { channel, videos };
      })
    );

    // Insert new videos sequentially (SQLite doesn't handle concurrent writes well)
    for (const result of results) {
      if (result.status === 'rejected') {
        errors.push(result.reason instanceof Error ? result.reason.message : 'Unknown error');
        continue;
      }

      const { channel, videos } = result.value;
      try {
        for (const video of videos) {
          const existing = await db
            .select()
            .from(schema.videos)
            .where(eq(schema.videos.id, video.id))
            .get();

          if (!existing) {
            await db
              .insert(schema.videos)
              .values({
                id: video.id,
                channelId: video.channelId,
                title: video.title,
                thumbnail: video.thumbnail,
                publishedAt: video.publishedAt,
                duration: video.duration,
                status: 'new',
              })
              .run();
            totalNew++;
          }
        }
      } catch (error) {
        errors.push(`${channel.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      newVideos: totalNew,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}
