import redisClient from "../config/redis.js";
import { logger } from "../utils/logger.js";
import { CACHE_KEYS } from "../utils/cache.js";

/**
 * Registers a view for a video in the Redis buffer, ensuring deduplication within 24 hours.
 * @param {string} videoId 
 * @param {string} viewerIdentifier - User ID or IP address
 * @returns {Promise<boolean>} True if it was a new view, False if deduplicated
 */
export const registerBufferedView = async (videoId, viewerIdentifier) => {
    try {
        if (!redisClient) return false;

        const viewKey = CACHE_KEYS.videoViewDeduplication(videoId, viewerIdentifier);
        
        // Check deduplication
        const alreadyViewed = await redisClient.get(viewKey);
        
        if (!alreadyViewed) {
            // Increment view count in buffer
            await redisClient.hincrby(CACHE_KEYS.videoViewsBuffer, videoId, 1);
            
            // Set deduplication key with 24 hours TTL
            await redisClient.setex(viewKey, 86400, "1");
            
            logger.debug({ videoId, viewerIdentifier }, "Buffered new video view");
            return true;
        }
        return false;
    } catch (err) {
        logger.error({ err, videoId }, "Failed to register buffered view");
        return false;
    }
};

/**
 * Gets the current number of buffered views for a video.
 * @param {string} videoId 
 * @returns {Promise<number>}
 */
export const getBufferedViews = async (videoId) => {
    try {
        if (!redisClient) return 0;
        
        const countStr = await redisClient.hget(CACHE_KEYS.videoViewsBuffer, videoId);
        return countStr ? parseInt(countStr, 10) : 0;
    } catch (err) {
        logger.error({ err, videoId }, "Failed to get buffered views");
        return 0;
    }
};
