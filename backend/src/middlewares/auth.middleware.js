import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

/**
 * Generic In-Memory L1 Cache Implementation
 * Features:
 * - Thread-safe O(1) lookups
 * - Automatic individual entry expiration
 * - Periodic background garbage collection to prevent memory leaks
 * - unref()'d cleanup timer to allow clean Node.js process shutdown
 */
class MemoryCache {
    constructor(ttlMs = 60000, cleanupIntervalMs = 300000) {
        this.cache = new Map();
        this.ttl = ttlMs;

        // Run background garbage collection periodically
        this.cleanupTimer = setInterval(() => this.cleanupExpired(), cleanupIntervalMs);
        if (this.cleanupTimer && typeof this.cleanupTimer.unref === "function") {
            this.cleanupTimer.unref();
        }
    }

    get(key) {
        const entry = this.cache.get(key);
        if (!entry) return null;

        // Lazy expiration check
        if (Date.now() > entry.expiry) {
            this.cache.delete(key);
            return null;
        }
        return entry.value;
    }

    set(key, value) {
        this.cache.set(key, {
            value,
            expiry: Date.now() + this.ttl
        });
    }

    delete(key) {
        this.cache.delete(key);
    }

    cleanupExpired() {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiry) {
                this.cache.delete(key);
            }
        }
    }

    destroy() {
        clearInterval(this.cleanupTimer);
    }
}

// Instantiate L1 Memory Cache for User profile metadata (1 minute TTL)
export const userL1Cache = new MemoryCache(60000);

/**
 * Invalidation Helper: Cleans up user record from the authentication cache layers.
 * Call this function whenever a user's details, password, roles, or tokens change.
 */
export const invalidateUserCache = (userId) => {
    if (!userId) return;
    const userIdStr = userId.toString();
    userL1Cache.delete(userIdStr);

    // FUTURE WORK (L2 Cache Integration):
    // if (redisClient) {
    //     await redisClient.del(`cache:user:${userIdStr}`);
    // }
};

/**
 * Data Retrieval Service (L1 Cache -> Future L2 Cache -> MongoDB)
 * Always queries MongoDB using `.lean()` on cache misses for minimal memory allocation.
 */
export const fetchUserThroughCache = async (userId) => {
    const userIdStr = userId.toString();

    // 1. Try L1 Memory Cache
    const cachedUser = userL1Cache.get(userIdStr);
    if (cachedUser) {
        return cachedUser;
    }

    // 2. FUTURE L2 Cache (Redis) Hook:
    // const cachedL2User = await fetchFromRedis(userIdStr);
    // if (cachedL2User) {
    //     userL1Cache.set(userIdStr, cachedL2User);
    //     return cachedL2User;
    // }

    // 3. Cache Miss: Fall back to MongoDB with .lean() optimization
    let query = User.findById(userIdStr).select("-password -refreshToken");
    if (query && typeof query.lean === "function") {
        query = query.lean();
    }
    const user = await query;

    if (user) {
        // Hydrate L1 cache (and future L2 cache)
        userL1Cache.set(userIdStr, user);
        // await saveToRedis(userIdStr, user);
    }

    return user;
};

/**
 * Production-Ready JWT Verification Middleware
 * Guarantees cryptographic authenticity verification on every request
 * but uses a multi-tier cache to avoid redundant database round-trips.
 */
export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }

        // 1. Cryptographic check: ALWAYS verify the JWT signature & expiration first.
        // This prevents authentication bypasses and honors token expiry times.
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // 2. Fetch the user object from the caching hierarchy (L1 -> L2 -> DB)
        const user = await fetchUserThroughCache(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid Access Token");
        }

        // Attach the plain JavaScript user object to the request
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token");
    }
});