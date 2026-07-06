import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import WatchHistory from "../models/watchHistory.model.js";
import { logger } from "../utils/logger.js";
import { getCache, setCache } from "../utils/cache.js";

/**
 * Returns videos with overlapping tags to the source video
 */
export const getContentBasedRecommendations = async (videoId, limit = 10) => {
    try {
        const t0 = performance.now();
        const sourceVideo = await Video.findById(videoId).select("tags");
        const t1 = performance.now();

        if (!sourceVideo || !sourceVideo.tags || sourceVideo.tags.length === 0) {
            logger.info({
                recommendationCall: {
                    videoId,
                    findByIdTime: `${(t1 - t0).toFixed(2)} ms`,
                    aggregationTime: "0.00 ms",
                    total: `${(t1 - t0).toFixed(2)} ms`
                }
            }, "getContentBasedRecommendations Internal Profile");
            return [];
        }

        const sourceTags = sourceVideo.tags;
        const videoObjectId = new mongoose.Types.ObjectId(videoId);

        const t2 = performance.now();
        const recommendations = await Video.aggregate([
            {
                $match: {
                    tags: { $in: sourceTags },
                    _id: { $ne: videoObjectId },
                    isPublished: true
                }
            },
            {
                $addFields: {
                    tagOverlap: {
                        $size: { $setIntersection: ["$tags", sourceTags] }
                    }
                }
            },
            {
                $sort: { tagOverlap: -1, views: -1 }
            },
            {
                $limit: Number(limit) || 10
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner"
                }
            },
            {
                $unwind: "$owner"
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    thumbnail: 1,
                    duration: 1,
                    views: 1,
                    owner: { username: 1, avatar: 1 },
                    hlsManifestUrl: 1,
                    createdAt: 1,
                    tagOverlap: 1
                }
            }
        ]);
        const t3 = performance.now();

        logger.info({
            recommendationCall: {
                videoId,
                findByIdTime: `${(t1 - t0).toFixed(2)} ms`,
                aggregationTime: `${(t3 - t2).toFixed(2)} ms`,
                total: `${(t3 - t0).toFixed(2)} ms`
            }
        }, "getContentBasedRecommendations Internal Profile");

        return recommendations;
    } catch (error) {
        logger.error({ err: error, videoId }, "Content recommendations error");
        return [];
    }
};

/**
 * Returns content-based recommendations for multiple source video IDs in a single batch query.
 * Collects a unique union of tags, executes one aggregation, and sorts by intersection size and views.
 */
export const getBatchContentRecommendations = async (videoIds, limit = 10, preResolvedTags = null) => {
    try {
        if (!Array.isArray(videoIds) || videoIds.length === 0) {
            return [];
        }

        const videoObjectIds = videoIds.map(id => new mongoose.Types.ObjectId(id));
        let unionTags = preResolvedTags;

        if (!unionTags) {
            // 1. Single database query to fetch tags for all source videos
            const sourceVideos = await Video.find({ _id: { $in: videoObjectIds } })
                .select("tags")
                .lean();

            if (sourceVideos.length === 0) {
                return [];
            }

            // Collect union of unique tags
            unionTags = [...new Set(sourceVideos.flatMap(v => v.tags || []))];
        }

        if (unionTags.length === 0) {
            return [];
        }

        // 2. Single aggregation pipeline matching overlapping tags, excluding source videos
        const recommendations = await Video.aggregate([
            {
                $match: {
                    tags: { $in: unionTags },
                    _id: { $nin: videoObjectIds },
                    isPublished: true
                }
            },
            {
                $addFields: {
                    tagOverlap: {
                        $size: { $setIntersection: ["$tags", unionTags] }
                    }
                }
            },
            {
                $sort: { tagOverlap: -1, views: -1 }
            },
            {
                $limit: Number(limit) || 10
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner"
                }
            },
            {
                $unwind: "$owner"
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    thumbnail: 1,
                    duration: 1,
                    views: 1,
                    owner: { username: 1, avatar: 1 },
                    hlsManifestUrl: 1,
                    createdAt: 1,
                    tagOverlap: 1
                }
            }
        ]);

        return recommendations;
    } catch (error) {
        logger.error({ err: error, videoIds }, "Batch content recommendations error");
        return [];
    }
};

/**
 * Returns videos watched by other users who also watched the source video
 */
export const getCollaborativeRecommendations = async (videoId, limit = 10) => {
    try {
        const videoObjectId = new mongoose.Types.ObjectId(videoId);

        const recommendations = await WatchHistory.aggregate([
            {
                $match: { video: videoObjectId }
            },
            {
                $limit: 50
            },
            {
                $lookup: {
                    from: "watchhistories",
                    localField: "user",
                    foreignField: "user",
                    as: "otherWatched",
                    pipeline: [
                        {
                            $match: { video: { $ne: videoObjectId } }
                        },
                        {
                            $limit: 20
                        }
                    ]
                }
            },
            {
                $unwind: "$otherWatched"
            },
            {
                $group: {
                    _id: "$otherWatched.video",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: (Number(limit) || 10) * 2
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "_id",
                    foreignField: "_id",
                    as: "video"
                }
            },
            {
                $unwind: "$video"
            },
            {
                $match: { "video.isPublished": true }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "video.owner",
                    foreignField: "_id",
                    as: "video.owner"
                }
            },
            {
                $unwind: "$video.owner"
            },
            {
                $project: {
                    _id: "$video._id",
                    title: "$video.title",
                    thumbnail: "$video.thumbnail",
                    duration: "$video.duration",
                    views: "$video.views",
                    owner: {
                        username: "$video.owner.username",
                        avatar: "$video.owner.avatar"
                    },
                    hlsManifestUrl: "$video.hlsManifestUrl",
                    createdAt: "$video.createdAt",
                    count: 1
                }
            },
            {
                $limit: Number(limit) || 10
            }
        ]);

        return recommendations;
    } catch (error) {
        logger.error({ err: error, videoId }, "Collaborative recommendations error");
        return [];
    }
};

/**
 * Returns merged content-based and collaborative recommendations
 */
export const getRecommendations = async (videoId, limit = 15) => {
    const limitNum = Number(limit) || 15;

    const [contentBased, collaborative] = await Promise.all([
        getContentBasedRecommendations(videoId, limitNum),
        getCollaborativeRecommendations(videoId, limitNum)
    ]);

    const merged = new Map();

    // Score based on order: higher index means lower rank/score
    collaborative.forEach((v, index) => {
        const score = (limitNum * 2) - index;
        merged.set(v._id.toString(), { video: v, score });
    });

    contentBased.forEach((v, index) => {
        const score = (limitNum * 2) - index;
        const key = v._id.toString();
        const existing = merged.get(key);
        if (existing) {
            existing.score += score;
        } else {
            merged.set(key, { video: v, score });
        }
    });

    let finalMerged = Array.from(merged.values())
        .sort((a, b) => b.score - a.score)
        .map(item => item.video);

    if (finalMerged.length < limitNum) {
        const excludedIds = finalMerged.map(v => new mongoose.Types.ObjectId(v._id));
        excludedIds.push(new mongoose.Types.ObjectId(videoId));
        const remainingLimit = limitNum - finalMerged.length;

        try {
            const backupVideos = await Video.aggregate([
                {
                    $match: {
                        isPublished: true,
                        _id: { $nin: excludedIds }
                    }
                },
                {
                    $sort: { createdAt: -1 }
                },
                {
                    $limit: remainingLimit
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "owner",
                        foreignField: "_id",
                        as: "owner"
                    }
                },
                {
                    $unwind: "$owner"
                },
                {
                    $project: {
                        _id: 1,
                        title: 1,
                        thumbnail: 1,
                        duration: 1,
                        views: 1,
                        owner: { username: 1, avatar: 1 },
                        hlsManifestUrl: 1,
                        createdAt: 1
                    }
                }
            ]);
            finalMerged = finalMerged.concat(backupVideos);
        } catch (error) {
            logger.error({ err: error, videoId }, "Backup recommendations fetch error");
        }
    }

    return finalMerged.slice(0, limitNum);
};



/**
 * Highly scalable recommendation engine that works for millions of videos:
 * 1. Uses the compound index { isPublished: 1, tags: 1, views: -1 } or { isPublished: 1, views: -1, tags: 1 } to fetch a candidate pool.
 * 2. Re-ranks candidates in-memory in Node.js using weighted tag overlap, freshness boost, and popularity boost.
 * 3. Does not populate "owner" info on candidates, postponing it until the final selection slice.
 */
export const getBatchContentRecommendationsScalable = async (videoIds, limitNum, tagWeights, candidateLimit = 300) => {
    const unionTags = Object.keys(tagWeights);
    if (!Array.isArray(videoIds) || videoIds.length === 0 || unionTags.length === 0) {
        return [];
    }

    const videoObjectIds = videoIds.map(id => new mongoose.Types.ObjectId(id));

    // Fetch candidate videos from MongoDB using B-tree compound index (owner is NOT populated here)
    const candidates = await Video.find({
        isPublished: true,
        tags: { $in: unionTags },
        _id: { $nin: videoObjectIds }
    })
    .sort({ views: -1 })
    .limit(candidateLimit)
    .select("_id title thumbnail duration views owner hlsManifestUrl createdAt tags")
    .lean();

    if (!candidates || candidates.length === 0) {
        return [];
    }

    const now = Date.now();
    const scored = [];

    for (const video of candidates) {
        // A. Weighted Tag Overlap Score
        let tagScore = 0;
        if (Array.isArray(video.tags)) {
            for (const tag of video.tags) {
                if (tagWeights[tag]) {
                    tagScore += tagWeights[tag];
                }
            }
        }

        if (tagScore > 0) {
            // B. Freshness Boost: decays over time, range: 1.0 (brand new) down to 0.05
            const ageInDays = (now - new Date(video.createdAt).getTime()) / (24 * 60 * 60 * 1000);
            const freshnessBoost = 1 / (1 + ageInDays);

            // C. Popularity Boost: log10 scale for views
            const popularityBoost = Math.log10((video.views || 0) + 1) * 0.2;

            // Combine scores: base tag score + freshness (up to 0.5 points) + popularity (up to ~0.5 points)
            const finalScore = tagScore + (freshnessBoost * 0.5) + popularityBoost;
            scored.push({ video, score: finalScore });
        }
    }

    // Sort by final hybrid score descending
    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limitNum).map(item => item.video);
};

