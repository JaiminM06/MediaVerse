import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  recordWatchEvent,
  getDashboardSummary,
  getViewsChart,
  getSubscriberChart,
  getTopVideosStats,
  getVideoRetention
} from "../controllers/analytics.controller.js";
import optionalAuth from "../middlewares/optionalAuth.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

const watchEventLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later." },
});

/**
 * @openapi
 * /analytics/watch-event:
 *   post:
 *     summary: Record a video watch event
 *     description: Records a periodic ping containing watch duration details to update user metrics and view charts.
 *     tags:
 *       - Analytics
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - videoId
 *               - watchDuration
 *               - totalDuration
 *             properties:
 *               videoId:
 *                 type: string
 *               watchDuration:
 *                 type: number
 *               totalDuration:
 *                 type: number
 *               deviceType:
 *                 type: string
 *               source:
 *                 type: string
 *     responses:
 *       200:
 *         description: Watch event recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Validation failed or missing parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.route("/watch-event").post(watchEventLimiter, optionalAuth, recordWatchEvent);

/**
 * @openapi
 * /analytics/summary:
 *   get:
 *     summary: Get dashboard summary metrics
 *     description: Retrieves high-level channel analytics summary metrics such as total views, subscribers, video uploads, and watch time.
 *     tags:
 *       - Analytics
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.route("/summary").get(verifyJWT, getDashboardSummary);

/**
 * @openapi
 * /analytics/views:
 *   get:
 *     summary: Get view analytics chart data
 *     description: Returns aggregated view counts grouped by date or window for rendering views analytics charts.
 *     tags:
 *       - Analytics
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: range
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           default: 7d
 *     responses:
 *       200:
 *         description: Views chart data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.route("/views").get(verifyJWT, getViewsChart);

/**
 * @openapi
 * /analytics/subscribers:
 *   get:
 *     summary: Get subscriber analytics chart data
 *     description: Returns subscriber growth metrics grouped by timeline for subscriber growth graphs.
 *     tags:
 *       - Analytics
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: range
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           default: 7d
 *     responses:
 *       200:
 *         description: Subscriber growth chart data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.route("/subscribers").get(verifyJWT, getSubscriberChart);

/**
 * @openapi
 * /analytics/top-videos:
 *   get:
 *     summary: Get top performing videos stats
 *     description: Retrieves list of top performing videos ranked by view count or total watch time.
 *     tags:
 *       - Analytics
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Top videos stats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.route("/top-videos").get(verifyJWT, getTopVideosStats);

/**
 * @openapi
 * /analytics/retention/{videoId}:
 *   get:
 *     summary: Get audience retention stats for a video
 *     description: Calculates percentage retention curve data across the length of a specific video.
 *     tags:
 *       - Analytics
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
 *         description: Audience retention stats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Video not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.route("/retention/:videoId").get(verifyJWT, getVideoRetention);

export default router;
