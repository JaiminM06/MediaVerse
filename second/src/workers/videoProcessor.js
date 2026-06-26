import { Worker } from "bullmq";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { pipeline } from "stream/promises";
import { promises as fsPromises } from "fs";
import fs from "fs";
import path from "path";
import os from "os";
import ffmpeg from "fluent-ffmpeg";
import redisConnection from "../config/redis.js";
import { Video } from "../models/video.model.js";
import { s3Client, getCloudFrontUrl } from "../utils/s3.js";
import { sendNotification } from "../services/notification.service.js";
import { indexVideo } from "../services/typesenseSync.service.js";
import { logger } from "../utils/logger.js";

// Helper to resolve MIME type for HLS segments, playlist, and images
const getContentType = (filename) => {
    if (filename.endsWith(".m3u8")) return "application/x-mpegURL";
    if (filename.endsWith(".ts")) return "video/MP2T";
    if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) return "image/jpeg";
    return "application/octet-stream";
};

// Promise-based ffprobe wrapper to extract video metadata
const getMetadata = (filePath) => {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) reject(err);
            else resolve(metadata);
        });
    });
};

// Promise-based ffmpeg wrapper to transcode video to HLS resolution
const transcodeToHLS = (inputPath, outputPath, config) => {
    return new Promise((resolve, reject) => {
        const segmentFilename = path.join(outputPath, "segment_%03d.ts").replace(/\\/g, "/");
        const playlistPath = path.join(outputPath, "playlist.m3u8").replace(/\\/g, "/");

        ffmpeg(inputPath)
            .outputOptions([
                `-vf scale=${config.width}:${config.height}`,
                `-c:v libx264`,
                `-b:v ${config.videoBitrate}`,
                `-c:a aac`,
                `-b:a ${config.audioBitrate}`,
                `-hls_time 6`,
                `-hls_list_size 0`,
                `-hls_segment_filename ${segmentFilename}`
            ])
            .output(playlistPath)
            .on("end", () => resolve())
            .on("error", (err) => reject(err))
            .run();
    });
};

// Promise-based ffmpeg wrapper to generate thumbnails
const generateThumbnails = (inputPath, thumbnailDir, duration) => {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .on("end", () => resolve())
            .on("error", (err) => reject(err))
            .screenshots({
                count: 3,
                timestamps: [duration * 0.25, duration * 0.5, duration * 0.75],
                filename: "thumb_%i.jpg",
                folder: thumbnailDir,
                size: "640x360"
            });
    });
};

// Recursively upload a local directory to S3 processed bucket
const uploadDirectoryToS3 = async (localDir, s3Prefix) => {
    const files = await fsPromises.readdir(localDir, { withFileTypes: true });
    const uploadedFiles = [];

    for (const file of files) {
        const localPath = path.join(localDir, file.name);
        if (file.isDirectory()) {
            const subdirUploads = await uploadDirectoryToS3(
                localPath,
                `${s3Prefix}/${file.name}`
            );
            uploadedFiles.push(...subdirUploads);
        } else {
            const s3Key = `${s3Prefix}/${file.name}`.replace(/\\/g, "/");
            const fileStream = fs.createReadStream(localPath);
            const fileSize = fs.statSync(localPath).size;

            await s3Client.send(new PutObjectCommand({
                Bucket: process.env.AWS_S3_PROCESSED_BUCKET,
                Key: s3Key,
                Body: fileStream,
                ContentType: getContentType(file.name),
            }));

            uploadedFiles.push({
                s3Key,
                fileName: file.name,
                localPath,
                size: fileSize
            });
        }
    }
    return uploadedFiles;
};

// Define standard resolutions config
const RESOLUTIONS_CONFIG = [
    { name: "360p", width: 640, height: 360, videoBitrate: "800k", audioBitrate: "96k" },
    { name: "480p", width: 854, height: 480, videoBitrate: "1500k", audioBitrate: "128k" },
    { name: "720p", width: 1280, height: 720, videoBitrate: "3000k", audioBitrate: "128k" },
    { name: "1080p", width: 1920, height: 1080, videoBitrate: "5000k", audioBitrate: "192k" }
];

const videoProcessor = new Worker("video-processing", async (job) => {
    const { videoId, s3Key, userId } = job.data;
    const ext = path.extname(s3Key).substring(1) || "mp4";
    const localRawPath = path.join(os.tmpdir(), `${videoId}_raw.${ext}`);
    const baseTempDir = path.join(os.tmpdir(), videoId);

    logger.info({ jobId: job.id, videoId }, "Starting video processing job");

    try {
        // 1. DOWNLOAD raw video from S3 raw bucket
        const getObjectCommand = new GetObjectCommand({
            Bucket: process.env.AWS_S3_RAW_BUCKET,
            Key: s3Key,
        });
        const response = await s3Client.send(getObjectCommand);
        await pipeline(response.Body, fs.createWriteStream(localRawPath));

        // 2. UPDATE video in MongoDB to 'processing'
        await Video.findByIdAndUpdate(videoId, { processingStatus: "processing" });

        // 3. EXTRACT METADATA
        const ffprobeData = await getMetadata(localRawPath);
        const videoStream = ffprobeData.streams.find(s => s.codec_type === "video");
        
        const duration = ffprobeData.format.duration || 0;
        const codec = videoStream?.codec_name || null;
        let fps = null;
        if (videoStream?.r_frame_rate) {
            const parts = videoStream.r_frame_rate.split("/");
            if (parts.length === 2 && parseFloat(parts[1]) !== 0) {
                fps = parseFloat(parts[0]) / parseFloat(parts[1]);
            } else if (parts.length === 1) {
                fps = parseFloat(parts[0]);
            }
        }
        
        const originalWidth = videoStream?.width || 0;
        const originalHeight = videoStream?.height || 0;
        const originalResolution = originalWidth && originalHeight ? `${originalWidth}x${originalHeight}` : null;
        const fileSize = fs.statSync(localRawPath).size;

        await Video.findByIdAndUpdate(videoId, {
            duration,
            metadata: { codec, fps, originalResolution, fileSize }
        });

        // Create directory structures in temp
        await fsPromises.mkdir(baseTempDir, { recursive: true });
        const thumbnailDir = path.join(baseTempDir, "thumbnails");
        await fsPromises.mkdir(thumbnailDir, { recursive: true });

        // 4. TRANSCODE using fluent-ffmpeg (resolutions <= originalHeight)
        const activeResolutions = RESOLUTIONS_CONFIG.filter(r => r.height <= originalHeight);
        
        // If the original height is smaller than 360px, transcode at least to the smallest resolution config
        if (activeResolutions.length === 0) {
            activeResolutions.push(RESOLUTIONS_CONFIG[0]);
        }

        for (const res of activeResolutions) {
            const resOutputDir = path.join(baseTempDir, res.name);
            await fsPromises.mkdir(resOutputDir, { recursive: true });
            logger.info({ videoId, resolution: res.name }, "Transcoding video resolution");
            await transcodeToHLS(localRawPath, resOutputDir, res);
        }

        // Generate Master Manifest file (.m3u8)
        let masterManifestContent = "#EXTM3U\n#EXT-X-VERSION:3\n";
        for (const res of activeResolutions) {
            const bandwidth = parseInt(res.videoBitrate) * 1000;
            masterManifestContent += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${res.width}x${res.height}\n`;
            masterManifestContent += `${res.name}/playlist.m3u8\n`;
        }
        await fsPromises.writeFile(path.join(baseTempDir, "master.m3u8"), masterManifestContent);

        // 5. GENERATE THUMBNAILS
        logger.info({ videoId }, "Generating video thumbnails");
        await generateThumbnails(localRawPath, thumbnailDir, duration);

        // 6. UPLOAD processed files recursively to S3
        logger.info({ videoId }, "Uploading processed assets to S3");
        const uploadedFiles = await uploadDirectoryToS3(baseTempDir, `videos/${videoId}`);

        // Compute variants and CloudFront URLs
        const variants = activeResolutions.map(res => {
            const resFiles = uploadedFiles.filter(f => f.s3Key.includes(`/${res.name}/`));
            const totalSize = resFiles.reduce((acc, curr) => acc + curr.size, 0);
            return {
                resolution: res.name,
                bitrate: parseInt(res.videoBitrate) * 1000,
                url: getCloudFrontUrl(`videos/${videoId}/${res.name}/playlist.m3u8`),
                size: totalSize
            };
        });

        // Master manifest URL
        const hlsManifestUrl = getCloudFrontUrl(`videos/${videoId}/master.m3u8`);

        // Thumbnails URLs (thumb_1.jpg, thumb_2.jpg, thumb_3.jpg)
        const thumbnails = [
            getCloudFrontUrl(`videos/${videoId}/thumbnails/thumb_1.jpg`),
            getCloudFrontUrl(`videos/${videoId}/thumbnails/thumb_2.jpg`),
            getCloudFrontUrl(`videos/${videoId}/thumbnails/thumb_3.jpg`)
        ];

        // 7. UPDATE video in MongoDB with final ready data
        const updatedVideo = await Video.findByIdAndUpdate(videoId, {
            processingStatus: "ready",
            isPublished: true, // Automatically publish the video once it is processed and ready
            hlsManifestUrl,
            variants,
            thumbnails,
            videoFile: hlsManifestUrl,
            thumbnail: thumbnails[1] // Use the middle one (50% duration)
        }, { new: true }).populate("owner", "username avatar");

        logger.info({ videoId }, "Video processing completed successfully");

        // Sync with Typesense (fire and forget)
        if (updatedVideo) {
            indexVideo(updatedVideo).catch(err =>
                logger.error({ err }, "Failed to sync video to Typesense post-process")
            );
        }

        // Send real-time notification
        try {
            if (userId) {
                await sendNotification({
                    recipientId: userId,
                    senderId: null,
                    type: "video_ready",
                    referenceId: videoId,
                    referenceModel: "Video",
                    message: "Your video has been processed and is ready to stream"
                });
            }
        } catch (notificationError) {
            logger.error({ err: notificationError }, "Failed to send video ready notification");
        }

     } catch (error) {
        logger.error({ err: error, videoId }, "Error processing video");
        // Set failed status in MongoDB
        await Video.findByIdAndUpdate(videoId, {
            processingStatus: "failed",
            processingError: error.message
        });
        throw error; // Re-throw for BullMQ retry
    } finally {
        // 8. CLEANUP local temp files
        try {
            if (fs.existsSync(localRawPath)) {
                await fsPromises.unlink(localRawPath);
            }
            if (fs.existsSync(baseTempDir)) {
                await fsPromises.rm(baseTempDir, { recursive: true, force: true });
            }
            logger.info({ jobId: job.id }, "Cleaned up temp files for job");
        } catch (cleanupError) {
            logger.error({ err: cleanupError, videoId }, "Failed to clean up temp files");
        }
    }
}, {
    connection: redisConnection,
    concurrency: 2
});

// Listener for failed jobs when all retry attempts are exhausted
videoProcessor.on("failed", async (job, err) => {
    if (job && job.attemptsMade >= (job.opts?.attempts || 1)) {
        logger.error({ jobId: job.id, videoId: job.data?.videoId, attemptsMade: job.attemptsMade }, "Job failed permanently after max retries");
        try {
            await sendNotification({
                recipientId: job.data.userId,
                senderId: null,
                type: "video_failed",
                referenceId: job.data.videoId,
                referenceModel: "Video",
                message: "Your video could not be processed. Please try uploading again."
            });
        } catch (notifErr) {
            logger.error({ err: notifErr }, "Failed to send video processing failure notification");
        }
    }
});

export default videoProcessor;
