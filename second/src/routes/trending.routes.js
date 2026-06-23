import { Router } from "express";
import {
    getTrendingVideos,
    getTrendingHashtags
} from "../controllers/trending.controller.js";

const router = Router();

router.route("/trending/videos").get(getTrendingVideos);
router.route("/trending/hashtags").get(getTrendingHashtags);

export default router;
