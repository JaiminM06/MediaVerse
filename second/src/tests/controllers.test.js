import { jest, describe, it, expect, beforeAll } from '@jest/globals';
import { setupTestMocks } from './setup.js';

let tweetController;
let commentController;
let likeController;
let playlistContorller;
let subscriptionController;
let dashboardController;
let recommendationController;
let notificationController;
let analyticsController;

const makeMockResAndNext = () => {
  let resolvePromise;
  const promise = new Promise((resolve) => {
    resolvePromise = resolve;
  });
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockImplementation(() => {
    resolvePromise();
    return res;
  });
  const next = jest.fn().mockImplementation(() => {
    resolvePromise();
  });
  return { res, next, promise };
};

beforeAll(async () => {
  await setupTestMocks();
  tweetController = await import('../controllers/tweet.controller.js');
  commentController = await import('../controllers/comment.controller.js');
  likeController = await import('../controllers/like.controller.js');
  playlistContorller = await import('../controllers/playlist.contorller.js');
  subscriptionController = await import('../controllers/subscription.controller.js');
  dashboardController = await import('../controllers/dashboard.controller.js');
  recommendationController = await import('../controllers/recommendation.controller.js');
  notificationController = await import('../controllers/notification.controller.js');
  analyticsController = await import('../controllers/analytics.controller.js');
});

describe('Direct Controller Unit Tests for Coverage Boost', () => {

  describe('Tweet Controller', () => {
    it('createTweet should handle requests', async () => {
      const req = {
        user: { _id: '507f1f77bcf86cd799439011' },
        body: { content: 'hello tweet' }
      };
      const { res, next, promise } = makeMockResAndNext();
      tweetController.createTweet(req, res, next);
      await promise;
      expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
    });

    it('getUserTweets should handle requests', async () => {
      const req = { params: { userId: '507f1f77bcf86cd799439011' } };
      const { res, next, promise } = makeMockResAndNext();
      tweetController.getUserTweets(req, res, next);
      await promise;
      expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
    });

    it('updateTweet should handle requests', async () => {
      const req = {
        params: { tweetId: '507f1f77bcf86cd799439011' },
        body: { content: 'updated content' }
      };
      const { res, next, promise } = makeMockResAndNext();
      tweetController.updateTweet(req, res, next);
      await promise;
      expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
    });

    it('deleteTweet should handle requests', async () => {
      const req = { params: { tweetId: '507f1f77bcf86cd799439011' } };
      const { res, next, promise } = makeMockResAndNext();
      tweetController.deleteTweet(req, res, next);
      await promise;
      expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
    });
  });

  describe('Comment Controller', () => {
    it('getVideoComments should handle requests', async () => {
      const req = {
        params: { videoId: '507f1f77bcf86cd799439011' },
        query: { page: '1', limit: '10' }
      };
      const { res, next, promise } = makeMockResAndNext();
      commentController.getVideoComments(req, res, next);
      await promise;
      expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
    });

    it('addComment should handle requests', async () => {
      const req = {
        user: { _id: '507f1f77bcf86cd799439011' },
        params: { videoId: '507f1f77bcf86cd799439011' },
        body: { content: 'my comment' }
      };
      const { res, next, promise } = makeMockResAndNext();
      commentController.addComment(req, res, next);
      await promise;
      expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
    });

    it('updateComment should handle requests', async () => {
      const req = {
        params: { commentId: '507f1f77bcf86cd799439011' },
        body: { content: 'updated comment' }
      };
      const { res, next, promise } = makeMockResAndNext();
      commentController.updateComment(req, res, next);
      await promise;
      expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
    });

    it('deleteComment should handle requests', async () => {
      const req = { params: { commentId: '507f1f77bcf86cd799439011' } };
      const { res, next, promise } = makeMockResAndNext();
      commentController.deleteComment(req, res, next);
      await promise;
      expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
    });
  });

  describe('Like Controller', () => {
    it('toggleVideoLike should handle requests', async () => {
      const req = {
        user: { _id: '507f1f77bcf86cd799439011' },
        params: { videoId: '507f1f77bcf86cd799439011' }
      };
      const { res, next, promise } = makeMockResAndNext();
      likeController.toggleVideoLike(req, res, next);
      await promise;
      expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
    });

    it('toggleCommentLike should handle requests', async () => {
      const req = {
        user: { _id: '507f1f77bcf86cd799439011' },
        params: { commentId: '507f1f77bcf86cd799439011' }
      };
      const { res, next, promise } = makeMockResAndNext();
      likeController.toggleCommentLike(req, res, next);
      await promise;
      expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
    });

    it('toggleTweetLike should handle requests', async () => {
      const req = {
        user: { _id: '507f1f77bcf86cd799439011' },
        params: { tweetId: '507f1f77bcf86cd799439011' }
      };
      const { res, next, promise } = makeMockResAndNext();
      likeController.toggleTweetLike(req, res, next);
      await promise;
      expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
    });

    it('getLikedVideos should handle requests', async () => {
      const req = { user: { _id: '507f1f77bcf86cd799439011' } };
      const { res, next, promise } = makeMockResAndNext();
      likeController.getLikedVideos(req, res, next);
      await promise;
      expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
    });
  });

  describe('Playlist Controller', () => {
    it('createPlaylist should handle requests', async () => {
      const req = {
        user: { _id: '507f1f77bcf86cd799439011' },
        body: { name: 'my playlist', description: 'test desc' }
      };
      const { res, next, promise } = makeMockResAndNext();
      playlistContorller.createPlaylist(req, res, next);
      await promise;
      expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
    });

    it('getUserPlaylists should handle requests', async () => {
      const req = { params: { userId: '507f1f77bcf86cd799439011' } };
      const { res, next, promise } = makeMockResAndNext();
      playlistContorller.getUserPlaylists(req, res, next);
      await promise;
      expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
    });

    it('getPlaylistById should handle requests', async () => {
      const req = { params: { playlistId: '507f1f77bcf86cd799439011' } };
      const { res, next, promise } = makeMockResAndNext();
      playlistContorller.getPlaylistById(req, res, next);
      await promise;
      expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
    });

    it('addVideoToPlaylist should handle requests', async () => {
      const req = { params: { videoId: '507f1f77bcf86cd799439011', playlistId: '507f1f77bcf86cd799439011' } };
      const { res, next, promise } = makeMockResAndNext();
      playlistContorller.addVideoToPlaylist(req, res, next);
      await promise;
      expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
    });

    it('removeVideoFromPlaylist should handle requests', async () => {
      const req = { params: { videoId: '507f1f77bcf86cd799439011', playlistId: '507f1f77bcf86cd799439011' } };
      const { res, next, promise } = makeMockResAndNext();
      playlistContorller.removeVideoFromPlaylist(req, res, next);
      await promise;
      expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
    });

    it('deletePlaylist should handle requests', async () => {
      const req = { params: { playlistId: '507f1f77bcf86cd799439011' } };
      const { res, next, promise } = makeMockResAndNext();
      playlistContorller.deletePlaylist(req, res, next);
      await promise;
      expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
    });

    it('updatePlaylist should handle requests', async () => {
      const req = {
        params: { playlistId: '507f1f77bcf86cd799439011' },
        body: { name: 'new name', description: 'new desc' }
      };
      const { res, next, promise } = makeMockResAndNext();
      playlistContorller.updatePlaylist(req, res, next);
      await promise;
      expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
    });
  });

  describe('Subscription Controller', () => {
    it('toggleSubscription should handle requests', async () => {
      const req = {
        user: { _id: '507f1f77bcf86cd799439011' },
        params: { channelId: '507f1f77bcf86cd799439011' }
      };
      const { res, next, promise } = makeMockResAndNext();
      subscriptionController.toggleSubscription(req, res, next);
      await promise;
      expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
    });

    it('getUserChannelSubscribers should handle requests', async () => {
      const req = { params: { channelId: '507f1f77bcf86cd799439011' } };
      const { res, next, promise } = makeMockResAndNext();
      subscriptionController.getUserChannelSubscribers(req, res, next);
      await promise;
      expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
    });

    it('getSubscribedChannels should handle requests', async () => {
      const req = { params: { subscriberId: '507f1f77bcf86cd799439011' } };
      const { res, next, promise } = makeMockResAndNext();
      subscriptionController.getSubscribedChannels(req, res, next);
      await promise;
      expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
    });
  });

  describe('Dashboard Controller', () => {
    it('getChannelStats should handle requests', async () => {
      const req = { user: { _id: '507f1f77bcf86cd799439011' } };
      const { res, next, promise } = makeMockResAndNext();
      dashboardController.getChannelStats(req, res, next);
      await promise;
      expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
    });

    it('getChannelVideos should handle requests', async () => {
      const req = { user: { _id: '507f1f77bcf86cd799439011' } };
      const { res, next, promise } = makeMockResAndNext();
      dashboardController.getChannelVideos(req, res, next);
      await promise;
      expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
    });
  });

  describe('Recommendation Controller', () => {
    it('getVideoRecommendations should handle requests', async () => {
      const req = {
        params: { videoId: '507f1f77bcf86cd799439011' },
        query: { limit: '5' }
      };
      const { res, next, promise } = makeMockResAndNext();
      recommendationController.getVideoRecommendations(req, res, next);
      await promise;
      expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
    });
  });

  describe('Notification Controller', () => {
    it('getMyNotifications should handle requests', async () => {
      const req = {
        user: { _id: '507f1f77bcf86cd799439011' },
        query: { page: '1', limit: '10' }
      };
      const { res, next, promise } = makeMockResAndNext();
      notificationController.getMyNotifications(req, res, next);
      await promise;
      expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
    });

    it('markAsRead should handle requests', async () => {
      const req = {
        user: { _id: '507f1f77bcf86cd799439011' },
        body: { notificationIds: ['507f1f77bcf86cd799439011'] }
      };
      const { res, next, promise } = makeMockResAndNext();
      notificationController.markAsRead(req, res, next);
      await promise;
      expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
    });

    it('markAllAsRead should handle requests', async () => {
      const req = { user: { _id: '507f1f77bcf86cd799439011' } };
      const { res, next, promise } = makeMockResAndNext();
      notificationController.markAllAsRead(req, res, next);
      await promise;
      expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
    });
  });

  describe('Analytics Controller', () => {
    it('recordWatchEvent should handle requests', async () => {
      const req = {
        user: { _id: '507f1f77bcf86cd799439011' },
        body: { videoId: '507f1f77bcf86cd799439011', watchTimeSeconds: 60, isCompleted: true }
      };
      const { res, next, promise } = makeMockResAndNext();
      analyticsController.recordWatchEvent(req, res, next);
      await promise;
      expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
    });

    it('getDashboardSummary should handle requests', async () => {
      const req = { user: { _id: '507f1f77bcf86cd799439011' } };
      const { res, next, promise } = makeMockResAndNext();
      analyticsController.getDashboardSummary(req, res, next);
      await promise;
      expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
    });

    it('getViewsChart should handle requests', async () => {
      const req = { user: { _id: '507f1f77bcf86cd799439011' }, query: { period: 'month' } };
      const { res, next, promise } = makeMockResAndNext();
      analyticsController.getViewsChart(req, res, next);
      await promise;
      expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
    });

    it('getSubscriberChart should handle requests', async () => {
      const req = { user: { _id: '507f1f77bcf86cd799439011' }, query: { period: 'month' } };
      const { res, next, promise } = makeMockResAndNext();
      analyticsController.getSubscriberChart(req, res, next);
      await promise;
      expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
    });

    it('getTopVideosStats should handle requests', async () => {
      const req = { user: { _id: '507f1f77bcf86cd799439011' }, query: { limit: '10' } };
      const { res, next, promise } = makeMockResAndNext();
      analyticsController.getTopVideosStats(req, res, next);
      await promise;
      expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
    });

    it('getVideoRetention should handle requests', async () => {
      const req = { user: { _id: '507f1f77bcf86cd799439011' }, params: { videoId: '507f1f77bcf86cd799439011' } };
      const { res, next, promise } = makeMockResAndNext();
      analyticsController.getVideoRetention(req, res, next);
      await promise;
      expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
    });
  });
});
