import redisClient from "../config/redis.js";
import { logger } from "./logger.js";

/**
 * Default TTL values (in seconds) for different cache categories.
 */
export const CACHE_TTL = {
    USER_PROFILE: 300,        // 5 minutes
    CHANNEL_PROFILE: 600,     // 10 minutes
    VIDEO_FEED: 120,          // 2 minutes  (feeds change frequently)
    VIDEO_DETAIL: 300,        // 5 minutes
    TWEET_FEED: 120,          // 2 minutes
    USER_TWEETS: 180,         // 3 minutes
};

/**
 * Cache key prefixes for easy identification and bulk invalidation.
 */
export const CACHE_KEYS = {
    userProfile: (userId) => `cache:user:${userId}`,
    channelProfile: (username) => `cache:channel:${username}`,
    videoFeed: (page, limit) => `cache:video:feed:${page}:${limit}`,
    videoDetail: (videoId) => `cache:video:${videoId}`,
    tweetFeed: (userId, page, limit) => `cache:tweet:feed:${userId || 'global'}:${page}:${limit}`,
    userTweets: (userId, page, limit) => `cache:tweet:user:${userId}:${page}:${limit}`,
    homeFeed: (userId, page, limit) => `cache:homefeed:${userId || 'guest'}:${page}:${limit}`,
    videoViewsBuffer: "video:views:buffer",
    videoViewDeduplication: (videoId, viewerIdentifier) => `view:${videoId}:${viewerIdentifier}`,
    videoLikeStatus: (videoId, userId) => `cache:like:${videoId}:${userId}`,
};

/**
 * Get data from cache. Returns parsed JSON or null if miss/error.
 */
export async function getCache(key) {
    try {
        if (!redisClient) return null;
        const cached = await redisClient.get(key);
        if (cached) {
            logger.debug({ key }, "Cache HIT");
            return JSON.parse(cached);
        }
        logger.debug({ key }, "Cache MISS");
        return null;
    } catch (err) {
        logger.error({ err, key }, "Cache GET error");
        return null;
    }
}

/**
 * Set data in cache with a TTL (in seconds).
 */
export async function setCache(key, data, ttl) {
    try {
        if (!redisClient) return;
        await redisClient.set(key, JSON.stringify(data), "EX", ttl);
        logger.debug({ key, ttl }, "Cache SET");
    } catch (err) {
        logger.error({ err, key }, "Cache SET error");
    }
}

/**
 * Delete a specific cache key (use after mutations).
 */
export async function deleteCache(key) {
    try {
        if (!redisClient) return;
        await redisClient.del(key);
        logger.debug({ key }, "Cache DELETE");
    } catch (err) {
        logger.error({ err, key }, "Cache DELETE error");
    }
}

/**
 * Invalidate all cache keys matching a pattern (e.g., "cache:video:feed:*").
 * Uses SCAN to avoid blocking Redis.
 */
export async function invalidatePattern(pattern) {
    try {
        if (!redisClient) return;
        let cursor = "0";
        let totalDeleted = 0;
        do {
            const [nextCursor, keys] = await redisClient.scan(cursor, "MATCH", pattern, "COUNT", 100);
            cursor = nextCursor;
            if (keys.length > 0) {
                await redisClient.del(...keys);
                totalDeleted += keys.length;
            }
        } while (cursor !== "0");
        if (totalDeleted > 0) {
            logger.debug({ pattern, totalDeleted }, "Cache INVALIDATE pattern");
        }
    } catch (err) {
        logger.error({ err, pattern }, "Cache INVALIDATE error");
    }
}
