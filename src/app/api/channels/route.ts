import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { resolveChannelId, getChannelDetails } from '@/lib/youtube';

// GET /api/channels - List all channels
export async function GET() {
  try {
    const channels = await db.select().from(schema.channels).all();
    return NextResponse.json(channels);
  } catch (error) {
    console.error('Error fetching channels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch channels' },
      { status: 500 }
    );
  }
}

// POST /api/channels - Add a new channel
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input } = body; // URL, handle, or channel ID

    if (!input) {
      return NextResponse.json(
        { error: 'Channel URL or ID required' },
        { status: 400 }
      );
    }

    // Resolve to channel ID
    const channelId = await resolveChannelId(input);
    if (!channelId) {
      return NextResponse.json(
        { error: 'Could not find channel' },
        { status: 404 }
      );
    }

    // Check if already exists
    const existing = await db
      .select()
      .from(schema.channels)
      .where(eq(schema.channels.id, channelId))
      .get();

    if (existing) {
      return NextResponse.json(
        { error: 'Channel already added', channel: existing },
        { status: 409 }
      );
    }

    // Get channel details
    const details = await getChannelDetails(channelId);
    if (!details) {
      return NextResponse.json(
        { error: 'Could not fetch channel details' },
        { status: 404 }
      );
    }

    // Insert channel
    const channel = await db
      .insert(schema.channels)
      .values({
        id: details.id,
        name: details.name,
        thumbnail: details.thumbnail,
      })
      .returning()
      .get();

    return NextResponse.json(channel, { status: 201 });
  } catch (error) {
    console.error('Error adding channel:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add channel' },
      { status: 500 }
    );
  }
}

// DELETE /api/channels?id=XXX - Remove a channel
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Channel ID required' },
        { status: 400 }
      );
    }

    // Delete associated videos and transcripts first
    const videos = await db
      .select()
      .from(schema.videos)
      .where(eq(schema.videos.channelId, id))
      .all();

    for (const video of videos) {
      await db
        .delete(schema.transcripts)
        .where(eq(schema.transcripts.videoId, video.id))
        .run();
    }

    await db
      .delete(schema.videos)
      .where(eq(schema.videos.channelId, id))
      .run();

    await db
      .delete(schema.channels)
      .where(eq(schema.channels.id, id))
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting channel:', error);
    return NextResponse.json(
      { error: 'Failed to delete channel' },
      { status: 500 }
    );
  }
}
