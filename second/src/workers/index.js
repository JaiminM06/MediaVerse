import "dotenv/config";
import connectDB from "../db/index.js";
import "./videoProcessor.js"; // Loads and runs the BullMQ worker listener
import "../models/user.model.js";
import "../models/video.model.js";
import "../models/tweet.model.js";
import "../models/comment.model.js";
import "../models/like.model.js";

console.log("Initializing Video Processing Worker Process...");

connectDB()
    .then(() => {
        console.log("Video processing worker started and listening for jobs.");
    })
    .catch((err) => {
        console.error("Failed to connect worker to database:", err.message);
        process.exit(1);
    });
