import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getMyNotifications,
    markAsRead,
    markAllAsRead
} from "../controllers/notification.controller.js";

const router = Router();

// Secure all notification endpoints
router.use(verifyJWT);

/**
 * @openapi
 * /notifications:
 *   get:
 *     summary: Get notifications for logged-in user
 *     description: Retrieves the notifications list for the current authenticated user.
 *     tags:
 *       - Notifications
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
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
router.route("/").get(getMyNotifications);

/**
 * @openapi
 * /notifications/read:
 *   patch:
 *     summary: Mark a notification as read
 *     description: Marks a specific notification as read by notificationId.
 *     tags:
 *       - Notifications
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - notificationId
 *             properties:
 *               notificationId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Notification marked as read successfully
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
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.route("/read").patch(markAsRead);

/**
 * @openapi
 * /notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     description: Marks all unread notifications of the logged-in user as read.
 *     tags:
 *       - Notifications
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read successfully
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
router.route("/read-all").patch(markAllAsRead);

export default router;
