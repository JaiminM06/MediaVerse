import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import WatchHistory from "../models/watchHistory.model.js"
import {Like} from "../models/like.model.js"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {deleteS3Object} from "../utils/s3.js"
import redisClient from "../config/redis.js"
import { 
    indexVideo as indexVideoSync, 
    deleteVideo as deleteVideoSync, 
    updateVideoViews as updateVideoViewsSync 
} from "../services/typesenseSync.service.js"
import { logger } from "../utils/logger.js"
import { getCache, setCache, deleteCache, invalidatePattern, CACHE_KEYS, CACHE_TTL } from "../utils/cache.js"
import { registerBufferedView, getBufferedViews } from "../services/viewBuffer.service.js"


const getInfiniteHomeFeed = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1
    const limit = Math.min(parseInt(req.query.limit) || 20, 50)
    const skip = (page - 1) * limit

    // Check cache first
    const cacheKey = CACHE_KEYS.videoFeed(page, limit);
    const cached = await getCache(cacheKey);
    if (cached) {
        return res.status(200).json(new ApiResponse(200, cached, "videos fetched Successfully (cached)"));
    }

    const videos = await Video.find({ isPublished: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("owner", "username avatar")

    const total = await Video.countDocuments({ isPublished: true })

    const data = { videos, total, page, limit };
    await setCache(cacheKey, data, CACHE_TTL.VIDEO_FEED);

    return res
        .status(200)
        .json(new ApiResponse(200, data, "videos fetched Successfully"))
})


const getAllVideos = asyncHandler(async (req, res) => {
    const page   = Math.max(parseInt(req.query.page)  || 1, 1);
    const limit  = Math.min(parseInt(req.query.limit) || 20, 50);
    const skip   = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortType = req.query.sortType === 'asc' ? 1 : -1;
    const query  = req.query.query || '';

    const filter = { owner: req.user._id };

    // Optional search filter by title
    if (query.trim()) {
      filter.title = { $regex: query.trim(), $options: 'i' };
    }

    const [videos, total] = await Promise.all([
      Video.find(filter)
        .sort({ [sortBy]: sortType })
        .skip(skip)
        .limit(limit)
        .populate('owner', 'username avatar fullName'),
      Video.countDocuments(filter)
    ]);

    return res.status(200).json(
      new ApiResponse(200, {
        videos,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total
      }, 'Videos fetched successfully')
    );
});

const publishAVideo = asyncHandler(async (req, res) => {
    throw new ApiError(
      410,
      'Direct video upload is deprecated. Use POST /api/v1/upload/request-url to get a presigned S3 URL, then POST /api/v1/upload/confirm/:videoId to start processing.'
    );
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid or missing video ID")
    }

    // Attempt to fetch from cache first
    const cacheKey = CACHE_KEYS.videoDetail(videoId);
    let videoData = await getCache(cacheKey);

    let isOwner = false;

    if (!videoData) {
        const video = await Video.findById(videoId).populate("owner", "username avatar");
        
        if (!video) {
            throw new ApiError(404, "Video not found");
        }
        
        const likeCount = await Like.countDocuments({ video: videoId });
        
        videoData = video.toObject();
        videoData.likeCount = likeCount;

        // Cache the metadata for 5 minutes
        await setCache(cacheKey, videoData, CACHE_TTL.VIDEO_DETAIL);
    }

    const ownerId = videoData.owner?._id || videoData.owner;
    isOwner = req.user?._id && ownerId && ownerId.toString() === req.user._id.toString();

    let isNewView = false;
    if (!isOwner) {
        const viewerIdentifier = req.user?._id 
            ? req.user._id.toString() 
            : req.ip;
        
        // Register view asynchronously in Redis buffer (returns true if it wasn't viewed in 24h)
        isNewView = await registerBufferedView(videoId, viewerIdentifier);
    }

    // Fire-and-forget record watch history ONLY if it is a new view
    if (req.user?._id && isNewView) {
        WatchHistory.findOneAndUpdate(
            { user: req.user._id, video: videoId },
            { $set: { watchedAt: new Date() } },
            { upsert: true }
        )
        .then(() => {
            invalidatePattern(`cache:homefeed:${req.user._id}:*`);
        })
        .catch(err => logger.error({ err, videoId }, "WatchHistory upsert error"));
    }

    let isLiked = false;
    if (req.user?._id) {
        const likeCacheKey = CACHE_KEYS.videoLikeStatus(videoId, req.user._id);
        const cachedLike = await getCache(likeCacheKey);
        if (cachedLike !== null) {
            isLiked = cachedLike.isLiked;
        } else {
            isLiked = !!(await Like.exists({ video: videoId, likedBy: req.user._id }));
            // Cache like status for 2 minutes to prevent DB read contention on viral refreshes
            await setCache(likeCacheKey, { isLiked }, 120);
        }
    }

    // Fetch buffered views to give approximate real-time view count
    const bufferedViews = await getBufferedViews(videoId);

    videoData.isLiked = isLiked;
    videoData.views = (videoData.views || 0) + bufferedViews;

    return res
        .status(200)
        .json(
            new ApiResponse(200, videoData, "video fetched successfully")
        )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid or missing video ID")
    }
    const { title, description } = req.body
    const thumbnailLocalPath = req.file?.path

    const videoObj = await Video.findById(videoId)
    if (!videoObj) {
        throw new ApiError(404, "Video not found")
    }
    if (videoObj.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this video")
    }

    const updateFields = {}
    if (title) updateFields.title = title
    if (description) updateFields.description = description

    if (thumbnailLocalPath) {
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
        if (thumbnail) {
            updateFields.thumbnail = thumbnail.url
        } else {
            throw new ApiError(500, "Failed to upload new thumbnail")
        }
    }

    if (Object.keys(updateFields).length === 0) {
        throw new ApiError(400, "At least one field (title, description, or thumbnail) must be updated")
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: updateFields
        },
        { new: true }
    )

    // Sync with Typesense (fire and forget)
    if (video) {
        Video.findById(video._id).populate("owner", "username avatar")
            .then(popVideo => {
                if (popVideo) indexVideoSync(popVideo);
            })
            .catch(err => logger.error({ err }, "Typesense index error on update"));
    }

    // Invalidate caches
    await deleteCache(CACHE_KEYS.videoDetail(videoId));
    invalidatePattern("cache:video:feed:*");

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video details updated Successfully"))

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid or missing video ID")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this video")
    }

    const delVideo = await Video.findByIdAndDelete(videoId)

    // Sync with Typesense (fire and forget)
    if (delVideo) {
        try {
            deleteVideoSync(videoId);
        } catch (syncError) {
            logger.error({ err: syncError, videoId }, "Typesense delete error");
        }
    }

    // Clean up S3 (do not await)
    if (video.rawFileKey) {
        deleteS3Object(process.env.AWS_S3_RAW_BUCKET, video.rawFileKey)
            .catch(err => logger.error({ err }, "Failed to delete S3 raw object"));
    }
    if (video.hlsManifestUrl) {
        deleteS3Object(process.env.AWS_S3_PROCESSED_BUCKET, `videos/${videoId}`)
            .catch(err => logger.error({ err }, "Failed to delete S3 processed objects"));
    }

    // Clean up orphaned documents (do not await)
    Like.deleteMany({ video: videoId }).catch(err => logger.error({ err }, "Failed to delete video likes"))
    Comment.deleteMany({ video: videoId }).catch(err => logger.error({ err }, "Failed to delete video comments"))
    WatchHistory.deleteMany({ video: videoId }).catch(err => logger.error({ err }, "Failed to delete video watch histories"))

    // Invalidate caches
    await deleteCache(CACHE_KEYS.videoDetail(videoId));
    invalidatePattern("cache:video:feed:*");
    invalidatePattern("cache:homefeed:*");

    return res
    .status(200)
    .json(new ApiResponse(200,delVideo,"Video deleted "))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid or missing video ID")
    }
    const video= await Video.findById(videoId)
    if (!video) throw new ApiError(404, "Video not found")
    if(video.isPublished===true){
        video.isPublished=false
    }
    else{
        video.isPublished=true
    }
    await video.save({ validateBeforeSave: false })

    // Sync status change with Typesense (fire and forget)
    Video.findById(videoId).populate("owner", "username avatar")
        .then(popVideo => {
            if (popVideo) {
                indexVideoSync(popVideo);
            }
        })
        .catch(err => logger.error({ err }, "Typesense index error on toggle publish"));

    // Invalidate caches
    invalidatePattern("cache:video:feed:*");

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "published is toggled Successfully"))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    getInfiniteHomeFeed
}