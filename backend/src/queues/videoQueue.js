import { Queue } from "bullmq";
import redisConnection from "../config/redis.js";

const videoQueue = new Queue("video-processing", {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 5000,
        },
        removeOnComplete: 100,
        removeOnFail: 200,
    },
});

export const addVideoProcessingJob = async (payload) => {
    return await videoQueue.add("process-video", payload);
};

export { videoQueue };
