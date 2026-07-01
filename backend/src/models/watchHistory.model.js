import mongoose from "mongoose";

const watchHistorySchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    video: { type: mongoose.Schema.Types.ObjectId, ref: "Video", required: true },
    watchedAt: { type: Date, default: Date.now }
});

// Indexes
watchHistorySchema.index({ user: 1, watchedAt: -1 });
watchHistorySchema.index({ video: 1 });
watchHistorySchema.index({ user: 1, video: 1 }, { unique: true });

const WatchHistory = mongoose.model("WatchHistory", watchHistorySchema);
export default WatchHistory;
