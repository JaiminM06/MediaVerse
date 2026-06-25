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

router.route("/watch-event").post(watchEventLimiter, optionalAuth, recordWatchEvent);
router.route("/summary").get(verifyJWT, getDashboardSummary);
router.route("/views").get(verifyJWT, getViewsChart);
router.route("/subscribers").get(verifyJWT, getSubscriberChart);
router.route("/top-videos").get(verifyJWT, getTopVideosStats);
router.route("/retention/:videoId").get(verifyJWT, getVideoRetention);

export default router;
