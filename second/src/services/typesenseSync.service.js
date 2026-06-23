import client from "../config/typesense.js";

export const indexVideo = async (video) => {
    try {
        const document = {
            id: video._id.toString(),
            mongoId: video._id.toString(),
            title: video.title,
            description: video.description || "",
            tags: video.tags || [],
            ownerUsername: video.owner?.username || "",
            ownerAvatar: video.owner?.avatar || "",
            thumbnail: video.thumbnail || "",
            duration: Number(video.duration) || 0,
            views: Number(video.views) || 0,
            isPublished: Boolean(video.isPublished),
            createdAt: Math.floor(new Date(video.createdAt).getTime() / 1000)
        };

        await client.collections("videos").documents().upsert(document);
    } catch (error) {
        console.error(`Failed to index video ${video._id} in Typesense:`, error.message);
    }
};

export const indexTweet = async (tweet) => {
    try {
        const document = {
            id: tweet._id.toString(),
            mongoId: tweet._id.toString(),
            content: tweet.content,
            hashtags: tweet.hashtags || [],
            ownerUsername: tweet.owner?.username || "",
            ownerAvatar: tweet.owner?.avatar || "",
            views: Number(tweet.views) || 0,
            createdAt: Math.floor(new Date(tweet.createdAt).getTime() / 1000)
        };

        await client.collections("tweets").documents().upsert(document);
    } catch (error) {
        console.error(`Failed to index tweet ${tweet._id} in Typesense:`, error.message);
    }
};

export const deleteVideo = async (videoId) => {
    try {
        await client.collections("videos").documents(videoId.toString()).delete();
    } catch (error) {
        console.error(`Failed to delete video ${videoId} from Typesense:`, error.message);
    }
};

export const deleteTweet = async (tweetId) => {
    try {
        await client.collections("tweets").documents(tweetId.toString()).delete();
    } catch (error) {
        console.error(`Failed to delete tweet ${tweetId} from Typesense:`, error.message);
    }
};

export const updateVideoViews = async (videoId, views) => {
    try {
        await client.collections("videos").documents(videoId.toString()).update({ views: Number(views) || 0 });
    } catch (error) {
        console.error(`Failed to update views for video ${videoId} in Typesense:`, error.message);
    }
};
