import { Worker } from "bullmq";
import redisConnection from "../config/redis.js";
import { Video } from "../models/video.model.js";
import { CACHE_KEYS, deleteCache } from "../utils/cache.js";
import { logger } from "../utils/logger.js";
import { updateVideoViews } from "../services/typesenseSync.service.js";

const processViewSync = async (job) => {
    try {
        if (!redisConnection) return;

        // 1. Read the buffered views from Redis
        const bufferedViews = await redisConnection.hgetall(CACHE_KEYS.videoViewsBuffer);
        const videoIds = Object.keys(bufferedViews);

        if (videoIds.length === 0) {
            return; // Nothing to sync
        }

        // 2. Generate bulkWrite() operations
        const bulkOperations = videoIds.map((videoId) => {
            const viewsToIncrement = parseInt(bufferedViews[videoId], 10);
            return {
                updateOne: {
                    filter: { _id: videoId },
                    update: { $inc: { views: viewsToIncrement } },
                },
            };
        });

        // 3. Execute MongoDB bulkWrite
        await Video.bulkWrite(bulkOperations);

        // 4. Remove only the successfully flushed entries from Redis
        // If MongoDB fails above, it throws, and we never reach HDEL.
        // Therefore, the Redis buffer remains intact during DB failure.
        await redisConnection.hdel(CACHE_KEYS.videoViewsBuffer, ...videoIds);

        // 5. Cleanup caches and sync Typesense
        for (const videoId of videoIds) {
            // Delete video detail cache to ensure fresh data is fetched next time
            await deleteCache(CACHE_KEYS.videoDetail(videoId));

            // Optional: Fetch updated document for Typesense sync if needed.
            // A more optimized system might skip finding it just for Typesense and only send views,
            // but for safety, if we have typesense update we can just use the view increments.
            // Since typesense needs the total views (not increment), we skip it here to save a DB fetch.
            // Or we fetch them all at once if typesense sync is critical.
            // For now, view sync to typesense can be done periodically or we fetch the updated video:
            Video.findById(videoId).select('views isPublished processingStatus').lean()
                .then(v => {
                    if (v && v.isPublished && v.processingStatus === "ready") {
                        updateVideoViews(videoId, v.views).catch(err => logger.error({ err, videoId }, "Typesense bulk sync error"));
                    }
                })
                .catch(err => logger.error({ err, videoId }, "Typesense bulk fetch error"));
        }

        logger.debug(`Synced views for ${videoIds.length} videos`);
    } catch (error) {
        logger.error({ err: error }, "Error syncing buffered views to MongoDB");
        // Throwing the error ensures BullMQ marks the job as failed and retries it,
        // without executing the HDEL step, guaranteeing no views are lost.
        throw error;
    }
};

export const viewSyncWorker = new Worker("view-sync", processViewSync, {
    connection: redisConnection,
});

viewSyncWorker.on("completed", (job) => {
    logger.debug({ jobId: job.id }, "View sync job completed successfully");
});

viewSyncWorker.on("failed", (job, err) => {
    logger.error({ jobId: job.id, err }, "View sync job failed");
});
