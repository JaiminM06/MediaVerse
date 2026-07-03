import { jest, describe, it, expect, beforeEach, beforeAll } from '@jest/globals';
import { setupTestMocks, createMockRes, createMockQueryChain } from './setup.js';

let tweetController, commentController, likeController, playlistContorller;
let subscriptionController, dashboardController, recommendationController;
let notificationController, analyticsController;

const VID = '507f1f77bcf86cd799439011';

beforeAll(async () => {
  await setupTestMocks();
  tweetController        = await import('../controllers/tweet.controller.js');
  commentController      = await import('../controllers/comment.controller.js');
  likeController         = await import('../controllers/like.controller.js');
  playlistContorller     = await import('../controllers/playlist.contorller.js');
  subscriptionController = await import('../controllers/subscription.controller.js');
  dashboardController    = await import('../controllers/dashboard.controller.js');
  recommendationController = await import('../controllers/recommendation.controller.js');
  notificationController = await import('../controllers/notification.controller.js');
  analyticsController    = await import('../controllers/analytics.controller.js');
});

function makeReq(overrides = {}) {
  return { params: {}, query: {}, body: {}, ip: '127.0.0.1', headers: {}, socket: { remoteAddress: '127.0.0.1' }, ...overrides };
}

function ch(value) {
  return { populate: jest.fn().mockReturnThis(), sort: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), skip: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis(), lean: jest.fn().mockReturnThis(), distinct: jest.fn().mockResolvedValue(value), then: (cb) => Promise.resolve(value).then(cb), exec: jest.fn().mockResolvedValue(value) };
}

// ── Tweet Controller ────────────────────────────────────────────────

describe('Tweet Controller', () => {
  let Tweet, Like;
  beforeEach(async () => {
    ({ Tweet } = await import('../models/tweet.model.js'));
    ({ Like } = await import('../models/like.model.js'));
    // Reset methods modified across nested describes (singleton contamination).
    // mockReturnValue(null) restores factory default rather than mockReset which
    // leaves the mock returning undefined, breaking implicit chainable usage.
    Tweet.findById.mockReturnValue(null);
    Tweet.create.mockReturnValue(Promise.resolve({}));
    Tweet.findByIdAndDelete.mockReturnValue(null);
    Tweet.deleteMany.mockReturnValue({ deletedCount: 0 });
    Like.deleteMany.mockReturnValue({ deletedCount: 0 });
  });

  describe('createTweet', () => {
    it('returns 200 with created tweet', async () => {
      const saved = { _id: VID, content: 'hello', owner: { _id: 'u1', username: 'a', avatar: 'av', fullName: 'A' }, mentions: [], media: [], hashtags: [], isRetweet: false };
      Tweet.create.mockResolvedValue(saved);
      Tweet.findById.mockReturnValue(createMockQueryChain(saved));
      const { res, next } = createMockRes();
      await tweetController.createTweet(makeReq({ user: { _id: 'u1', username: 'a' }, body: { content: 'hello' } }), res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('forwards DB failures to next()', async () => {
      Tweet.create.mockRejectedValue(new Error('DB down'));
      const { res, next } = createMockRes();
      await tweetController.createTweet(makeReq({ user: { _id: 'u1' }, body: { content: 'hello' } }), res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getUserTweets', () => {
    it('returns 200 with paginated tweets', async () => {
      Tweet.countDocuments.mockResolvedValue(0);
      Like.aggregate.mockResolvedValue([]);
      Like.find.mockReturnValue({ select: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue([]) });
      const { res, next } = createMockRes();
      await tweetController.getUserTweets(makeReq({ params: { userId: VID }, query: { page: '1', limit: '10' } }), res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('updateTweet', () => {
    it('returns 200 on success', async () => {
      Tweet.findById.mockResolvedValue({ _id: VID, content: 'old', owner: { toString: () => 'u1' }, isRetweet: false, save: jest.fn().mockResolvedValue(true), populate: jest.fn().mockResolvedValue({ _id: VID, content: 'new content', owner: { _id: 'u1', username: 'a' } }) });
      const { res, next } = createMockRes();
      await tweetController.updateTweet(makeReq({ user: { _id: 'u1' }, params: { tweetId: VID }, body: { content: 'new content' } }), res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 403 when not owner', async () => {
      Tweet.findById.mockResolvedValue({ _id: VID, owner: { toString: () => 'u2' }, isRetweet: false, save: jest.fn().mockResolvedValue(true) });
      const { res, next } = createMockRes();
      await tweetController.updateTweet(makeReq({ user: { _id: 'u1' }, params: { tweetId: VID }, body: { content: 'new' } }), res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('returns 404 when not found', async () => {
      Tweet.findById.mockResolvedValue(null);
      const { res, next } = createMockRes();
      await tweetController.updateTweet(makeReq({ user: { _id: 'u1' }, params: { tweetId: VID }, body: { content: 'new' } }), res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('deleteTweet', () => {
    it('returns 200 on success', async () => {
      Tweet.findById.mockResolvedValue({ _id: VID, owner: { toString: () => 'u1' }, parentTweet: null, isRetweet: false, originalTweet: null, media: [] });
      Tweet.findByIdAndDelete.mockResolvedValue({ _id: VID });
      Tweet.deleteMany.mockResolvedValue({ deletedCount: 0 });
      Like.deleteMany.mockResolvedValue({ deletedCount: 0 });
      const { res, next } = createMockRes();
      await tweetController.deleteTweet(makeReq({ user: { _id: 'u1' }, params: { tweetId: VID } }), res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 403 when not owner', async () => {
      Tweet.findById.mockResolvedValue({ _id: VID, owner: { toString: () => 'u2' } });
      const { res, next } = createMockRes();
      await tweetController.deleteTweet(makeReq({ user: { _id: 'u1' }, params: { tweetId: VID } }), res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});

// ── Comment Controller ──────────────────────────────────────────────

describe('Comment Controller', () => {
  let Comment;
  beforeEach(async () => {
    ({ Comment } = await import('../models/comment.model.js'));
  });

  describe('getVideoComments', () => {
    it('returns 200 with paginated comments', async () => {
      const { res, next } = createMockRes();
      await commentController.getVideoComments(makeReq({ params: { videoId: VID }, query: { page: '1', limit: '10' } }), res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('addComment', () => {
    it('returns 200 with created comment', async () => {
      Comment.create.mockResolvedValue({ _id: VID, content: 'c', owner: 'u1', video: VID });
      Comment.findById.mockReturnValue(createMockQueryChain({ _id: VID, content: 'c', owner: { _id: 'u1', username: 'a', avatar: 'av' }, video: VID }));
      const { res, next } = createMockRes();
      await commentController.addComment(makeReq({ user: { _id: 'u1' }, params: { videoId: VID }, body: { content: 'c' } }), res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('updateComment', () => {
    it('returns 200 on success', async () => {
      Comment.findById.mockResolvedValue({ _id: VID, owner: 'u1', save: jest.fn().mockResolvedValue({ _id: VID, content: 'updated' }) });
      const { res, next } = createMockRes();
      await commentController.updateComment(makeReq({ user: { _id: 'u1' }, params: { commentId: VID }, body: { content: 'updated' } }), res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 403 when not owner', async () => {
      Comment.findById.mockResolvedValue({ _id: VID, owner: 'u2' });
      const { res, next } = createMockRes();
      await commentController.updateComment(makeReq({ user: { _id: 'u1' }, params: { commentId: VID }, body: { content: 'x' } }), res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('deleteComment', () => {
    it('returns 200 on success', async () => {
      Comment.findById.mockResolvedValue({ _id: VID, owner: 'u1' });
      Comment.findByIdAndDelete.mockResolvedValue({ _id: VID });
      const { res, next } = createMockRes();
      await commentController.deleteComment(makeReq({ user: { _id: 'u1' }, params: { commentId: VID } }), res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 403 when not owner', async () => {
      Comment.findById.mockResolvedValue({ _id: VID, owner: 'u2' });
      const { res, next } = createMockRes();
      await commentController.deleteComment(makeReq({ user: { _id: 'u1' }, params: { commentId: VID } }), res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});

// ── Like Controller ──────────────────────────────────────────────────

describe('Like Controller', () => {
  let Like;
  beforeEach(async () => {
    ({ Like } = await import('../models/like.model.js'));
  });

  describe('toggleVideoLike', () => {
    it('returns 200 when liking', async () => {
      Like.findOne.mockResolvedValue(null);
      Like.create.mockResolvedValue({ _id: 'l1', likedBy: 'u1', video: 'v1' });
      const { res, next } = createMockRes();
      await likeController.toggleVideoLike(makeReq({ user: { _id: 'u1', username: 'a' }, params: { videoId: VID } }), res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 200 when unliking', async () => {
      Like.findOne.mockResolvedValue({ _id: 'l1' });
      Like.findByIdAndDelete.mockResolvedValue({ _id: 'l1' });
      const { res, next } = createMockRes();
      await likeController.toggleVideoLike(makeReq({ user: { _id: 'u1' }, params: { videoId: VID } }), res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('toggleCommentLike', () => {
    it('returns 200 when liking', async () => {
      Like.findOne.mockResolvedValue(null);
      Like.create.mockResolvedValue({ _id: 'l1' });
      const { res, next } = createMockRes();
      await likeController.toggleCommentLike(makeReq({ user: { _id: 'u1' }, params: { commentId: VID } }), res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('toggleTweetLike', () => {
    it('returns 200 when unliking', async () => {
      Like.findOne.mockResolvedValue({ _id: 'l1' });
      Like.findByIdAndDelete.mockResolvedValue({ _id: 'l1' });
      const { res, next } = createMockRes();
      await likeController.toggleTweetLike(makeReq({ user: { _id: 'u1' }, params: { tweetId: VID } }), res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getLikedVideos', () => {
    it('returns 200 with liked videos', async () => {
      const liked = [{ _id: 'l1', video: { _id: 'v1', owner: { username: 'a', avatar: 'av', fullName: 'A' } } }];
      Like.find.mockReturnValue({ sort: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis(), populate: jest.fn().mockReturnThis(), then: (cb) => Promise.resolve(liked).then(cb) });
      const { res, next } = createMockRes();
      await likeController.getLikedVideos(makeReq({ user: { _id: 'u1' } }), res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});

// ── Playlist Controller ──────────────────────────────────────────────

describe('Playlist Controller', () => {
  let Playlist, User;
  beforeEach(async () => {
    ({ Playlist } = await import('../models/playlist.model.js'));
    ({ User } = await import('../models/user.model.js'));
  });

  describe('createPlaylist', () => {
    it('returns 200 with created playlist', async () => {
      Playlist.create.mockResolvedValue({ _id: 'p1', name: 'my playlist', description: 'desc' });
      const { res, next } = createMockRes();
      await playlistContorller.createPlaylist(makeReq({ user: { _id: 'u1' }, body: { name: 'my playlist', description: 'desc' } }), res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 401 when fields missing', async () => {
      const { res, next } = createMockRes();
      await playlistContorller.createPlaylist(makeReq({ user: { _id: 'u1' }, body: { name: 'only name' } }), res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getUserPlaylists', () => {
    it('returns 200 with playlists', async () => {
      User.findById.mockResolvedValue({ _id: VID });
      const { res, next } = createMockRes();
      await playlistContorller.getUserPlaylists(makeReq({ params: { userId: VID } }), res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getPlaylistById', () => {
    it('returns 200 with playlist', async () => {
      Playlist.findById.mockResolvedValue({ _id: 'p1', name: 'test' });
      const { res, next } = createMockRes();
      await playlistContorller.getPlaylistById(makeReq({ params: { playlistId: VID } }), res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 404 when not found', async () => {
      Playlist.findById.mockResolvedValue(null);
      const { res, next } = createMockRes();
      await playlistContorller.getPlaylistById(makeReq({ params: { playlistId: VID } }), res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('addVideoToPlaylist', () => {
    it('returns 200 on success', async () => {
      Playlist.findById.mockResolvedValue({ _id: 'p1', owner: 'u1' });
      Playlist.findByIdAndUpdate.mockResolvedValue({ _id: 'p1', videos: ['v1'] });
      const { res, next } = createMockRes();
      await playlistContorller.addVideoToPlaylist(makeReq({ user: { _id: 'u1' }, params: { playlistId: VID, videoId: 'v1' } }), res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 403 when not owner', async () => {
      Playlist.findById.mockResolvedValue({ _id: 'p1', owner: 'u2' });
      const { res, next } = createMockRes();
      await playlistContorller.addVideoToPlaylist(makeReq({ user: { _id: 'u1' }, params: { playlistId: VID, videoId: 'v1' } }), res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('removeVideoFromPlaylist', () => {
    it('returns 200 on success', async () => {
      Playlist.findById.mockResolvedValue({ _id: 'p1', owner: 'u1' });
      Playlist.findByIdAndUpdate.mockResolvedValue({ _id: 'p1', name: 'test', videos: [] });
      const { res, next } = createMockRes();
      await playlistContorller.removeVideoFromPlaylist(makeReq({ user: { _id: 'u1' }, params: { playlistId: VID, videoId: 'v1' } }), res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('deletePlaylist', () => {
    it('returns 200 on success', async () => {
      Playlist.findById.mockResolvedValue({ _id: 'p1', owner: 'u1' });
      Playlist.findByIdAndDelete.mockResolvedValue({ _id: 'p1', name: 'test' });
      const { res, next } = createMockRes();
      await playlistContorller.deletePlaylist(makeReq({ user: { _id: 'u1' }, params: { playlistId: VID } }), res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('updatePlaylist', () => {
    it('returns 200 on success', async () => {
      Playlist.findById.mockResolvedValue({ _id: 'p1', owner: 'u1' });
      Playlist.findByIdAndUpdate.mockResolvedValue({ _id: 'p1', name: 'new', description: 'newd' });
      const { res, next } = createMockRes();
      await playlistContorller.updatePlaylist(makeReq({ user: { _id: 'u1' }, params: { playlistId: VID }, body: { name: 'new', description: 'newd' } }), res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});

// ── Subscription Controller ──────────────────────────────────────────

describe('Subscription Controller', () => {
  let Subscription;
  beforeEach(async () => {
    ({ Subscription } = await import('../models/subscription.model.js'));
  });

  describe('toggleSubscription', () => {
    it('returns 200 when subscribing', async () => {
      Subscription.findOne.mockResolvedValue(null);
      Subscription.create.mockResolvedValue({ _id: 's1', subscriber: 'u1', channel: 'c1' });
      const { res, next } = createMockRes();
      await subscriptionController.toggleSubscription(makeReq({ user: { _id: 'u1', username: 'a' }, params: { channelId: VID } }), res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 200 when unsubscribing', async () => {
      Subscription.findOne.mockResolvedValue({ _id: 's1' });
      Subscription.findByIdAndDelete.mockResolvedValue({ _id: 's1' });
      const { res, next } = createMockRes();
      await subscriptionController.toggleSubscription(makeReq({ user: { _id: 'u1' }, params: { channelId: VID } }), res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getUserChannelSubscribers', () => {
    it('returns 200 with paginated subscribers', async () => {
      const { res, next } = createMockRes();
      await subscriptionController.getUserChannelSubscribers(makeReq({ params: { channelId: VID }, query: { page: '1', limit: '10' } }), res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getSubscribedChannels', () => {
    it('returns 200 with paginated channels', async () => {
      const { res, next } = createMockRes();
      await subscriptionController.getSubscribedChannels(makeReq({ params: { subscriberId: VID }, query: { page: '1', limit: '10' } }), res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});

// ── Dashboard Controller ─────────────────────────────────────────────

describe('Dashboard Controller', () => {
  let Video, Subscription, Like;
  beforeEach(async () => {
    ({ Video } = await import('../models/video.model.js'));
    ({ Subscription } = await import('../models/subscription.model.js'));
    ({ Like } = await import('../models/like.model.js'));
  });

  describe('getChannelStats', () => {
    it('returns 200 with channel statistics', async () => {
      Subscription.countDocuments.mockResolvedValue(10);
      Video.aggregate.mockResolvedValue([]);
      Video.find.mockReturnValue(ch([]));
      Like.countDocuments.mockResolvedValue(5);
      const { res, next } = createMockRes();
      await dashboardController.getChannelStats(makeReq({ user: { _id: VID } }), res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getChannelVideos', () => {
    it('returns 200 with videos', async () => {
      const { res, next } = createMockRes();
      await dashboardController.getChannelVideos(makeReq({ user: { _id: VID } }), res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});

// ── Recommendation Controller ────────────────────────────────────────

describe('Recommendation Controller', () => {
  describe('getVideoRecommendations', () => {
    it('returns 200 with recommendations', async () => {
      const { res, next } = createMockRes();
      await recommendationController.getVideoRecommendations(makeReq({ params: { videoId: VID }, query: { limit: '5' } }), res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 400 for invalid videoId', async () => {
      const { res, next } = createMockRes();
      await recommendationController.getVideoRecommendations(makeReq({ params: { videoId: 'invalid' } }), res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});

// ── Notification Controller ──────────────────────────────────────────

describe('Notification Controller', () => {
  let Notification;
  beforeEach(async () => {
    ({ default: Notification } = await import('../models/notification.model.js'));
  });

  describe('getMyNotifications', () => {
    it('returns 200 with notifications', async () => {
      const { res, next } = createMockRes();
      await notificationController.getMyNotifications(makeReq({ user: { _id: 'u1' }, query: { page: '1', limit: '10' } }), res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('markAsRead', () => {
    it('returns 200 when marking as read', async () => {
      Notification.updateMany.mockResolvedValue({ modifiedCount: 3 });
      const { res, next } = createMockRes();
      await notificationController.markAsRead(makeReq({ user: { _id: 'u1' }, body: { notificationIds: ['n1', 'n2', 'n3'] } }), res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 400 when ids empty', async () => {
      const { res, next } = createMockRes();
      await notificationController.markAsRead(makeReq({ user: { _id: 'u1' }, body: { notificationIds: [] } }), res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('markAllAsRead', () => {
    it('returns 200 on success', async () => {
      const { res, next } = createMockRes();
      await notificationController.markAllAsRead(makeReq({ user: { _id: 'u1' } }), res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});

// ── Analytics Controller ─────────────────────────────────────────────

describe('Analytics Controller', () => {
  let Video, VideoAnalytics;

  beforeEach(async () => {
    ({ Video } = await import('../models/video.model.js'));
    ({ default: VideoAnalytics } = await import('../models/videoAnalytics.model.js'));
    Video.exists.mockResolvedValue(false);
    VideoAnalytics.create.mockResolvedValue({});
  });

  describe('recordWatchEvent', () => {
    it('returns 201 on new watch event', async () => {
      Video.exists.mockResolvedValue(true);
      const redisClient = (await import('../config/redis.js')).default;
      redisClient.get.mockResolvedValue(null);
      redisClient.set.mockResolvedValue('OK');
      VideoAnalytics.create.mockResolvedValue({ _id: VID, video: VID, viewer: 'u1', watchDuration: 60, totalDuration: 120, completionRate: 0.5, source: 'direct', deviceType: 'desktop' });
      const { res, next } = createMockRes();
      await analyticsController.recordWatchEvent(makeReq({
        user: { _id: 'u1' },
        body: { videoId: VID, watchDuration: 60, totalDuration: 120, source: 'direct', deviceType: 'desktop' }
      }), res, next);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it.todo('recordWatchEvent 201 — verify redisClient and VideoAnalytics singletons resolve correctly after app.js import');

    it('returns 400 for invalid videoId', async () => {
      const { res, next } = createMockRes();
      await analyticsController.recordWatchEvent(makeReq({ user: { _id: 'u1' }, body: { videoId: 'invalid', watchDuration: 60, totalDuration: 120 } }), res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getDashboardSummary', () => {
    it('returns 200 with summary', async () => {
      const { res, next } = createMockRes();
      await analyticsController.getDashboardSummary(makeReq({ user: { _id: VID } }), res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getViewsChart', () => {
    it('returns 200 with views chart', async () => {
      const { res, next } = createMockRes();
      await analyticsController.getViewsChart(makeReq({ user: { _id: VID }, query: { period: 'month' } }), res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getSubscriberChart', () => {
    it('returns 200 with subscriber chart', async () => {
      const { res, next } = createMockRes();
      await analyticsController.getSubscriberChart(makeReq({ user: { _id: VID }, query: { period: 'month' } }), res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getTopVideosStats', () => {
    it('returns 200 with top videos', async () => {
      const { res, next } = createMockRes();
      await analyticsController.getTopVideosStats(makeReq({ user: { _id: VID }, query: { limit: '10' } }), res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getVideoRetention', () => {
    it('returns 200 with retention data', async () => {
      Video.findOne.mockResolvedValue({ _id: 'v1', owner: 'u1' });
      const { res, next } = createMockRes();
      await analyticsController.getVideoRetention(makeReq({ user: { _id: 'u1' }, params: { videoId: VID } }), res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 404 when not found', async () => {
      Video.findOne.mockResolvedValue(null);
      const { res, next } = createMockRes();
      await analyticsController.getVideoRetention(makeReq({ user: { _id: 'u1' }, params: { videoId: VID } }), res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
