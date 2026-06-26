import { jest, describe, it, expect, beforeEach, beforeAll } from '@jest/globals';
import { setupTestMocks } from './setup.js';

let analyticsService;
let recommendationService;
let typesenseSyncService;
let searchHistoryService;
let notificationService;
let roomService;

beforeAll(async () => {
  await setupTestMocks({ skipServiceMocks: true });
  analyticsService = await import('../services/analytics.service.js');
  recommendationService = await import('../services/recommendation.service.js');
  typesenseSyncService = await import('../services/typesenseSync.service.js');
  searchHistoryService = await import('../services/searchHistory.service.js');
  notificationService = await import('../services/notification.service.js');
  roomService = await import('../services/room.service.js');
});

describe('Services Unit Tests for Coverage Boost', () => {

  describe('Analytics Service', () => {
    it('getViewsOverTime should run query', async () => {
      const { default: VideoAnalytics } = await import('../models/videoAnalytics.model.js');
      VideoAnalytics.aggregate.mockResolvedValue([
        { _id: '2026-06-25', views: 5, watchDuration: 60 }
      ]);
      const res = await analyticsService.getViewsOverTime(['507f1f77bcf86cd799439011'], 'week');
      expect(Array.isArray(res)).toBe(true);
    });

    it('getSubscriberGrowth should run query', async () => {
      const { Subscription } = await import('../models/subscription.model.js');
      Subscription.aggregate.mockResolvedValue([]);
      const res = await analyticsService.getSubscriberGrowth('507f1f77bcf86cd799439011', 'year');
      expect(Array.isArray(res)).toBe(true);
    });

    it('getTopVideos should run query', async () => {
      const { Video } = await import('../models/video.model.js');
      Video.aggregate.mockResolvedValue([]);
      const res = await analyticsService.getTopVideos(['507f1f77bcf86cd799439011']);
      expect(Array.isArray(res)).toBe(true);
    });

    it('getTrafficSources should run query', async () => {
      const { default: VideoAnalytics } = await import('../models/videoAnalytics.model.js');
      VideoAnalytics.aggregate.mockResolvedValue([]);
      const res = await analyticsService.getTrafficSources(['507f1f77bcf86cd799439011']);
      expect(Array.isArray(res)).toBe(true);
    });

    it('getAudienceRetention should run query', async () => {
      const { default: VideoAnalytics } = await import('../models/videoAnalytics.model.js');
      VideoAnalytics.aggregate.mockResolvedValue([]);
      const res = await analyticsService.getAudienceRetention('507f1f77bcf86cd799439011');
      expect(res).toBeDefined();
    });

    it('getSummaryStats should run query', async () => {
      const { Video } = await import('../models/video.model.js');
      const { Subscription } = await import('../models/subscription.model.js');
      const { default: VideoAnalytics } = await import('../models/videoAnalytics.model.js');

      VideoAnalytics.countDocuments.mockResolvedValue(100);
      VideoAnalytics.aggregate.mockResolvedValue([
        { _id: null, totalWatchSeconds: 3600 }
      ]);
      Subscription.countDocuments.mockResolvedValue(10);
      Video.countDocuments.mockResolvedValue(5);

      const res = await analyticsService.getSummaryStats(['507f1f77bcf86cd799439011'], 'channel123');
      expect(res.totalViews).toBe(100);
      expect(res.totalWatchTimeHours).toBe(1);
      expect(res.totalSubscribers).toBe(10);
      expect(res.publishedVideoCount).toBe(5);
    });
  });

  describe('Recommendation Service', () => {
    it('getContentBasedRecommendations should run query', async () => {
      const { Video } = await import('../models/video.model.js');
      Video.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: '507f1f77bcf86cd799439011', tags: ['node'] })
      });
      Video.aggregate.mockResolvedValue([]);
      const res = await recommendationService.getContentBasedRecommendations('507f1f77bcf86cd799439011');
      expect(Array.isArray(res)).toBe(true);
    });

    it('getCollaborativeRecommendations should run query', async () => {
      const { default: WatchHistory } = await import('../models/watchHistory.model.js');
      WatchHistory.aggregate.mockResolvedValue([]);
      const res = await recommendationService.getCollaborativeRecommendations('507f1f77bcf86cd799439011');
      expect(Array.isArray(res)).toBe(true);
    });

    it('getRecommendations should run query', async () => {
      const { Video } = await import('../models/video.model.js');
      Video.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: '507f1f77bcf86cd799439011', tags: ['node'] })
      });
      Video.aggregate.mockResolvedValue([]);
      const { default: WatchHistory } = await import('../models/watchHistory.model.js');
      WatchHistory.aggregate.mockResolvedValue([]);
      const res = await recommendationService.getRecommendations('507f1f77bcf86cd799439011');
      expect(Array.isArray(res)).toBe(true);
    });
  });

  describe('TypesenseSync Service', () => {
    it('indexVideo should run', async () => {
      await expect(typesenseSyncService.indexVideo({ _id: '1', title: 'test' })).resolves.not.toThrow();
    });

    it('indexTweet should run', async () => {
      await expect(typesenseSyncService.indexTweet({ _id: '1', content: 'test' })).resolves.not.toThrow();
    });

    it('deleteVideo should run', async () => {
      await expect(typesenseSyncService.deleteVideo('1')).resolves.not.toThrow();
    });

    it('deleteTweet should run', async () => {
      await expect(typesenseSyncService.deleteTweet('1')).resolves.not.toThrow();
    });

    it('updateVideoViews should run', async () => {
      await expect(typesenseSyncService.updateVideoViews('1', 10)).resolves.not.toThrow();
    });
  });

  describe('Search History Service', () => {
    it('saveSearchQuery should run', async () => {
      await expect(searchHistoryService.saveSearchQuery('user1', 'query')).resolves.not.toThrow();
    });

    it('getSearchHistory should run', async () => {
      await expect(searchHistoryService.getSearchHistory('user1')).resolves.toBeDefined();
    });
  });

  describe('Notification Service', () => {
    it('sendNotification should run', async () => {
      await expect(notificationService.sendNotification('user1', 'video', 'video1', 'new upload')).resolves.not.toThrow();
    });
  });

  describe('Room Service', () => {
    it('registerRoomHandlers should register listeners', () => {
      const mockSocket = {
        on: jest.fn(),
        join: jest.fn(),
        leave: jest.fn(),
        to: jest.fn().mockReturnThis(),
        emit: jest.fn()
      };
      const mockIo = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn()
      };
      expect(() => roomService.registerRoomHandlers(mockSocket, mockIo)).not.toThrow();
    });
  });
});
