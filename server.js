const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_BASE = 'https://www.googleapis.com/youtube/v3';
const MAX_VIDEOS = 50;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const EMOTIONAL_WORDS = [
  'amazing',
  'awesome',
  'shocking',
  'unbelievable',
  'insane',
  'ultimate',
  'best',
  'secret',
  'must',
  'powerful',
  'incredible',
  'epic'
];

function scoreTitle(title) {
  const length = title.length;
  const hasNumber = /\d/.test(title);
  const hasQuestionMark = title.includes('?');
  const hasEmotionalWord = EMOTIONAL_WORDS.some((word) =>
    title.toLowerCase().includes(word)
  );

  let score = 50;

  if (length >= 40 && length <= 70) score += 15;
  else if (length >= 30 && length <= 85) score += 8;

  if (hasNumber) score += 15;
  if (hasQuestionMark) score += 10;
  if (hasEmotionalWord) score += 10;

  if (score > 100) score = 100;

  return {
    title,
    length,
    hasNumber,
    hasQuestionMark,
    hasEmotionalWord,
    score
  };
}

function calculateChannelAnalytics(videos) {
  const hourMap = new Map();
  let totalEngagementRate = 0;

  const enrichedVideos = videos.map((video) => {
    const publishDate = new Date(video.snippet.publishedAt);
    const hourPosted = publishDate.getUTCHours();

    const views = Number(video.statistics.viewCount || 0);
    const likes = Number(video.statistics.likeCount || 0);
    const comments = Number(video.statistics.commentCount || 0);

    const engagementRate = views > 0 ? ((likes + comments) / views) * 100 : 0;
    totalEngagementRate += engagementRate;

    if (!hourMap.has(hourPosted)) {
      hourMap.set(hourPosted, { totalViews: 0, count: 0 });
    }

    const bucket = hourMap.get(hourPosted);
    bucket.totalViews += views;
    bucket.count += 1;

    return {
      id: video.id,
      title: video.snippet.title,
      views,
      likes,
      comments,
      publishDate: video.snippet.publishedAt,
      hourPosted,
      engagementRate: Number(engagementRate.toFixed(2)),
      titleAnalysis: scoreTitle(video.snippet.title)
    };
  });

  const hourlyPerformance = Array.from(hourMap.entries())
    .map(([hour, data]) => ({
      hour: Number(hour),
      averageViews: Number((data.totalViews / data.count).toFixed(2)),
      videosCount: data.count
    }))
    .sort((a, b) => a.hour - b.hour);

  const bestHours = [...hourlyPerformance]
    .sort((a, b) => b.averageViews - a.averageViews)
    .slice(0, 3);

  const averageEngagement =
    enrichedVideos.length > 0
      ? Number((totalEngagementRate / enrichedVideos.length).toFixed(2))
      : 0;

  return {
    videos: enrichedVideos,
    bestHours,
    hourlyPerformance,
    averageEngagement
  };
}

async function youtubeRequest(endpoint, params) {
  const key = process.env.YOUTUBE_API_KEY;

  if (!key) {
    throw new Error('YOUTUBE_API_KEY is missing. Add it to your .env file.');
  }

  const url = new URL(`${API_BASE}/${endpoint}`);
  const searchParams = new URLSearchParams({ ...params, key });
  url.search = searchParams.toString();

  const response = await fetch(url);

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    const message = errorPayload?.error?.message || `YouTube API request failed (${response.status})`;
    throw new Error(message);
  }

  return response.json();
}

app.post('/api/analyze-channel', async (req, res) => {
  try {
    const { channelId } = req.body;

    if (!channelId) {
      return res.status(400).json({ error: 'channelId is required.' });
    }

    const searchResult = await youtubeRequest('search', {
      part: 'snippet',
      channelId,
      maxResults: String(MAX_VIDEOS),
      order: 'date',
      type: 'video'
    });

    const videoIds = searchResult.items?.map((item) => item.id.videoId).filter(Boolean) || [];

    if (videoIds.length === 0) {
      return res.json({
        channelId,
        videos: [],
        bestHours: [],
        hourlyPerformance: [],
        averageEngagement: 0
      });
    }

    const videosResult = await youtubeRequest('videos', {
      part: 'snippet,statistics',
      id: videoIds.join(',')
    });

    const analytics = calculateChannelAnalytics(videosResult.items || []);

    return res.json({ channelId, ...analytics });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unexpected server error.' });
  }
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`TreyAnalytics running on http://localhost:${PORT}`);
});
