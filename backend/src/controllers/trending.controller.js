import { Video } from "../models/video.model.js";
import { Tweet } from "../models/tweet.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Gets trending videos based on engagementScore (views + 5 * likes) within a cutoff date
 */
export const getTrendingVideos = asyncHandler(async (req, res) => {
    const { period = "week" } = req.query;

    let cutoffDate;
    const now = Date.now();

    if (period === "day") {
        cutoffDate = new Date(now - 24 * 60 * 60 * 1000);
    } else if (period === "month") {
        cutoffDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
    } else {
        // default to 'week'
        cutoffDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
    }

    const trending = await Video.aggregate([
        {
            $match: {
                isPublished: true,
                createdAt: { $gte: cutoffDate }
            }
        },
        // Lookup likes since Video schema doesn't store likes in-document
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $addFields: {
                engagementScore: {
                    $add: [
                        "$views",
                        { $multiply: [{ $size: { $ifNull: ["$likes", []] } }, 5] }
                    ]
                }
            }
        },
        {
            $sort: { engagementScore: -1 }
        },
        {
            $limit: 20
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
                engagementScore: 1
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(200, { trending, period }, "Trending videos fetched successfully")
    );
});

/**
 * Gets trending hashtags from the last 7 days
 */
export const getTrendingHashtags = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;
    const limitNum = Math.min(Number(limit) || 10, 20);

    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const trending = await Tweet.aggregate([
        {
            $match: {
                createdAt: { $gte: cutoffDate }
            }
        },
        {
            $unwind: "$hashtags"
        },
        {
            $group: {
                _id: "$hashtags",
                count: { $sum: 1 }
            }
        },
        {
            $sort: { count: -1 }
        },
        {
            $limit: limitNum
        },
        {
            $project: {
                hashtag: "$_id",
                count: 1,
                _id: 0
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(200, { trending }, "Trending hashtags fetched successfully")
    );
});
