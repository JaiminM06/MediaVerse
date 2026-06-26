import { Router } from "express";
import { 
    requestUploadUrl, 
    confirmUploadAndProcess, 
    getVideoStatus, 
    getVideoStream 
} from "../controllers/upload.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import uploadGuard from "../middlewares/uploadGuard.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { requestUploadUrlSchema } from "../validators/video.validators.js";
import { uploadLimiter } from "../middlewares/rateLimiter.middleware.js";

const router = Router();

/**
 * @openapi
 * /upload/request-url:
 *   post:
 *     summary: Request presigned S3 upload URL
 *     description: Returns a presigned S3 PUT URL for direct file upload from client, after validating file size and content type.
 *     tags:
 *       - Upload
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileName
 *               - fileSize
 *               - contentType
 *             properties:
 *               fileName:
 *                 type: string
 *               fileSize:
 *                 type: integer
 *               contentType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Presigned URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Validation failed or invalid file size/type
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.route("/request-url").post(
    uploadLimiter,
    verifyJWT,
    validate(requestUploadUrlSchema),
    uploadGuard,
    requestUploadUrl
);

/**
 * @openapi
 * /upload/confirm/{videoId}:
 *   post:
 *     summary: Confirm direct S3 upload completion
 *     description: Notifies backend that client finished S3 upload, triggering transcoding and media processing worker.
 *     tags:
 *       - Upload
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: videoId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Upload confirmed and transcoding job queued
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Video not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.route("/confirm/:videoId").post(verifyJWT, confirmUploadAndProcess);

/**
 * @openapi
 * /upload/status/{videoId}:
 *   get:
 *     summary: Get transcoding status
 *     description: Checks the current processing or transcoding status of a video uploaded via presigned URL.
 *     tags:
 *       - Upload
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: videoId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transcoding status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Video not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.route("/status/:videoId").get(verifyJWT, getVideoStatus);

/**
 * @openapi
 * /upload/stream/{videoId}:
 *   get:
 *     summary: Stream transcoded HLS segments
 *     description: Serves target HLS/Dash files or chunks for video streaming based on videoId.
 *     tags:
 *       - Upload
 *     parameters:
 *       - name: videoId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Media stream chunk returned successfully
 *       404:
 *         description: Stream not found or video not transcoded
 */
router.route("/stream/:videoId").get(getVideoStream);

export default router;
