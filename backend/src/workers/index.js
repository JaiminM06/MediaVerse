import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../db/index.js";
import videoProcessor from "./videoProcessor.js"; // Loads and runs the BullMQ worker listener
import "../models/user.model.js";
import "../models/video.model.js";
import "../models/tweet.model.js";
import "../models/comment.model.js";
import "../models/like.model.js";
import { logger } from "../utils/logger.js";

import { viewSyncWorker } from "./viewSyncProcessor.js";
import { setupViewSyncJob } from "../queues/viewSyncQueue.js";
import redisConnection from "../config/redis.js";

logger.info("Initializing Worker Processes...");

connectDB()
    .then(async () => {
        await setupViewSyncJob();
        logger.info("Workers started and listening for jobs (Video Processing, View Sync).");
    })
    .catch((err) => {
        logger.error({ err }, "Failed to connect worker to database");
        process.exit(1);
    });

// --- Graceful Shutdown for Worker Process ---
const gracefulShutdownWorker = async (signal) => {
    logger.info(`Received ${signal}. Starting graceful shutdown of worker processes...`);
    try {
        logger.info("Closing BullMQ workers...");
        await Promise.all([
            videoProcessor.close(),
            viewSyncWorker.close()
        ]);
        
        logger.info("Closing database connections...");
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close(false);
        }
        redisConnection.quit();
        
        logger.info("Worker shutdown complete. Exiting gracefully.");
        process.exit(0);
    } catch (error) {
        logger.error({ err: error }, "Error during worker graceful shutdown");
        process.exit(1);
    }
};

process.on("SIGTERM", () => gracefulShutdownWorker("SIGTERM"));
process.on("SIGINT", () => gracefulShutdownWorker("SIGINT"));

// Fallback timeout to forcefully kill the process if it's stuck closing jobs
let shuttingDown = false;
process.on("SIGTERM", () => {
    if (shuttingDown) return;
    shuttingDown = true;
    setTimeout(() => {
        logger.error("Forced worker shutdown after 15 seconds timeout");
        process.exit(1);
    }, 15000).unref();
});
process.on("SIGINT", () => {
    if (shuttingDown) return;
    shuttingDown = true;
    setTimeout(() => {
        logger.error("Forced worker shutdown after 15 seconds timeout");
        process.exit(1);
    }, 15000).unref();
});
