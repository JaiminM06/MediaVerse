import { Router } from "express";
import optionalAuth from "../middlewares/optionalAuth.middleware.js";
import {
    getVideoRecommendations,
    getHomeFeed
} from "../controllers/recommendation.controller.js";

const router = Router();

router.route("/recommendations/:videoId").get(getVideoRecommendations);
router.route("/feed").get(optionalAuth, getHomeFeed);

export default router;
