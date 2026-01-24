import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';

// GET /api/veille - List veille items
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const excludeApplied = searchParams.get('excludeApplied') === 'true';

    let query = db
      .select({
        item: schema.veilleItems,
        videoTitle: schema.videos.title,
      })
      .from(schema.veilleItems)
      .leftJoin(schema.videos, eq(schema.veilleItems.videoId, schema.videos.id))
      .orderBy(desc(schema.veilleItems.createdAt))
      .$dynamic();

    if (status) {
      query = query.where(eq(schema.veilleItems.status, status as 'discovered' | 'testing' | 'applied' | 'rejected'));
    }

    const results = await query.all();

    let items = results.map((row) => ({
      ...row.item,
      videoTitle: row.videoTitle,
    }));

    // Filter out applied/rejected if requested
    if (excludeApplied) {
      items = items.filter((item) => item.status !== 'applied' && item.status !== 'rejected');
    }

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching veille items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch veille items' },
      { status: 500 }
    );
  }
}

// POST /api/veille - Create veille item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, videoId, source } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title required' },
        { status: 400 }
      );
    }

    // Check if already exists (by title)
    const existing = await db
      .select()
      .from(schema.veilleItems)
      .where(eq(schema.veilleItems.title, title))
      .get();

    if (existing) {
      return NextResponse.json({
        success: false,
        message: 'Item already exists',
        item: existing,
      });
    }

    const item = await db
      .insert(schema.veilleItems)
      .values({
        title,
        description,
        videoId,
        source: source || 'manual',
      })
      .returning()
      .get();

    return NextResponse.json({
      success: true,
      item,
    });
  } catch (error) {
    console.error('Error creating veille item:', error);
    return NextResponse.json(
      { error: 'Failed to create veille item' },
      { status: 500 }
    );
  }
}

// PATCH /api/veille - Update veille item status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'ID and status required' },
        { status: 400 }
      );
    }

    const validStatuses = ['discovered', 'testing', 'applied', 'rejected'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = { status };
    if (status === 'applied') {
      updateData.appliedAt = new Date();
    }

    await db
      .update(schema.veilleItems)
      .set(updateData)
      .where(eq(schema.veilleItems.id, id))
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating veille item:', error);
    return NextResponse.json(
      { error: 'Failed to update veille item' },
      { status: 500 }
    );
  }
}
