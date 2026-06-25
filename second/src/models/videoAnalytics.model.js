import mongoose, { Schema } from "mongoose";

const videoAnalyticsSchema = new Schema(
  {
    video: {
      type: Schema.Types.ObjectId,
      ref: 'Video',
      required: true
    },
    viewer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    watchDuration: {
      type: Number,
      default: 0
    },
    totalDuration: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0
    },
    source: {
      type: String,
      enum: ['direct', 'search', 'recommended', 'external'],
      default: 'direct'
    },
    deviceType: {
      type: String,
      enum: ['mobile', 'desktop', 'tablet'],
      default: 'desktop'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }
);

videoAnalyticsSchema.index({ video: 1, timestamp: -1 });
videoAnalyticsSchema.index({ viewer: 1, timestamp: -1 });
videoAnalyticsSchema.index({ video: 1, source: 1 });
videoAnalyticsSchema.index({ timestamp: -1 });

const VideoAnalytics = mongoose.model("VideoAnalytics", videoAnalyticsSchema);
export default VideoAnalytics;
