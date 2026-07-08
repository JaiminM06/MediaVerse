import { Queue } from "bullmq";
import redisConnection from "../config/redis.js";

export const viewSyncQueue = new Queue("view-sync", {
    connection: redisConnection,
    defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: 100,
    },
});

export const setupViewSyncJob = async () => {
    // Add repeatable job to flush views every 10 seconds
    await viewSyncQueue.add(
        "flush-views",
        {}, // no specific payload needed
        {
            repeat: {
                every: 10000, // 10 seconds in ms
            },
            jobId: "flush-views-job", // Prevent duplicate scheduled jobs
        }
    );
};
