import crypto from "crypto";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js";
import { getPresignedUploadUrl } from "../utils/s3.js";
import { addVideoProcessingJob } from "../queues/videoQueue.js";

export const requestUploadUrl = asyncHandler(async (req, res) => {
    const { fileName, contentType, fileSize, title, description, tags } = req.body;

    if (!fileName || !contentType || !fileSize || !title || !description) {
        throw new ApiError(400, "All fields (fileName, contentType, fileSize, title, description) are required");
    }

    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!allowedTypes.includes(contentType)) {
        throw new ApiError(400, "Invalid contentType. Supported types: mp4, webm, quicktime");
    }

    // Limit to 500MB (524288000 bytes)
    if (fileSize > 524288000) {
        throw new ApiError(413, "File size too large. Max allowed size is 500MB");
    }

    // Infer extension
    let ext = "mp4";
    if (contentType === "video/webm") ext = "webm";
    else if (contentType === "video/quicktime") ext = "mov";

    // Generate unique raw S3 Key
    const key = `videos/raw/${req.user._id}/${Date.now()}_${crypto.randomUUID()}.${ext}`;

    const { uploadUrl } = await getPresignedUploadUrl(key, contentType);

    // Create draft Video in DB
    const video = await Video.create({
        title,
        description,
        tags: tags || [],
        owner: req.user._id,
        videoFile: "pending", // placeholders since fields are required in schema
        thumbnail: "pending",
        duration: 0,
        rawFileKey: key,
        processingStatus: "uploading",
        isPublished: false
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200, 
                { uploadUrl, videoId: video._id, key }, 
                "Presigned upload URL generated successfully"
            )
        );
});

export const confirmUploadAndProcess = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Verify ownership
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You do not have permission to process this video");
    }

    // Verify status
    if (video.processingStatus !== "uploading") {
        throw new ApiError(400, "Video already queued or processed");
    }

    // Add transcode job to BullMQ
    await addVideoProcessingJob({
        videoId: video._id,
        userId: req.user._id,
        s3Key: video.rawFileKey,
        requestedFormats: ['360p', '480p', '720p', '1080p']
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { videoId },
                "Video queued for processing successfully"
            )
        );
});

export const getVideoStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const video = await Video.findById(videoId).select(
        "processingStatus processingError hlsManifestUrl thumbnails variants metadata"
    );

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                video,
                "Video status retrieved successfully"
            )
        );
});

export const getVideoStream = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const video = await Video.findById(videoId).populate("owner", "username avatar");

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.processingStatus !== "ready") {
        throw new ApiError(400, "Video is not ready for streaming");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    hlsManifestUrl: video.hlsManifestUrl,
                    thumbnails: video.thumbnails,
                    variants: video.variants,
                    metadata: video.metadata,
                    title: video.title,
                    description: video.description,
                    owner: video.owner
                },
                "Video stream fetched successfully"
            )
        );
});
