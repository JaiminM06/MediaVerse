# 🚀 MediaVerse — Final Enhanced Plan

> **Stack decision locked:** MongoDB (stay, no migration) · Node.js + Express · React + Tailwind  
> **Goal:** Transform a tutorial clone into a resume-worthy backend systems project.

---

## ⚡ Phase 0 — Fix Bugs & Quick Wins (Do This First, Today)

> **Rule:** Never build features on broken code. Fix everything here before touching any new feature.

### Bugs to Fix

| # | File | Bug | Fix |
|---|------|-----|-----|
| 1 | `comment.controller.js:78` | `if (!deleted)` | Change to `if (!deletedComment)` |
| 2 | `like.controller.js:64` | `if (existingLike)` | Change to `if (exists)` |
| 3 | `like.controller.js:11` | Field name `videoId` | Change to `video` (matches schema) |
| 4 | `playlist.controller.js:34` | `User` used but not imported | Add `import User from '../models/user.model.js'` |
| 5 | `user.controller.js:264,268,288,292` | `new ApiError(...)` missing `throw` | Add `throw` before each `new ApiError(...)` |
| 6 | `user.controller.js:425` | `user[0].WatchHistory` | Change to `user[0].watchHistory` (case) |
| 7 | `app.js` | Likes routes commented out | Uncomment and wire properly |
| 8 | `app.js` | Playlist routes commented out | Uncomment and wire properly |
| 9 | `app.js` | Dashboard routes missing | Create controller + wire route |
| 10 | `package.json` | `"mogoose": "^0.0.1-security"` | Remove this fake/typo package |

### Security — Do This Immediately

> ⚠️ Your `.env` has real MongoDB URI, Cloudinary keys, and JWT secrets committed to git.

1. **Rotate all credentials right now** — MongoDB Atlas, Cloudinary, JWT secret
2. Remove `.env` from git history:
   ```bash
   # Using BFG Repo Cleaner (recommended)
   bfg --delete-files .env
   git reflog expire --expire=now --all && git gc --prune=now --aggressive
   git push --force
   ```
3. Add `.env` to `.gitignore`
4. Create `.env.example` with placeholder values:
   ```env
   PORT=8000
   MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/mediaverse
   JWT_SECRET=your_jwt_secret_here
   JWT_EXPIRY=1d
   CLOUDINARY_CLOUD_NAME=
   CLOUDINARY_API_KEY=
   CLOUDINARY_API_SECRET=
   AWS_ACCESS_KEY_ID=
   AWS_SECRET_ACCESS_KEY=
   AWS_REGION=
   AWS_S3_RAW_BUCKET=
   AWS_S3_PROCESSED_BUCKET=
   CLOUDFRONT_DOMAIN=
   REDIS_URL=redis://localhost:6379
   ```

### Other Quick Wins

- [ ] Wire up Watch History — it's modeled but never actually records
- [ ] Remove all `console.log` debugging statements from controllers
- [ ] Clean up all commented-out code blocks
- [ ] Write a proper `README.md` (see Phase 5 — Production)

---

## 🏆 Tier 1 — Video Processing Pipeline (Highest Impact)

**Interview signal:** *"I understand async workloads, message queues, and cloud infrastructure"*  
**Estimated time:** 3–4 weeks  
**Why this matters:** Every YouTube clone uploads to Cloudinary and calls it a day. A real pipeline separates you from 95% of portfolio projects.

### Architecture

```
Client Upload
     │
     ▼
Express API ──► Generate pre-signed S3 URL
     │
     ▼
S3 Raw Bucket (original file lands here)
     │
     ▼ (S3 event / API trigger)
BullMQ Job Queue ◄──► Redis
     │
     ▼
FFmpeg Worker
     ├──► Transcode: 360p / 480p / 720p / 1080p
     ├──► Generate HLS segments (.m3u8 + .ts chunks)
     ├──► Auto-generate thumbnails (at 25%, 50%, 75%)
     └──► Extract metadata (duration, codec, fps, size)
          │
          ▼
     S3 Processed Bucket
          │
          ▼
     CloudFront CDN ──► Client streams via HLS
          │
          ▼
     WebSocket / SSE ──► Real-time progress to client
```

### Step-by-Step Implementation

#### Step 1 — Replace Cloudinary with AWS S3 + CloudFront

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

- **Pre-signed URL flow:** Client requests a signed URL from your API → uploads directly to S3 (bypasses your server, no memory issues with large files)
- **Two buckets:** `mediaverse-raw` (originals) and `mediaverse-processed` (transcoded output)
- **CloudFront** sits in front of the processed bucket for global CDN delivery

#### Step 2 — BullMQ Job Queue with Redis

```bash
npm install bullmq ioredis
```

- When S3 upload completes → API pushes a job to the queue
- Job payload: `{ s3Key, userId, videoId, requestedFormats: ['360p','720p','1080p'] }`
- Video status lifecycle: `uploading` → `processing` → `ready` → `failed`

**Failure handling (this is what impresses interviewers):**
- BullMQ retries failed jobs up to 3 times with exponential backoff
- On final failure → update video status to `failed`, notify user via WebSocket
- Dead-letter queue for jobs that fail all retries — can be manually requeued
- What happens if S3 upload completes but job never queues? Use S3 event notifications as a backup trigger

#### Step 3 — FFmpeg Transcoding Worker

```bash
npm install fluent-ffmpeg
# Also requires FFmpeg binary installed on the worker server
```

| Resolution | Bitrate | Use Case |
|-----------|---------|----------|
| 360p | 800 kbps | Mobile / slow connection |
| 480p | 1500 kbps | Standard |
| 720p | 3000 kbps | HD |
| 1080p | 5000 kbps | Full HD |

Also produce:
- HLS segments: `.m3u8` master manifest + `.ts` chunk files per resolution
- Thumbnails: 3 auto-generated at 25%, 50%, 75% of duration
- Metadata extraction: duration, resolution, codec, original file size

**Build incrementally:**
1. Get S3 upload working first
2. Add BullMQ with a dummy worker (just logs the job)
3. Add FFmpeg producing one 720p output
4. Add HLS manifest generation
5. Add CloudFront serving
6. Then add remaining resolutions + thumbnails

#### Step 4 — HLS Adaptive Bitrate Streaming

```bash
# Frontend
npm install hls.js
```

- Serve `.m3u8` master manifest URL instead of a raw video file URL
- Player automatically selects quality based on network speed
- This is exactly how YouTube and Netflix work

#### Step 5 — Upload & Processing Progress

- **Upload progress:** Track via `axios` `onUploadProgress` callback on the pre-signed URL PUT request
- **Processing progress:** WebSocket (Socket.IO) or Server-Sent Events push status from worker to client
- UI states to show: `Uploading (67%)` → `Processing` → `Generating thumbnails` → `Ready`

### Updated Video Model Fields

```javascript
// Add to video.model.js
processingStatus: {
  type: String,
  enum: ['uploading', 'processing', 'ready', 'failed'],
  default: 'uploading'
},
rawFileKey: String,        // S3 key for original upload
hlsManifestUrl: String,    // CloudFront URL for master .m3u8
variants: [{
  resolution: String,      // "720p"
  bitrate: Number,         // 3000
  url: String,             // CloudFront URL for this variant's .m3u8
  size: Number             // bytes
}],
metadata: {
  codec: String,
  fps: Number,
  originalResolution: String,
  fileSize: Number
},
thumbnails: [String],      // Array of auto-generated thumbnail CDN URLs
processingError: String,   // Store error message if status = 'failed'
```

### Cost Control Strategy

> AWS costs real money. Set these limits to avoid surprise bills.

- Max video upload size: **500MB** (enforce in middleware before issuing pre-signed URL)
- Max video duration: **15 minutes** (check after FFmpeg extracts metadata, reject and delete if over)
- Set an **AWS Budget Alert** at $10/month in the AWS console
- For development: use a **local MinIO** container instead of real S3 (100% API-compatible, free)
  ```yaml
  # docker-compose.dev.yml
  minio:
    image: minio/minio
    ports: ["9000:9000", "9001:9001"]
    command: server /data --console-address ":9001"
  ```

### Resume Bullet

> Built an async video processing pipeline using **AWS S3**, **BullMQ**, and **FFmpeg** that transcodes uploads into multiple resolutions (360p–1080p) with **HLS adaptive bitrate streaming** and automated thumbnail generation. Implemented job retry logic with exponential backoff and dead-letter queuing for failure recovery.

---

## 🏆 Tier 2 — Real-Time Features with WebSockets

**Interview signal:** *"I understand real-time communication and event-driven architecture"*  
**Estimated time:** 1–2 weeks  
**Dependency:** Can be built alongside or after Tier 1 (Socket.IO is already needed for pipeline progress)

### Features to Build

#### 1. Live Notifications

```bash
npm install socket.io        # server
npm install socket.io-client # client
```

Notify users in real-time for:
- New subscriber on your channel
- New comment on your video
- Someone liked your video/tweet
- Your video finished processing (`video_ready`)

#### 2. Live Comment Stream

- New comment posted while you're watching → appears instantly without page refresh
- Typing indicator: "Someone is commenting..."
- Room-based: each video has its own Socket.IO room

#### 3. Live View Count

- Track concurrent viewers per video
- Show "X people watching now"
- Increment on join room, decrement on disconnect/leave

### Architecture

```
Client connects → Socket.IO server
                       │
              Join room: video-{videoId}
                       │
User posts comment → Express API → Save to MongoDB
                                       │
                                  Emit to room
                                       │
                          All clients in room receive it instantly
```

For multi-server scaling (when you have more than one Node process), add Redis Pub/Sub so Socket.IO events sync across instances.

### Notification Model

```javascript
const notificationSchema = new Schema({
  recipient: { type: ObjectId, ref: 'User', required: true, index: true },
  sender:    { type: ObjectId, ref: 'User' },
  type: {
    type: String,
    enum: ['new_subscriber', 'new_comment', 'new_like', 'video_ready', 'mention'],
    required: true
  },
  referenceId:    { type: ObjectId },
  referenceModel: { type: String, enum: ['Video', 'Comment', 'Tweet'] },
  message:  String,
  isRead:   { type: Boolean, default: false },
}, { timestamps: true });

notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });
```

### Frontend State Management Tip

Socket.IO events update local state directly — don't re-fetch from the API on every event. Pattern:

```javascript
// When a new comment arrives via socket
socket.on('new_comment', (comment) => {
  setComments(prev => [comment, ...prev]); // prepend to state
});
```

This avoids unnecessary API calls and makes the UI feel instant.

### Resume Bullet

> Implemented real-time notifications and live comment streaming using **Socket.IO** with room-based channels per video, supporting instant updates across concurrent viewers. Added Redis Pub/Sub adapter for horizontal scaling across multiple Node.js instances.

---

## 🏆 Tier 3 — Search & Recommendation Engine

**Interview signal:** *"I understand search infrastructure and recommendation algorithms"*  
**Estimated time:** 1.5–2 weeks  
**MongoDB note:** Uses **MongoDB Atlas Search** — requires M10+ cluster. If on free M0 tier, use `$text` index as a fallback or upgrade for this tier.

### Features to Build

#### 1. Full-Text Search with MongoDB Atlas Search

- Search across video titles, descriptions, channel names, tweet content
- Autocomplete / typeahead suggestions (returns results as you type)
- Search filters: date range, duration, view count, content type (video/tweet)
- Search history per user (stored in MongoDB, last 10 searches)

**Atlas Search index definition (`search_index.json`):**
```json
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "title":       { "type": "string", "analyzer": "lucene.standard" },
      "description": { "type": "string", "analyzer": "lucene.standard" },
      "username":    { "type": "string", "analyzer": "lucene.keyword"  }
    }
  }
}
```

**Example aggregation pipeline for search:**
```javascript
const results = await Video.aggregate([
  {
    $search: {
      index: 'video_search',
      compound: {
        must: [{ text: { query: searchQuery, path: ['title', 'description'], fuzzy: { maxEdits: 1 } } }],
        filter: [{ range: { path: 'duration', lte: maxDuration } }]
      }
    }
  },
  { $addFields: { score: { $meta: 'searchScore' } } },
  { $sort: { score: -1 } },
  { $limit: 20 }
]);
```

#### 2. Basic Recommendation Algorithm

Two signals, combined:

**Content-based (same tags/category):**
```javascript
// Find videos similar to what the user just watched
const similar = await Video.aggregate([
  { $match: { tags: { $in: watchedVideo.tags }, _id: { $ne: watchedVideo._id } } },
  { $addFields: { tagOverlap: { $size: { $setIntersection: ['$tags', watchedVideo.tags] } } } },
  { $sort: { tagOverlap: -1, views: -1 } },
  { $limit: 10 }
]);
```

**Collaborative filtering (users who watched X also watched Y):**
```javascript
// Find users who watched the same video → get their other watched videos
const collaborative = await WatchHistory.aggregate([
  { $match: { video: watchedVideoId } },
  { $lookup: { from: 'watchhistories', localField: 'user', foreignField: 'user', as: 'otherVideos' } },
  { $unwind: '$otherVideos' },
  { $group: { _id: '$otherVideos.video', count: { $sum: 1 } } },
  { $sort: { count: -1 } },
  { $limit: 10 }
]);
```

Mix both lists (deduplicated) and rank by combined score for the feed.

### Resume Bullet

> Built a search and recommendation engine using **MongoDB Atlas Search** with fuzzy full-text queries and autocomplete, plus a hybrid content-based + collaborative filtering algorithm for personalized video suggestions using MongoDB aggregation pipelines.

---

## 🏆 Tier 4 — Analytics Dashboard (Channel Studio)

**Interview signal:** *"I can work with data aggregation, visualization, and build internal tools"*  
**Estimated time:** 1–1.5 weeks  
**Strength:** Your MongoDB aggregation pipeline skills shine hardest here.

### Features to Build

#### 1. Creator Analytics API

All powered by MongoDB aggregation pipelines:

- **Views over time** — daily/weekly/monthly breakdown
- **Watch time analytics** — average watch duration per video
- **Subscriber growth** — chart of new subscribers per day
- **Top performing videos** — sorted by views, likes, comments
- **Audience retention** — what percentage of the video was actually watched
- **Traffic sources** — direct / search / recommended / external

#### 2. Frontend Dashboard

```bash
npm install recharts
```

- Line charts: views and subscribers over time
- Bar charts: top performing videos
- Pie/donut chart: traffic source breakdown
- Stat cards: total views, total subscribers, total watch time, total revenue (mock)

#### 3. VideoAnalytics Model

```javascript
const videoAnalyticsSchema = new Schema({
  video:          { type: ObjectId, ref: 'Video', required: true, index: true },
  viewer:         { type: ObjectId, ref: 'User' },
  watchDuration:  Number,      // seconds actually watched
  totalDuration:  Number,      // total video length
  completionRate: Number,      // watchDuration / totalDuration (0–1)
  source: {
    type: String,
    enum: ['direct', 'search', 'recommended', 'external'],
    default: 'direct'
  },
  deviceType: { type: String, enum: ['mobile', 'desktop', 'tablet'] },
  timestamp:  { type: Date, default: Date.now }
});

videoAnalyticsSchema.index({ video: 1, timestamp: -1 });
videoAnalyticsSchema.index({ viewer: 1, timestamp: -1 });
```

#### 4. Sample Aggregation — Views Over Time

```javascript
const viewsOverTime = await VideoAnalytics.aggregate([
  {
    $match: {
      video: { $in: myVideoIds },
      timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }
  },
  {
    $group: {
      _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
      views: { $sum: 1 },
      avgWatchTime: { $avg: '$watchDuration' }
    }
  },
  { $sort: { _id: 1 } }
]);
```

### Resume Bullet

> Designed a creator analytics dashboard with **MongoDB aggregation pipelines** computing real-time metrics — views over time, watch duration, audience retention, traffic sources — visualized with interactive **Recharts** line, bar, and donut charts.

---

## 🏆 Tier 5 — Production Hardening

**Interview signal:** *"I write production-grade code, not hobby code"*  
**Estimated time:** 1 week (can be done incrementally alongside other tiers)

### What to Add

| Area | Current | Fix |
|------|---------|-----|
| Rate limiting | None | `express-rate-limit` — 100 req/15min per IP; stricter on auth routes |
| Input validation | Manual checks | `zod` schemas on every endpoint |
| API documentation | None | Swagger/OpenAPI via `swagger-jsdoc` at `/api-docs` |
| Logging | `console.log` | `winston` structured JSON logging with log levels |
| Error tracking | None | Sentry (free tier) for production error monitoring |
| Testing | None | Jest + Supertest for API; mock Redis/S3 with local equivalents |
| CI/CD | None | GitHub Actions — lint, test, build Docker, deploy |
| Docker | None | Dockerfile + docker-compose for full local dev stack |
| Security | Basic | `helmet`, `hpp`, strong CORS config, JWT rotation |
| File upload limits | None | Max 500MB, allowed MIME types (`video/mp4`, `video/webm` only) |

### Key Implementations

#### Input Validation with Zod

```javascript
import { z } from 'zod';

export const publishVideoSchema = z.object({
  title:       z.string().min(3).max(100),
  description: z.string().max(5000),
  tags:        z.array(z.string()).max(10).optional(),
});

// Middleware
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ errors: result.error.flatten() });
  req.body = result.data;
  next();
};
```

#### Structured Logging with Winston

```javascript
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
  ],
});
```

Replace every `console.log` with `logger.info(...)` and `console.error` with `logger.error(...)`.

#### Docker Setup

```dockerfile
# Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8000
CMD ["node", "src/index.js"]
```

```yaml
# docker-compose.yml
services:
  api:
    build: .
    ports: ["8000:8000"]
    depends_on: [mongo, redis]
    env_file: .env

  worker:
    build: .
    command: node src/workers/videoProcessor.js
    depends_on: [redis]
    env_file: .env

  mongo:
    image: mongo:7
    volumes: [mongo-data:/data/db]
    ports: ["27017:27017"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    ports: ["9000:9000", "9001:9001"]
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin

volumes:
  mongo-data:
```

#### GitHub Actions CI

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run lint
      - run: npm test
  docker:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t mediaverse-api .
```

#### Testing Strategy

```bash
npm install -D jest supertest @jest/globals
```

- **API tests (Supertest):** Test every controller endpoint — happy path + error cases
- **Worker tests:** Mock BullMQ and assert correct job payloads are enqueued
- **S3 interactions:** Use `aws-sdk-client-mock` library to mock S3 calls without real AWS
- **Redis/Queue:** Use `ioredis-mock` for local queue testing

### Resume Bullet

> Production-hardened with **Docker** + docker-compose local dev stack, **Zod** request validation on all endpoints, **Swagger** auto-generated API docs, **Winston** structured JSON logging, **Jest** + Supertest API test coverage, and **GitHub Actions** CI/CD pipeline.

---

## 🏆 Tier 6 — Complete the Twitter Side

**Interview signal:** *"I can build complex social graph features"*  
**Estimated time:** 1–2 weeks  
**Note:** Build this last — it's high visibility on the frontend but lower backend complexity than Tiers 1–3.

### Features to Add

1. **Media tweets** — attach images (upload to S3, same pattern as videos)
2. **Retweets + Quote tweets** — self-referential Tweet model
3. **Thread support** — parent/child tweet chains with `parentTweetId` field
4. **Hashtag system** — extract `#tags` on save, index them, trending hashtags endpoint
5. **User mentions** — extract `@username` on save, trigger notification
6. **Tweet feed algorithm** — weighted by recency + engagement, not just chronological
7. **Twitter timeline UI** — toggle between Video Feed and Tweet Feed views

### Updated Tweet Model

```javascript
const tweetSchema = new Schema({
  content:      { type: String, required: true, maxlength: 280 },
  owner:        { type: ObjectId, ref: 'User', required: true },
  media:        [String],            // S3 URLs for images/GIFs
  parentTweet:  { type: ObjectId, ref: 'Tweet', default: null },  // for threads
  quoteTweet:   { type: ObjectId, ref: 'Tweet', default: null },  // for quote tweets
  isRetweet:    { type: Boolean, default: false },
  originalTweet:{ type: ObjectId, ref: 'Tweet', default: null },
  hashtags:     [String],            // extracted from content on pre-save hook
  mentions:     [{ type: ObjectId, ref: 'User' }], // extracted on pre-save
  views:        { type: Number, default: 0 },
}, { timestamps: true });

tweetSchema.index({ hashtags: 1 });
tweetSchema.index({ owner: 1, createdAt: -1 });
tweetSchema.index({ parentTweet: 1 });
```

---

## 📋 Final Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20 + Express |
| Database | MongoDB Atlas (M10+ for Atlas Search) |
| Cache / Queue broker | Redis 7 |
| File storage | AWS S3 (2 buckets) + CloudFront CDN |
| Video processing | FFmpeg + BullMQ workers |
| Streaming format | HLS adaptive bitrate (`.m3u8`) |
| Real-time | Socket.IO + Redis Pub/Sub |
| Search | MongoDB Atlas Search |
| Validation | Zod |
| Logging | Winston |
| Testing | Jest + Supertest |
| API docs | Swagger / OpenAPI |
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Frontend | React + Tailwind + Recharts + HLS.js + Socket.IO client |

---

## 🗂️ Final Project Structure

```
mediaverse/
├── .github/
│   └── workflows/
│       └── ci.yml
├── docker-compose.yml
├── docker-compose.dev.yml        # uses MinIO instead of real S3
├── .env.example
├── .gitignore                    # .env must be in here
├── packages/
│   ├── api/
│   │   ├── Dockerfile
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   ├── db.js
│   │   │   │   ├── redis.js
│   │   │   │   └── env.js        # zod-validated env schema
│   │   │   ├── controllers/
│   │   │   ├── middlewares/
│   │   │   │   ├── auth.middleware.js
│   │   │   │   ├── validate.middleware.js
│   │   │   │   └── rateLimiter.middleware.js
│   │   │   ├── models/
│   │   │   ├── routes/
│   │   │   ├── services/         # business logic, separate from controllers
│   │   │   │   ├── video.service.js
│   │   │   │   ├── notification.service.js
│   │   │   │   └── search.service.js
│   │   │   ├── validators/       # zod schemas
│   │   │   ├── utils/
│   │   │   │   ├── ApiError.js
│   │   │   │   ├── ApiResponse.js
│   │   │   │   ├── asyncHandler.js
│   │   │   │   ├── s3.js
│   │   │   │   └── logger.js
│   │   │   └── workers/
│   │   │       ├── videoProcessor.js    # BullMQ worker
│   │   │       └── queues.js            # queue definitions
│   │   └── tests/
│   │       ├── user.test.js
│   │       ├── video.test.js
│   │       └── __mocks__/
│   └── web/
│       ├── Dockerfile
│       └── src/
│           ├── components/
│           ├── pages/
│           ├── hooks/
│           │   └── useSocket.js
│           └── store/
├── docs/
│   └── architecture.md
└── README.md
```

---

## 🎯 Implementation Order

### Backend / Systems role target:
```
Phase 0 (Bugs + Security) → Tier 1 (Pipeline) → Tier 2 (WebSockets) → Tier 5 (Production) → Tier 4 (Analytics)
```

### Full-Stack role target:
```
Phase 0 (Bugs + Security) → Tier 1 (Pipeline) → Tier 4 (Analytics Dashboard) → Tier 3 (Search) → Tier 5 (Production)
```

### Frontend-heavy role target:
```
Phase 0 (Bugs + Security) → Tier 4 (Analytics Dashboard) → Tier 2 (Real-time) → Tier 6 (Twitter) → Tier 3 (Search)
```

---

## 📝 README Must-Haves (Do Before Any Job Application)

Your README is the first thing a hiring manager sees. It needs:

1. **Project description** — what it is, what problems it solves
2. **Architecture diagram** — a simple flowchart of the main systems
3. **Tech stack table** — what you used and why
4. **Key engineering decisions** — "Why BullMQ over direct FFmpeg calls?" etc.
5. **Local setup instructions** — `docker-compose up` should be enough
6. **Live demo link** — deploy to Railway, Render, or EC2
7. **API documentation link** — your Swagger `/api-docs` URL

---

*Plan version: 1.0 — MongoDB stack, locked June 2026*
