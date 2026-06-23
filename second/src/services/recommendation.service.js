import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import WatchHistory from "../models/watchHistory.model.js";

/**
 * Returns videos with overlapping tags to the source video
 */
export const getContentBasedRecommendations = async (videoId, limit = 10) => {
    try {
        const sourceVideo = await Video.findById(videoId).select("tags");
        if (!sourceVideo || !sourceVideo.tags || sourceVideo.tags.length === 0) {
            return [];
        }

        const sourceTags = sourceVideo.tags;
        const videoObjectId = new mongoose.Types.ObjectId(videoId);

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

        return recommendations;
    } catch (error) {
        console.error("Content recommendations error:", error.message);
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
                $lookup: {
                    from: "watchhistories",
                    localField: "user",
                    foreignField: "user",
                    as: "otherWatched",
                    pipeline: [
                        {
                            $match: { video: { $ne: videoObjectId } }
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
        console.error("Collaborative recommendations error:", error.message);
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
            console.error("Backup recommendations fetch error:", error.message);
        }
    }

    return finalMerged.slice(0, limitNum);
};
