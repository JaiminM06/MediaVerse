import jwt from "jsonwebtoken";
import { fetchUserThroughCache } from "./auth.middleware.js";

const optionalAuth = async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        if (token) {
            const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            const user = await fetchUserThroughCache(decodedToken?._id);
            if (user) {
                req.user = user;
            }
        }
    } catch (error) {
        // Silently catch and proceed anonymous
    }
    next();
};

export default optionalAuth;
