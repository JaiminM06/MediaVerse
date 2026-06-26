import Redis from "ioredis";
import { logger } from "../utils/logger.js";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

let redis;

try {
    redis = new Redis(redisUrl, {
        maxRetriesPerRequest: null, // Required by BullMQ
    });

    redis.on("error", (error) => {
        logger.error({ err: error }, "Redis Connection Error");
    });

    redis.once("connect", () => {
        logger.info("Redis connected successfully");
    });
} catch (error) {
    logger.error({ err: error }, "Failed to initialize Redis Client");
}

export default redis;
