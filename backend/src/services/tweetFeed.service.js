import mongoose from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { Tweet } from "../models/tweet.model.js";
import { Like } from "../models/like.model.js";

export const getGlobalTweetFeed = async (page, limit, userId = null) => {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skipNum = (pageNum - 1) * limitNum;
    const pipeline = [
        {
            $match: {
                isRetweet: false,
                parentTweet: { $eq: null }
            }
        },
        // Lookup like count for engagement scoring
        {
            $lookup: {
                from: 'likes',
                let: { tweetId: '$_id' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$tweet', '$$tweetId'] } } },
                    { $count: 'total' }
                ],
                as: 'likesStats'
            }
        },
        {
            $addFields: {
                likeCount: { $ifNull: [{ $arrayElemAt: ['$likesStats.total', 0] }, 0] },
                engagementScore: {
                    $add: [
                        { $multiply: [{ $ifNull: ['$views', 0] }, 0.1] },
                        { $multiply: [{ $ifNull: [{ $arrayElemAt: ['$likesStats.total', 0] }, 0] }, 5] },
                        { $multiply: [{ $ifNull: ['$retweetCount', 0] }, 3] },
                        { $multiply: [{ $ifNull: ['$replyCount', 0] }, 2] }
                    ]
                }
            }
        },
        { $unset: 'likesStats' },
        { $sort: { engagementScore: -1, createdAt: -1 } },
        { $skip: skipNum },
        { $limit: limitNum },
    ];

    // If logged in, check if the current user liked each tweet
    if (userId) {
        pipeline.push({
            $lookup: {
                from: 'likes',
                let: { tweetId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$tweet', '$$tweetId'] },
                                    { $eq: ['$likedBy', new mongoose.Types.ObjectId(userId)] }
                                ]
                            }
                        }
                    },
                    { $limit: 1 }
                ],
                as: 'userLike'
            }
        });
        pipeline.push({
            $addFields: {
                likedByCurrentUser: { $gt: [{ $size: '$userLike' }, 0] }
            }
        });
        pipeline.push({ $unset: 'userLike' });
    } else {
        pipeline.push({
            $addFields: { likedByCurrentUser: false }
        });
    }

    // Populate owner
    pipeline.push(
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {
            $unwind: "$owner"
        },
        // Populate quoteTweet
        {
            $lookup: {
                from: "tweets",
                localField: "quoteTweet",
                foreignField: "_id",
                as: "quoteTweet"
            }
        },
        // Populate originalTweet
        {
            $lookup: {
                from: "tweets",
                localField: "originalTweet",
                foreignField: "_id",
                as: "originalTweet"
            }
        },
        {
            $addFields: {
                quoteTweet: { $cond: [{ $gt: [{ $size: "$quoteTweet" }, 0] }, { $arrayElemAt: ["$quoteTweet", 0] }, null] },
                originalTweet: { $cond: [{ $gt: [{ $size: "$originalTweet" }, 0] }, { $arrayElemAt: ["$originalTweet", 0] }, null] }
            }
        },
        // Populate originalTweet.owner
        {
            $lookup: {
                from: "users",
                localField: "originalTweet.owner",
                foreignField: "_id",
                as: "originalTweetOwner"
            }
        },
        {
            $addFields: {
                "originalTweet.owner": {
                    $cond: [
                        { $and: [{ $ne: ["$originalTweet", null] }, { $gt: [{ $size: "$originalTweetOwner" }, 0] }] },
                        { $arrayElemAt: ["$originalTweetOwner", 0] },
                        null
                    ]
                }
            }
        },
        {
            $project: {
                originalTweetOwner: 0,
                "owner.password": 0,
                "owner.refreshToken": 0,
                "owner.email": 0,
                "owner.watchHistory": 0,
                "originalTweet.owner.password": 0,
                "originalTweet.owner.refreshToken": 0,
                "originalTweet.owner.email": 0,
                "originalTweet.owner.watchHistory": 0
            }
        }
    );

    const tweets = await Tweet.aggregate(pipeline);

    return {
        tweets,
        page: pageNum,
        limit: limitNum,
        isPersonalized: false
    };
};
export const getPersonalizedTweetFeed = async (userId, page, limit) => {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;

    // 1. Fetch channel IDs the user follows
    let query = Subscription.find({ subscriber: userId }).select('channel');
    if (query && typeof query.lean === "function") {
        query = query.lean();
    }
    const following = await query;
    const followingIds = following.map(s => s.channel);

    if (followingIds.length === 0) {
        return getGlobalTweetFeed(pageNum, limitNum, userId);
    }

    // Include the user's own ID in the feed pool
    const authorPool = [...followingIds, userId];

    // 2. Efficient aggregation utilizing compound index { owner: 1, isRetweet: 1, parentTweet: 1, createdAt: -1 }
    const pipeline = [
        {
            $match: {
                owner: { $in: authorPool },
                isRetweet: false,
                parentTweet: null
            }
        },
        // Limit candidates inside MongoDB BEFORE sorting or populating to save RAM/CPU
        { $sort: { createdAt: -1 } },
        { $skip: (pageNum - 1) * limitNum },
        { $limit: limitNum },
        // Lookup like stats
        {
            $lookup: {
                from: 'likes',
                let: { tweetId: '$_id' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$tweet', '$$tweetId'] } } },
                    { $count: 'total' }
                ],
                as: 'likesStats'
            }
        },
        // Check if current user liked the tweet
        {
            $lookup: {
                from: 'likes',
                let: { tweetId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$tweet', '$$tweetId'] },
                                    { $eq: ['$likedBy', new mongoose.Types.ObjectId(userId)] }
                                ]
                            }
                        }
                    },
                    { $limit: 1 }
                ],
                as: 'userLike'
            }
        },
        {
            $addFields: {
                likeCount: { $ifNull: [{ $arrayElemAt: ['$likesStats.total', 0] }, 0] },
                likedByCurrentUser: { $gt: [{ $size: '$userLike' }, 0] }
            }
        },
        // Compute engagement score directly inside MongoDB
        {
            $addFields: {
                engagementScore: {
                    $add: [
                        { $multiply: [{ $ifNull: ['$views', 0] }, 0.1] },
                        { $multiply: ['$likeCount', 5] },
                        { $multiply: [{ $ifNull: ['$retweetCount', 0] }, 3] },
                        { $multiply: [{ $ifNull: ['$replyCount', 0] }, 2] }
                    ]
                }
            }
        },
        { $unset: ['likesStats', 'userLike'] },
        // Lookup owner details
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        { $unwind: "$owner" },
        {
            $project: {
                _id: 1,
                content: 1,
                createdAt: 1,
                views: 1,
                retweetCount: 1,
                replyCount: 1,
                likeCount: 1,
                likedByCurrentUser: 1,
                engagementScore: 1,
                owner: { username: 1, avatar: 1, fullName: 1 }
            }
        }
    ];

    const tweets = await Tweet.aggregate(pipeline);

    return {
        tweets,
        page: pageNum,
        limit: limitNum,
        isPersonalized: true
    };
};
