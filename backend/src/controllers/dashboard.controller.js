import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const userId = req.user._id;

    const totalSubscribers = await Subscription.countDocuments({ channel: userId });
    
    const videoStats = await Video.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(userId) } },
        { 
            $group: {
                _id: null,
                totalViews: { $sum: "$views" },
                totalVideos: { $sum: 1 }
            }
        }
    ]);

    const totalViews = videoStats.length > 0 ? videoStats[0].totalViews : 0;
    const totalVideos = videoStats.length > 0 ? videoStats[0].totalVideos : 0;

    // Get total likes on all videos of this user
    const videoIds = await Video.find({ owner: userId }).distinct('_id');
    const totalLikes = await Like.countDocuments({ video: { $in: videoIds } });

    return res.status(200).json(
        new ApiResponse(200, {
            totalSubscribers,
            totalViews,
            totalVideos,
            totalLikes
        }, "Channel stats fetched successfully")
    );
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // Get all the videos uploaded by the channel
    const userId = req.user._id;
    const videos = await Video.find({ owner: userId }).sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, videos, "Channel videos fetched successfully")
    );
})

export {
    getChannelStats, 
    getChannelVideos
}
