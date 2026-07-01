import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js";
import WatchHistory from "../models/watchHistory.model.js";
import {
    getRecommendations,
    getContentBasedRecommendations
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

/**
 * Fetches personalized feed for authenticated users, fallback to general trending for guests
 */
export const getHomeFeed = asyncHandler(async (req, res) => {
    const pageNum = Number(req.query.page) || 1;
    const limitNum = Math.min(Number(req.query.limit) || 20, 50);

    if (req.user?._id) {
        // Authenticated user feed
        const lastWatched = await WatchHistory.find({ user: req.user._id })
            .sort({ watchedAt: -1 })
            .limit(3)
            .select("video");

        let feed = [];

        if (lastWatched && lastWatched.length > 0) {
            // Get content overlap recommendations for last watched videos in parallel
            const contentRecsList = await Promise.all(
                lastWatched.map(w => getContentBasedRecommendations(w.video, limitNum))
            );

            // Flatten & deduplicate recommendations
            const seenIds = new Set();
            contentRecsList.flat().forEach(video => {
                const idStr = video._id.toString();
                if (!seenIds.has(idStr)) {
                    seenIds.add(idStr);
                    feed.push(video);
                }
            });
        }

        // If personalized feed is insufficient, pad with latest videos
        if (feed.length < limitNum) {
            const excludedIds = feed.map(v => new mongoose.Types.ObjectId(v._id));
            const remainingLimit = limitNum - feed.length;

            const padVideos = await Video.aggregate([
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
                    $skip: (pageNum - 1) * remainingLimit
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

            feed = feed.concat(padVideos);
        }

        return res.status(200).json(
            new ApiResponse(200, { feed: feed.slice(0, limitNum), isPersonalized: true }, "Personalized feed fetched successfully")
        );
    } else {
        // Guest user feed: sort by views and date
        const skipCount = (pageNum - 1) * limitNum;
        const feed = await Video.find({ isPublished: true })
            .sort({ views: -1, createdAt: -1 })
            .skip(skipCount)
            .limit(limitNum)
            .populate("owner", "username avatar");

        return res.status(200).json(
            new ApiResponse(200, { feed, isPersonalized: false }, "General feed fetched successfully")
        );
    }
});
