import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js";
import WatchHistory from "../models/watchHistory.model.js";
import { getCache, setCache, CACHE_KEYS, CACHE_TTL } from "../utils/cache.js";
import {
    getRecommendations,
    getContentBasedRecommendations,
    getBatchContentRecommendations,
    getBatchContentRecommendationsScalable
} from "../services/recommendation.service.js";

/**
 * Gets content & collaborative recommendation list for a specific video
 */
export const getVideoRecommendations = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { limit = 15 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const limitNum = Math.min(Number(limit) || 15, 30);
    const recommendations = await getRecommendations(videoId, limitNum);

    return res.status(200).json(
        new ApiResponse(200, { recommendations }, "Recommendations fetched successfully")
    );
});

import { logger } from "../utils/logger.js";

const activeRequests = new Map(); // cacheKey -> Promise

/**
 * Fetches personalized feed for authenticated users, fallback to general trending for guests
 */
export const getHomeFeed = asyncHandler(async (req, res) => {
    const pageNum = Number(req.query.page) || 1;
    const limitNum = Math.min(Number(req.query.limit) || 20, 50);

    const startTime = performance.now();

    // Check Redis Cache
    const cacheKey = CACHE_KEYS.homeFeed(req.user?._id?.toString(), pageNum, limitNum);
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
        const totalTime = performance.now() - startTime;
        res.setHeader("X-Cache", "HIT");
        res.setHeader("Server-Timing", `cache;dur=${totalTime.toFixed(2)}, total;dur=${totalTime.toFixed(2)}`);
        logger.info({ cacheHit: true, userId: req.user?._id?.toString() }, "Home Feed Cache HIT");
        return res.status(200).json(
            new ApiResponse(200, cachedData, "Feed fetched from cache")
        );
    }

    // Cache MISS - Check if another request is already generating this feed
    if (activeRequests.has(cacheKey)) {
        logger.info({ userId: req.user?._id?.toString() }, "Coalescing request (waiting for active generation)");
        const result = await activeRequests.get(cacheKey);
        const totalTime = performance.now() - startTime;
        res.setHeader("X-Cache", "HIT-COALESCED");
        res.setHeader("Server-Timing", `coalesced;dur=${totalTime.toFixed(2)}, total;dur=${totalTime.toFixed(2)}`);
        return res.status(200).json(
            new ApiResponse(200, result, "Feed fetched from coalesced generator")
        );
    }

    // Define and register the generator promise
    const generationPromise = (async () => {
        try {
            if (req.user?._id) {
                // Authenticated user feed
                const t0 = performance.now();
                
                // 1. Fetch last 3 watched videos with tags (efficient key-lookup)
                const lastWatched = await WatchHistory.find({ user: req.user._id })
                    .sort({ watchedAt: -1 })
                    .limit(3)
                    .select("video")
                    .populate({
                        path: "video",
                        select: "tags"
                    })
                    .lean();
                const t1 = performance.now();

                let feed = [];
                let t2 = performance.now();
                let t3 = performance.now();

                if (lastWatched && lastWatched.length > 0) {
                    t2 = performance.now();
                    const watchedVideoIds = [];
                    const tagWeights = {};

                    // Calculate weights: recency (1.0, 0.75, 0.5) * frequency of tags in watch history
                    lastWatched.forEach((record, index) => {
                        if (record.video) {
                            watchedVideoIds.push(record.video._id);
                            if (Array.isArray(record.video.tags)) {
                                const recencyWeight = 1.0 - (index * 0.25);
                                for (const tag of record.video.tags) {
                                    tagWeights[tag] = (tagWeights[tag] || 0) + recencyWeight;
                                }
                            }
                        }
                    });

                    // 2. Fetch and re-rank candidate recommendations using DB indexes (candidate pool: 300)
                    if (Object.keys(tagWeights).length > 0) {
                        feed = await getBatchContentRecommendationsScalable(watchedVideoIds, limitNum, tagWeights, 300);
                    }
                    t3 = performance.now();
                }

                const t4 = performance.now(); // End of merge

                let t5 = performance.now();
                let t6 = performance.now();

                // 3. If personalized feed is insufficient, pad with latest videos using scalable index-based query
                if (feed.length < limitNum) {
                    t5 = performance.now();
                    const excludedIds = feed.map(v => new mongoose.Types.ObjectId(v._id));
                    const remainingLimit = limitNum - feed.length;

                    const padVideos = await Video.find({
                        isPublished: true,
                        _id: { $nin: excludedIds }
                    })
                    .sort({ createdAt: -1 })
                    .skip((pageNum - 1) * remainingLimit)
                    .limit(remainingLimit)
                    .select("_id title thumbnail duration views owner hlsManifestUrl createdAt")
                    .lean();

                    feed = feed.concat(padVideos);
                    t6 = performance.now();
                }

                // Slice the final feed to the requested limit
                const finalFeed = feed.slice(0, limitNum);

                // 4. Postponed Populate: populate "owner" details ONLY for the final 20 returned videos
                if (finalFeed.length > 0) {
                    await Video.populate(finalFeed, {
                        path: "owner",
                        select: "username avatar"
                    });
                }

                const totalTime = performance.now() - startTime;

                logger.info({
                    profile: {
                        watchHistoryQuery: `${(t1 - t0).toFixed(2)} ms`,
                        recGeneration: `${(t3 - t2).toFixed(2)} ms`,
                        mergeResults: `${(t4 - t3).toFixed(2)} ms`,
                        fallbackQuery: `${(t6 - t5).toFixed(2)} ms`,
                        totalTime: `${totalTime.toFixed(2)} ms`
                    }
                }, "Personalized Feed Generation Profile (Scalable)");

                const responseData = { feed: finalFeed, isPersonalized: true };
                await setCache(cacheKey, responseData, CACHE_TTL.VIDEO_FEED);
                return responseData;
            } else {
                // Guest user feed: sort by views and date (fully index-supported)
                const t0 = performance.now();
                const skipCount = (pageNum - 1) * limitNum;
                const feed = await Video.find({ isPublished: true })
                    .sort({ views: -1, createdAt: -1 })
                    .skip(skipCount)
                    .limit(limitNum)
                    .populate("owner", "username avatar")
                    .lean();
                const t1 = performance.now();

                logger.info({
                    profile: {
                        guestQuery: `${(t1 - t0).toFixed(2)} ms`,
                        totalTime: `${(t1 - startTime).toFixed(2)} ms`
                    }
                }, "Guest Feed Generation Profile (Scalable)");

                const responseData = { feed, isPersonalized: false };
                await setCache(cacheKey, responseData, CACHE_TTL.VIDEO_FEED);
                return responseData;
            }
        } finally {
            // Delete key from active map as soon as promise resolves or rejects
            activeRequests.delete(cacheKey);
        }
    })();

    activeRequests.set(cacheKey, generationPromise);

    res.setHeader("X-Cache", "MISS");
    logger.info({ cacheHit: false, userId: req.user?._id?.toString() }, "Home Feed Cache MISS");

    try {
        const responseData = await generationPromise;
        return res.status(200).json(
            new ApiResponse(200, responseData, "Home feed fetched successfully")
        );
    } catch (err) {
        logger.error({ err }, "Error generating home feed");
        return res.status(500).json(new ApiResponse(500, null, "Failed to generate home feed"));
    }
});
