# TreyAnalytics

A beginner-friendly but scalable full-stack YouTube analytics app inspired by VidIQ (simplified and free).

## Tech Stack
- Node.js + Express backend
- YouTube Data API v3 integration
- Vanilla HTML/CSS/JS frontend
- Chart.js for performance graphing

## Folder Structure

```text
premiere-scripting-guide/
├─ server.js
├─ package.json
├─ .env.example
├─ public/
│  ├─ index.html
│  ├─ styles.css
│  └─ app.js
└─ TreyAnalytics.md
```

## Features

1. **Channel Analyzer**
   - Input a YouTube Channel ID.
   - Pulls up to last 50 videos.
   - Displays title, views, likes, comments, publish date, and hour posted (UTC).

2. **Best Time To Post**
   - Groups videos by publish hour.
   - Calculates average views per hour.
   - Shows top 3 best-performing hours.
   - Visualizes with a bar chart.

3. **Engagement Rate**
   - Uses formula: `(likes + comments) / views * 100`.
   - Displays average channel engagement rate.

4. **Title Analyzer**
   - Title length
   - Detects numbers
   - Detects question marks
   - Detects emotional words
   - Generates a score out of 100

5. **UI/UX**
   - Dark modern dashboard
   - Sidebar navigation
   - Card metrics
   - Graph + tables
   - Responsive layout

## Local Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set environment variables:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and add your `YOUTUBE_API_KEY`.

3. Start server:
   ```bash
   npm run dev
   ```
   or
   ```bash
   npm start
   ```

4. Open app:
   - http://localhost:3000

## API Notes
- Endpoint: `POST /api/analyze-channel`
- Body:
  ```json
  {
    "channelId": "UCxxxxxxxxxxxxxxxxxxxxxx"
  }
  ```

## Scalability Ideas
- Add persistent caching (Redis)
- Save channel history in a database (PostgreSQL)
- Support auth and user-specific tracked channels
- Add pagination and CSV export
- Add competitor comparison analytics
