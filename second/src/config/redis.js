import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

let redis;

try {
    redis = new Redis(redisUrl, {
        maxRetriesPerRequest: null, // Required by BullMQ
    });

    redis.on("error", (error) => {
        console.error("Redis Connection Error:", error.message);
    });

    redis.once("connect", () => {
        console.log("Redis connected successfully");
    });
} catch (error) {
    console.error("Failed to initialize Redis Client:", error.message);
}

export default redis;
