const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

export interface YouTubeChannel {
  id: string;
  name: string;
  thumbnail: string;
}

export interface YouTubeVideo {
  id: string;
  channelId: string;
  title: string;
  thumbnail: string;
  publishedAt: Date;
  duration: number; // seconds
}

// Extract channel ID from URL or handle
export async function resolveChannelId(input: string): Promise<string | null> {
  if (!YOUTUBE_API_KEY) {
    throw new Error('YOUTUBE_API_KEY not configured');
  }

  // Already a channel ID (starts with UC)
  if (input.startsWith('UC') && input.length === 24) {
    return input;
  }

  // URL patterns
  const patterns = [
    /youtube\.com\/channel\/(UC[\w-]+)/,
    /youtube\.com\/@([\w-]+)/,
    /youtube\.com\/c\/([\w-]+)/,
    /youtube\.com\/user\/([\w-]+)/,
  ];

  let identifier = input;
  let isHandle = false;

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) {
      identifier = match[1];
      isHandle = !identifier.startsWith('UC');
      break;
    }
  }

  // If it starts with @, it's a handle
  if (identifier.startsWith('@')) {
    identifier = identifier.slice(1);
    isHandle = true;
  }

  if (isHandle) {
    // Resolve handle to channel ID
    const res = await fetch(
      `${YOUTUBE_API_BASE}/channels?part=id&forHandle=${identifier}&key=${YOUTUBE_API_KEY}`
    );
    const data = await res.json();
    if (data.items?.length > 0) {
      return data.items[0].id;
    }

    // Try as username
    const res2 = await fetch(
      `${YOUTUBE_API_BASE}/channels?part=id&forUsername=${identifier}&key=${YOUTUBE_API_KEY}`
    );
    const data2 = await res2.json();
    if (data2.items?.length > 0) {
      return data2.items[0].id;
    }

    return null;
  }

  return identifier;
}

// Get channel details
export async function getChannelDetails(channelId: string): Promise<YouTubeChannel | null> {
  if (!YOUTUBE_API_KEY) {
    throw new Error('YOUTUBE_API_KEY not configured');
  }

  const res = await fetch(
    `${YOUTUBE_API_BASE}/channels?part=snippet&id=${channelId}&key=${YOUTUBE_API_KEY}`
  );
  const data = await res.json();

  if (!data.items?.length) {
    return null;
  }

  const channel = data.items[0];
  return {
    id: channel.id,
    name: channel.snippet.title,
    thumbnail: channel.snippet.thumbnails.default?.url || '',
  };
}

// Parse ISO 8601 duration to seconds
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  return hours * 3600 + minutes * 60 + seconds;
}

// Get recent videos from a channel
export async function getChannelVideos(
  channelId: string,
  maxResults: number = 10
): Promise<YouTubeVideo[]> {
  if (!YOUTUBE_API_KEY) {
    throw new Error('YOUTUBE_API_KEY not configured');
  }

  // First, get the uploads playlist ID
  const channelRes = await fetch(
    `${YOUTUBE_API_BASE}/channels?part=contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`
  );
  const channelData = await channelRes.json();

  if (!channelData.items?.length) {
    return [];
  }

  const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

  // Get videos from uploads playlist
  const playlistRes = await fetch(
    `${YOUTUBE_API_BASE}/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`
  );
  const playlistData = await playlistRes.json();

  if (!playlistData.items?.length) {
    return [];
  }

  // Get video details (for duration)
  const videoIds = playlistData.items.map((item: { contentDetails: { videoId: string } }) => item.contentDetails.videoId).join(',');
  const videosRes = await fetch(
    `${YOUTUBE_API_BASE}/videos?part=contentDetails&id=${videoIds}&key=${YOUTUBE_API_KEY}`
  );
  const videosData = await videosRes.json();

  const durationMap = new Map<string, number>();
  for (const video of videosData.items || []) {
    durationMap.set(video.id, parseDuration(video.contentDetails.duration));
  }

  return playlistData.items.map((item: {
    snippet: {
      resourceId: { videoId: string };
      channelId: string;
      title: string;
      thumbnails: { medium?: { url: string } };
      publishedAt: string;
    };
    contentDetails: { videoId: string };
  }) => ({
    id: item.contentDetails.videoId,
    channelId: item.snippet.channelId,
    title: item.snippet.title,
    thumbnail: item.snippet.thumbnails.medium?.url || '',
    publishedAt: new Date(item.snippet.publishedAt),
    duration: durationMap.get(item.contentDetails.videoId) || 0,
  }));
}

// Search for channel by name
export async function searchChannels(query: string): Promise<YouTubeChannel[]> {
  if (!YOUTUBE_API_KEY) {
    throw new Error('YOUTUBE_API_KEY not configured');
  }

  const res = await fetch(
    `${YOUTUBE_API_BASE}/search?part=snippet&type=channel&q=${encodeURIComponent(query)}&maxResults=5&key=${YOUTUBE_API_KEY}`
  );
  const data = await res.json();

  if (!data.items?.length) {
    return [];
  }

  return data.items.map((item: {
    id: { channelId: string };
    snippet: { title: string; thumbnails: { default?: { url: string } } };
  }) => ({
    id: item.id.channelId,
    name: item.snippet.title,
    thumbnail: item.snippet.thumbnails.default?.url || '',
  }));
}
