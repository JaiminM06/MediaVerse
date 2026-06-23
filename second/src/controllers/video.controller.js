import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import WatchHistory from "../models/watchHistory.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { 
    indexVideo as indexVideoSync, 
    deleteVideo as deleteVideoSync, 
    updateVideoViews as updateVideoViewsSync 
} from "../services/typesenseSync.service.js"


const getInfiniteHomeFeed = asyncHandler(async (req, res) => {
    const videos = await Video.find()
        .sort({ createdAt: -1 })   
        .populate("owner", "username")

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "videos fetched Successfully"))
})


const getAllVideos = asyncHandler(async (req, res) => {
    // const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    const videos= await Video.find(
        {
            owner:req.user._id
        }
    ).populate("owner", "username");
    return res
    .status(200)
    .json(new ApiResponse(200,videos,"videos fetched Successfully"))

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    let videoLocalPath;
    if (req.files && Array.isArray(req.files.videoFile) && req.files.videoFile.length > 0) {
        videoLocalPath = req.files.videoFile[0].path;
    }
    let thumbnailLocalPath;
    if (req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail.length > 0) {
        thumbnailLocalPath = req.files.thumbnail[0].path;
    }
    if (!videoLocalPath) {
        throw new ApiError(401, "video is required")
    }
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "thumbnail is required")
    }

    const video = await uploadOnCloudinary(videoLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if(!video){
        throw new ApiError(400,"video is required")
    }
    if(!thumbnail){
        throw new ApiError(400,"thumbnail is required")
    }
    const videoDataset = await Video.create({
        videoFile:video.url,
        thumbnail:thumbnail.url,
        description,
        duration:video.duration,
        owner:req.user._id,
        title
    })
    const uploadedVideo = await Video.findById(videoDataset._id)
    if (!uploadedVideo) {
        throw new ApiError(500, "something went wrong while uploading video")
    }

    // Sync with Typesense (fire and forget)
    Video.findById(uploadedVideo._id).populate("owner", "username avatar")
        .then(popVideo => {
            if (popVideo) indexVideoSync(popVideo);
        })
        .catch(err => console.error("Typesense index error on publish:", err.message));

    return res.status(201).json(
        new ApiResponse(200, uploadedVideo, "video uploaded  successfully")
    )
    // TODO: get video, upload to cloudinary, create video
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId?.trim()){
        throw new ApiError(400,"videoId is missing")
    }

    // Increment video views
    const video = await Video.findByIdAndUpdate(
        videoId,
        { $inc: { views: 1 } },
        { new: true }
    ).populate("owner", "username")

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    // Sync views to Typesense (fire and forget) if the video is ready and published
    if (video.isPublished && video.processingStatus === "ready") {
        try {
            updateVideoViewsSync(videoId, video.views);
        } catch (syncError) {
            console.error("Typesense views sync error:", syncError.message);
        }
    }

    // Add to user watch history
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $addToSet: {
                watchHistory: videoId
            }
        }
    )

    // Fire-and-forget record watch history in WatchHistory collection if authenticated
    if (req.user?._id) {
        WatchHistory.findOneAndUpdate(
            { user: req.user._id, video: videoId },
            { $set: { watchedAt: new Date() } },
            { upsert: true }
        ).catch(err => console.error("WatchHistory upsert error:", err.message));
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, video, "video fetched successfully")
        )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body
    const thumbnailLocalPath = req.file?.path

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
            .catch(err => console.error("Typesense index error on update:", err.message));
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video details updated Successfully"))

    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const delVideo=await Video.findByIdAndDelete(videoId)

    // Sync with Typesense (fire and forget)
    if (delVideo) {
        try {
            deleteVideoSync(videoId);
        } catch (syncError) {
            console.error("Typesense delete error:", syncError.message);
        }
    }

    return res
    .status(200)
    .json(new ApiResponse(200,delVideo,"Video deleted "))
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const video= await Video.findById(videoId)
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
        .catch(err => console.error("Typesense index error on toggle publish:", err.message));

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