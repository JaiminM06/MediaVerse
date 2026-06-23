import { Router } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    search,
    autocomplete,
    getMySearchHistory,
    clearSearchHistory,
    deleteOneSearchEntry
} from "../controllers/search.controller.js";

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
        // Silently catch and proceed anonymous
    }
    next();
};

router.route("/").get(optionalAuth, search);
router.route("/autocomplete").get(autocomplete);
router.route("/history").get(verifyJWT, getMySearchHistory);
router.route("/history").delete(verifyJWT, clearSearchHistory);
router.route("/history/entry").delete(verifyJWT, deleteOneSearchEntry);

export default router;
