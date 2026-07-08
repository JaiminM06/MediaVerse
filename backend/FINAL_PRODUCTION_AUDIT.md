# MediaVerse: Final Production-Readiness Review

**Date:** July 7, 2026
**Reviewers:** Principal Engineering Panel (Backend, Data Layer, Infrastructure, Security, Reliability)
**Context:** Final Pre-Production Audit for Single-VPS Deployment (PM2 Cluster Mode, 12 workers)

---

## 🛑 PANEL VERDICT: NOT READY FOR PRODUCTION
While the architecture is well-layered and tests are extensive, the system has **critical architectural flaws in its cluster concurrency model, security posture, and lifecycle management** that will cause immediate data corruption, resource exhaustion, and security breaches under production load. 

Do not deploy until the following issues are remediated.

---

## 1. Concurrency & Race Conditions (Reliability & Systems)

### 1.1 TOCTOU Race Condition in Rate Limiter
**File:** `src/middlewares/rateLimiter.middleware.js`
**Issue:** The rate limiter checks `const current = await redis.get(key)` and then performs `await redis.incr(key)`. Under high concurrency, 10,000 requests can arrive simultaneously, all read `current` as `null` (or under the limit), and all bypass the rate limit, successfully executing the protected route.
**Fix:** Use atomic operations.
```javascript
const count = await redis.incr(key);
if (count === 1) {
    await redis.pexpire(key, options.windowMs);
}
if (count > options.max) {
    return res.status(429).json(options.message);
}
```

### 1.2 Broken Real-Time Notifications in PM2 Cluster Mode
**File:** `src/services/notification.service.js` & `src/config/socket.js`
**Issue:** `onlineUsers` is an in-memory `Map`. In a 12-worker PM2 cluster, memory is not shared. If User A (on Worker 1) likes a video by User B (on Worker 2), `notification.service.js` (running on Worker 1) checks `onlineUsers` and determines User B is offline, failing to send the notification.
**Fix:** Remove `onlineUsers` entirely. Have clients `socket.join(userId)` on connection. Use the Socket.IO Redis Adapter to broadcast to the user's room globally across all workers: `io.to(String(recipientId)).emit("notification", ...);`.

---

## 2. Security Vulnerabilities (Security)

### 2.1 AWS S3 Storage Exhaustion (Presigned URL Bypass)
**File:** `src/controllers/upload.controller.js` & `src/utils/s3.js`
**Issue:** The backend enforces a 500MB `fileSize` limit before generating the presigned URL. However, it uses `getSignedUrl` with `PutObjectCommand`. Standard PUT presigned URLs **do not enforce file size limits at the S3 level**. An attacker can claim `fileSize: 100`, get the URL, and upload a 10TB file directly to S3, bypassing all application limits and causing massive AWS billing.
**Fix:** Switch to **Presigned POST** (`createPresignedPost`) which allows you to cryptographically enforce `content-length-range` in the AWS policy.

### 2.2 Arbitrary File Overwrite (Path Traversal in Multer)
**File:** `src/middlewares/multer.middleware.js`
**Issue:** `filename: function (req, file, cb) { cb(null, file.originalname); }`. An attacker can intercept the request and set `originalname` to `../../../../.env` or `../../../ecosystem.config.cjs`, overwriting critical server files.
**Fix:** Never trust client filenames. 
```javascript
const ext = path.extname(file.originalname);
cb(null, `${crypto.randomUUID()}${ext}`);
```

### 2.3 Missing `sameSite` on Refresh Token
**File:** `src/controllers/user.controller.js`
**Issue:** The `loginUser` controller sets `sameSite: "Lax"`, but `refreshAccessToken` omits it. This causes inconsistent cookie behavior and potential CSRF vulnerabilities on token rotation.
**Fix:** Add `sameSite: "Lax"` to the `options` object in `refreshAccessToken`.

---

## 3. Data Integrity & Infrastructure (Data Layer & DevOps)

### 3.1 Worker Process Lacks Graceful Shutdown (Abandoned FFmpeg)
**File:** `src/workers/index.js`
**Issue:** While the HTTP server has graceful shutdown, the BullMQ worker process does not listen for `SIGTERM`. When PM2 restarts the cluster or Docker stops, the worker is violently killed. If FFmpeg was transcoding a video, the child process is orphaned, consuming 100% CPU on the host indefinitely, and temporary files in `public/temp` are never cleaned up.
**Fix:** Implement `worker.close()` on `SIGINT`/`SIGTERM` in `videoProcessor.js` and ensure running child processes (ffmpeg) are killed.

### 3.2 Non-Atomic Cascade Deletion (Data Corruption Risk)
**File:** `src/controllers/tweet.controller.js` (`deleteTweet`)
**Issue:** Deleting a tweet involves 5 separate asynchronous Mongoose calls (`deleteMany` for children, `findByIdAndUpdate` for parent `replyCount`). If the process crashes midway, the database is left in an inconsistent state (orphaned likes/replies, incorrect reply counts).
**Fix:** Wrap the cascade delete logic in a MongoDB Transaction (`mongoose.startSession()`).

### 3.3 Dockerfile Runs as Root
**File:** `Dockerfile`
**Issue:** The Dockerfile does not include a `USER node` instruction. It runs as root. When `docker-compose.yml` mounts `./logs:/app/logs`, the log files are written as root, breaking file permissions on the host Ubuntu machine.
**Fix:** Add `USER node` before the `CMD` instruction in the Dockerfile.

---

## 4. Required Action Items Before Deployment

1. **Implement `createPresignedPost` in AWS S3 utility** to enforce exact file size limits.
2. **Refactor `rateLimiter.middleware.js`** to use Redis `INCR` atomically.
3. **Remove `onlineUsers` Map** and replace it with Socket.IO rooms for cross-cluster notifications.
4. **Sanitize `multer.middleware.js`** using UUIDs for filenames.
5. **Implement Graceful Shutdown in `src/workers/index.js`** to cleanly close the BullMQ worker and abort FFmpeg.
6. **Add the missing Nginx configuration** to proxy traffic to the PM2 cluster and handle Socket.IO upgrades securely.

*Once these 6 items are resolved, the system will be robust enough for a production launch.*
