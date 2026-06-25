# MediaVerse — Codebase Architecture Context

> High-level guide to the backend structure, data model, auth, middleware, API patterns, and error handling for this Node.js/Express project.

---

## 1. Project Overview

**MediaVerse** is a YouTube/Twitter-hybrid backend built with **Node.js 20+**, **Express 5**, and **MongoDB** (via Mongoose). It supports:

- User auth with JWT access/refresh tokens
- Video upload & async HLS transcoding via AWS S3 + FFmpeg + BullMQ workers
- Social features: likes, comments, subscriptions, tweets, playlists, notifications
- Full-text search & autocomplete via Typesense
- Personalized recommendations (content-based + collaborative filtering)
- Real-time features (viewer count, typing indicators, live notifications) via Socket.IO
- Channel analytics dashboards

---

## 2. Folder Structure

```
second/
├── src/
│   ├── app.js                      # Express app setup, middleware, routes, global error handler
│   ├── index.js                    # Entry point: HTTP server, DB, Typesense, Socket.IO init
│   ├── constants.js                # Project constants (e.g. DB_NAME)
│   ├── config/                     # External service clients
│   │   ├── redis.js                # ioredis client (BullMQ + Socket adapter + caching)
│   │   ├── socket.js               # Socket.IO server + JWT auth + online users map
│   │   ├── typesense.js            # Typesense search client
│   │   └── typesenseCollections.js # Collection schemas + bootstrap logic
│   ├── db/index.js                 # Mongoose connection logic
│   ├── models/                     # Mongoose schemas
│   ├── routes/                     # Express route declarations
│   ├── controllers/                # Route handlers / request controllers
│   ├── middlewares/                # Auth, multer, upload guards
│   ├── services/                   # Reusable business logic (search, recs, analytics, notifications, rooms, sync)
│   ├── queues/videoQueue.js        # BullMQ producer for video processing
│   ├── utils/                      # Shared helpers (ApiError, ApiResponse, asyncHandler, Cloudinary, S3)
│   └── workers/                    # BullMQ consumers
│       ├── index.js                # Worker process entry
│       └── videoProcessor.js       # FFmpeg/S3 transcoding worker
├── scripts/
│   └── bulkIndexTypesense.js       # One-off bulk indexing script
├── public/temp/                    # Temporary Multer upload destination
├── socket-port8000.js              # Manual Socket.IO test clients
├── socket-port8001.js
└── package.json
```

---

## 3. Database Schemas (Mongoose)

All schemas live under `src/models/`. The design is **reference-heavy** rather than deeply embedded to keep the social graph scalable.

### 3.1 Core Entities

| Model | File | Purpose |
|-------|------|---------|
| `User` | `user.model.js` | Accounts, password hash, avatar/cover, watch history, search history, refresh token |
| `Video` | `video.model.js` | Video metadata, Cloudinary/S3 URLs, processing status, HLS variants |
| `Tweet` | `tweet.model.js` | Short text posts with auto-extracted `#hashtags` |
| `Comment` | `comment.model.js` | Comments on videos |
| `Playlist` | `playlist.model.js` | User-created playlists with array of video refs |

### 3.2 Social Graph

| Model | File | Purpose |
|-------|------|---------|
| `Like` | `like.model.js` | Polymorphic likes (`video`, `comment`, `tweet`) with compound unique indexes |
| `Subscription` | `subscription.model.js` | Subscriber ↔ Channel relationship |

### 3.3 Analytics & Activity

| Model | File | Purpose |
|-------|------|---------|
| `WatchHistory` | `watchHistory.model.js` | Normalized watch history (unique per user+video) |
| `VideoAnalytics` | `videoAnalytics.model.js` | Per-view events (watch duration, completion rate, source, device) |
| `Notification` | `notification.model.js` | In-app + real-time notifications |

### 3.4 Key Schema Patterns

- **ObjectId references** are used everywhere (`owner`, `video`, `likedBy`, etc.).
- **Compound indexes** enforce uniqueness where needed:
  - `Like`: `{ likedBy, video }`, `{ likedBy, tweet }`, `{ likedBy, comment }`
  - `Subscription`: `{ subscriber, channel }`
  - `WatchHistory`: `{ user, video }`
- **Pre-save hooks**:
  - `User` hashes password with bcrypt before saving.
  - `Tweet` extracts `#hashtags` from content on save.
- **Instance methods** on `User`:
  - `isPasswordCorrect(password)`
  - `generateAccessToken()`
  - `generateRefreshToken()`
- **Pagination plugin**: `mongoose-aggregate-paginate-v2` is used on `Video` and `Comment` aggregates.

---

## 4. Authentication Flow

### 4.1 Tokens

- **Access Token**: short-lived JWT containing `{ _id, email, username, fullName }`. Sent in `Authorization: Bearer <token>` header **and** in an `httpOnly` cookie.
- **Refresh Token**: long-lived JWT containing `{ _id }`. Stored hashed in the `User.refreshToken` field and also in an `httpOnly` cookie.

### 4.2 Login Flow

1. `POST /api/v1/users/login` accepts `email` or `username` + `password`.
2. Password is verified with `bcrypt.compare`.
3. `generateAccessAndRefreshTokens(userId)` creates both tokens, saves the refresh token to the user document.
4. Tokens are attached as cookies (`accessToken`, `refreshToken`) and returned in the JSON body.

### 4.3 Logout Flow

1. `POST /api/v1/users/logout` (protected).
2. `User.findByIdAndUpdate` unsets `refreshToken`.
3. Both cookies are cleared.

### 4.4 Refresh Flow

1. `POST /api/v1/users/refresh-token` reads `req.cookies.refreshToken`.
2. JWT is verified against `REFRESH_TOKEN_SECRET`.
3. The token is compared with the one stored on the user.
4. New access & refresh tokens are issued and cookies updated.

### 4.5 Auth Middleware (`src/middlewares/auth.middleware.js`)

```js
const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
```

- Validates the access token.
- Loads the user (excluding password & refresh token) and attaches `req.user`.
- Throws `ApiError(401)` on any failure.

### 4.6 Optional Auth (`src/middlewares/optionalAuth.middleware.js`)

- Same token lookup but silently continues as anonymous if invalid/missing.
- Used for public routes that can be enhanced when logged in (search, feed, watch events).

---

## 5. Middleware Flow

Request lifecycle in `src/app.js`:

1. `cors({ credentials: true })`
2. `express.json({ limit: "16kb" })`
3. `express.urlencoded({ extended: true, limit: "16kb" })`
4. `express.static("public")`
5. `cookieParser()`
6. **Router-level middleware**:
   - `verifyJWT` applied per-router or per-route (e.g. `router.use(verifyJWT)`)
   - `optionalAuth` for public-but-aware routes
   - `upload` (Multer) for multipart uploads
   - `uploadGuard` for presigned-upload validation
7. **Global error handler** at the bottom of `app.js`

### Middleware Inventory

| Middleware | Role |
|------------|------|
| `verifyJWT` | Enforce authenticated requests |
| `optionalAuth` | Attach user if possible, else proceed |
| `upload` (Multer) | Store multipart files in `public/temp/` |
| `uploadGuard` | Validate content type & size before S3 presigned URL |

---

## 6. API Patterns

### 6.1 Routing Style

Routes are declared in `src/routes/*.routes.js` using Express `Router` and mounted in `app.js` under `/api/v1`.

```js
// Example: src/routes/video.routes.js
router.route("/").get(getAllVideos).post(upload.fields([...]), publishAVideo)
```

### 6.2 Controller Style

Controllers wrap async functions with `asyncHandler` so rejected promises are forwarded to Express error middleware.

```js
const getAllVideos = asyncHandler(async (req, res) => {
    const videos = await Video.find({ owner: req.user._id }).populate("owner", "username")
    return res.status(200).json(new ApiResponse(200, videos, "videos fetched Successfully"))
})
```

### 6.3 Response Pattern

All successful responses use the `ApiResponse` class:

```js
{
  success: true,
  data: <payload>,
  message: "..."
}
```

The HTTP status code is set explicitly (`res.status(200).json(...)`).

### 6.4 Validation Pattern

Validation is **manual** in controllers:

```js
if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required")
}
```

No schema validation library (Zod/Joi) is currently used.

### 6.5 Authorization Pattern

Resource ownership is checked by string-comparing ObjectIds:

```js
if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this video")
}
```

### 6.6 Aggregation Pattern

Heavy lifting (subscriber counts, watch history expansion, trending scoring, recommendations, analytics) is done via MongoDB aggregation pipelines with `$lookup`, `$addFields`, `$project`, `$unwind`.

---

## 7. Error Handling Style

### 7.1 `ApiError` Class (`src/utils/ApiError.js`)

```js
class ApiError extends Error {
    constructor(statusCode, message = "Something went wrong", errors = [], stack = "") { ... }
}
```

- Carries `statusCode`, `message`, `errors[]`, `data`, and `success: false`.
- Captures stack traces automatically.

### 7.2 `asyncHandler` (`src/utils/asyncHandler.js`)

Wraps route handlers so any thrown `ApiError` or unhandled rejection is passed to `next(err)`:

```js
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }
}
```

### 7.3 Global Error Handler (`src/app.js`)

```js
app.use((err, req, res, next) => {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: err.errors || [],
            data: err.data || null,
        })
    }
    console.error("Unhandled Error:", err)
    return res.status(500).json({ success: false, message: "Internal Server Error" })
})
```

### 7.4 Common Error Status Codes

| Code | Usage |
|------|-------|
| 400 | Bad request / missing fields |
| 401 | Unauthorized / invalid tokens |
| 403 | Forbidden (not owner) |
| 404 | Resource not found |
| 409 | Conflict (duplicate user) |
| 413 | Payload too large |
| 415 | Unsupported media type |
| 500 | Internal / unexpected errors |

---

## 8. External Services & Infrastructure

### 8.1 Cloudinary (`src/utils/cloudinary.js`)

Used for synchronous uploads of avatars, cover images, thumbnails, and the legacy direct video upload flow. Files are deleted from `public/temp/` after upload.

### 8.2 AWS S3 (`src/utils/s3.js`)

Used for the async video pipeline:

- **Raw bucket**: receives original uploads via presigned URLs.
- **Processed bucket**: stores HLS master playlists, variants, thumbnails.
- **CloudFront** is preferred if `CLOUDFRONT_DOMAIN` is set; otherwise falls back to direct S3 URLs.

### 8.3 Redis (`src/config/redis.js`)

Single ioredis client reused for:

- BullMQ queue + worker connection
- Socket.IO Redis adapter pub/sub
- Deduplication cache for video views (`view:<videoId>:<userId|ip>`, 30-min TTL)

### 8.4 Typesense (`src/config/typesense.js`)

Full-text search index for `videos` and `tweets`. Collections are auto-created on startup (`initTypesenseCollections`). Sync is **fire-and-forget** from controllers/services:

```js
indexVideoSync(popVideo).catch(err => console.error(...))
```

### 8.5 BullMQ Worker (`src/workers/videoProcessor.js`)

Async pipeline per video:

1. Download raw file from S3.
2. Extract metadata with `ffprobe`.
3. Transcode to HLS variants (360p–1080p) with `fluent-ffmpeg`.
4. Generate thumbnails.
5. Upload processed assets to S3.
6. Update MongoDB (`ready`, `hlsManifestUrl`, variants, thumbnails).
7. Sync to Typesense.
8. Send real-time notification.
9. Cleanup temp files.

Retries are configured with exponential backoff (3 attempts). On permanent failure, a `video_failed` notification is sent.

### 8.6 Socket.IO (`src/config/socket.js` + `src/services/room.service.js`)

- Authenticates connections via JWT from `auth.token` or `Authorization` header.
- Uses Redis adapter for horizontal scaling.
- Tracks online users in an in-memory `Map`.
- Rooms are video-specific (`video-<videoId>`) and emit:
  - `viewer_count_update`
  - `user_typing`
  - `new_comment`
- Notifications are delivered directly to a user's socket if online.

---

## 9. Notable Business Logic Areas

### 9.1 Search

- `src/services/search.service.js` queries Typesense.
- Supports filters (`minDuration`, `maxDuration`, `minViews`), sorting (`views`, `createdAt`), and autocomplete.
- Search history is stored on the `User` document (max 10 entries, case-insensitive dedup).

### 9.2 Recommendations

- `src/services/recommendation.service.js`
- **Content-based**: videos with overlapping tags.
- **Collaborative**: videos watched by other users who watched the source video.
- Results are merged by score and padded with recent videos if needed.
- `getHomeFeed` personalizes based on the user's last 3 watched videos, falling back to trending for guests.

### 9.3 Trending

- `src/controllers/trending.controller.js`
- `engagementScore = views + 5 * likes` computed in aggregation.
- Supports `day`, `week`, `month` cutoffs.
- Trending hashtags are extracted from tweets in the last 7 days.

### 9.4 Analytics

- `src/controllers/analytics.controller.js` + `src/services/analytics.service.js`
- Records watch events (`VideoAnalytics`) with completion rate.
- Provides dashboard summary, views/subscriber charts, top videos, traffic sources, and audience retention.

---

## 10. Entry Points & Scripts

| Command | File | Purpose |
|---------|------|---------|
| `npm run dev` | `src/index.js` | Starts API server on `PORT` (default 8000) |
| `npm run worker` | `src/workers/index.js` | Starts video processing worker |
| `npm run dev:all` | — | Runs both concurrently |
| `node scripts/bulkIndexTypesense.js` | `scripts/bulkIndexTypesense.js` | Bulk re-indexes MongoDB videos/tweets into Typesense |

---

## 11. Conventions Summary

- **ES Modules**: `"type": "module"` in `package.json`; imports use `.js` extensions.
- **Environment-driven**: all secrets/URLs come from `process.env` via `dotenv`.
- **Minimal dependencies**: no validation library, no ORM beyond Mongoose, no request logger.
- **Fire-and-forget** for non-critical side effects (Typesense sync, notifications, cleanup) with `.catch(console.error)`.
- **Status-code mismatch**: some controllers return `res.status(201)` with `new ApiResponse(200, ...)`. Be aware if standardizing responses.
- **Duplicate playlist controller**: `playlist.controller.js` and `playlist.contorller.js` exist; only the misspelled one is imported by `playlist.routes.js`.

---

*This document is a read-only architecture guide. It does not modify any source files.*
