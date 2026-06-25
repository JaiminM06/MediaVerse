import mongoose, { isValidObjectId } from "mongoose";
import VideoAnalytics from "../models/videoAnalytics.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getViewsOverTime,
  getSubscriberGrowth,
  getTopVideos,
  getTrafficSources,
  getAudienceRetention,
  getSummaryStats
} from "../services/analytics.service.js";

// recordWatchEvent
const recordWatchEvent = asyncHandler(async (req, res) => {
  const { videoId, watchDuration, totalDuration, source, deviceType } = req.body;

  // Validate videoId
  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid or missing video ID");
  }

  // Validate watchDuration
  if (watchDuration === undefined || typeof watchDuration !== "number" || watchDuration < 0) {
    throw new ApiError(400, "watchDuration is required and must be a number greater than or equal to 0");
  }

  // Validate totalDuration
  if (totalDuration === undefined || typeof totalDuration !== "number" || totalDuration <= 0) {
    throw new ApiError(400, "totalDuration is required and must be a number greater than 0");
  }

  // Validate source
  const validSources = ['direct', 'search', 'recommended', 'external'];
  const finalSource = validSources.includes(source) ? source : 'direct';

  // Validate deviceType
  const validDeviceTypes = ['mobile', 'desktop', 'tablet'];
  const finalDeviceType = validDeviceTypes.includes(deviceType) ? deviceType : 'desktop';

  // Compute completionRate
  const completionRate = Math.min(watchDuration / totalDuration, 1.0);

  // Create VideoAnalytics document
  await VideoAnalytics.create({
    video: videoId,
    viewer: req.user?._id || null,
    watchDuration,
    totalDuration,
    completionRate,
    source: finalSource,
    deviceType: finalDeviceType
  });

  return res
    .status(201)
    .json(new ApiResponse(201, { message: 'Watch event recorded' }, "Watch event recorded successfully"));
});

// getDashboardSummary
const getDashboardSummary = asyncHandler(async (req, res) => {
  const myVideos = await Video.find({ owner: req.user._id }).select('_id');
  const videoIds = myVideos.map(v => v._id);

  const summary = await getSummaryStats(videoIds, req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, { summary }, "Dashboard summary fetched successfully"));
});

// getViewsChart
const getViewsChart = asyncHandler(async (req, res) => {
  const { period = 'month' } = req.query;
  const myVideos = await Video.find({ owner: req.user._id }).select('_id');
  const videoIds = myVideos.map(v => v._id);

  const data = await getViewsOverTime(videoIds, period);

  return res
    .status(200)
    .json(new ApiResponse(200, { data, period }, "Views chart data fetched successfully"));
});

// getSubscriberChart
const getSubscriberChart = asyncHandler(async (req, res) => {
  const { period = 'month' } = req.query;
  const data = await getSubscriberGrowth(req.user._id, period);

  return res
    .status(200)
    .json(new ApiResponse(200, { data, period }, "Subscriber growth chart data fetched successfully"));
});

// getTopVideosStats
const getTopVideosStats = asyncHandler(async (req, res) => {
  let { limit = 10 } = req.query;
  limit = parseInt(limit, 10);
  if (isNaN(limit) || limit <= 0) limit = 10;
  if (limit > 20) limit = 20;

  const myVideos = await Video.find({ owner: req.user._id }).select('_id');
  const videoIds = myVideos.map(v => v._id);

  const videos = await getTopVideos(videoIds, limit);

  return res
    .status(200)
    .json(new ApiResponse(200, { videos }, "Top videos stats fetched successfully"));
});

// getVideoRetention
const getVideoRetention = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid or missing video ID");
  }

  const video = await Video.findOne({ _id: videoId, owner: req.user._id });
  if (!video) {
    throw new ApiError(404, "Video not found or not yours");
  }

  const [retention, trafficSources] = await Promise.all([
    getAudienceRetention(new mongoose.Types.ObjectId(videoId)),
    getTrafficSources([new mongoose.Types.ObjectId(videoId)])
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, { retention, trafficSources }, "Video retention and traffic sources fetched successfully"));
});

export {
  recordWatchEvent,
  getDashboardSummary,
  getViewsChart,
  getSubscriberChart,
  getTopVideosStats,
  getVideoRetention
};
