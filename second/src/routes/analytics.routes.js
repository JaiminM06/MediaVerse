import { Router } from "express";
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

router.route("/watch-event").post(optionalAuth, recordWatchEvent);
router.route("/summary").get(verifyJWT, getDashboardSummary);
router.route("/views").get(verifyJWT, getViewsChart);
router.route("/subscribers").get(verifyJWT, getSubscriberChart);
router.route("/top-videos").get(verifyJWT, getTopVideosStats);
router.route("/retention/:videoId").get(verifyJWT, getVideoRetention);

export default router;
