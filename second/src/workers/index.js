import "dotenv/config";
import connectDB from "../db/index.js";
import "./videoProcessor.js"; // Loads and runs the BullMQ worker listener
import "../models/user.model.js";
import "../models/video.model.js";
import "../models/tweet.model.js";
import "../models/comment.model.js";
import "../models/like.model.js";
import { logger } from "../utils/logger.js";

logger.info("Initializing Video Processing Worker Process...");

connectDB()
    .then(() => {
        logger.info("Video processing worker started and listening for jobs.");
    })
    .catch((err) => {
        logger.error({ err }, "Failed to connect worker to database");
        process.exit(1);
    });
