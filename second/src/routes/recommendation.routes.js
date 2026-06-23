import { Router } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import {
    getVideoRecommendations,
    getHomeFeed
} from "../controllers/recommendation.controller.js";

const router = Router();

// Inline optionalAuth middleware
const optionalAuth = async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        if (token) {
            const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
            if (user) {
                req.user = user;
            }
        }
    } catch (error) {
        // Silently proceed anonymously
    }
    next();
};

router.route("/recommendations/:videoId").get(getVideoRecommendations);
router.route("/feed").get(optionalAuth, getHomeFeed);

export default router;
