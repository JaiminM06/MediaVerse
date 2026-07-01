import { jest } from '@jest/globals';

const mockRedis = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  setex: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  exists: jest.fn().mockResolvedValue(0),
  duplicate: jest.fn().mockReturnThis(),
  on: jest.fn(),
  connect: jest.fn(),
  subscribe: jest.fn(),
  publish: jest.fn(),
  once: jest.fn(),
};

export async function setupTestMocks(options = {}) {
  jest.unstable_mockModule('ioredis', () => ({
    __esModule: true,
    default: function MockRedis() { return mockRedis; }
  }));

  jest.unstable_mockModule('jsonwebtoken', () => ({
    __esModule: true,
    default: {
      verify: jest.fn().mockImplementation((token) => {
        if (token === 'invalid-token') throw new Error('invalid signature');
        return { _id: '507f1f77bcf86cd799439011' };
      }),
      sign: jest.fn().mockReturnValue('mocked-token'),
    }
  }));

  jest.unstable_mockModule('typesense', () => ({
    __esModule: true,
    default: {
      Client: jest.fn().mockImplementation(() => ({
        collections: jest.fn().mockReturnValue({
          documents: jest.fn().mockReturnValue({
            search: jest.fn().mockResolvedValue({ hits: [], found: 0 }),
            upsert: jest.fn().mockResolvedValue({}),
            delete: jest.fn().mockResolvedValue({}),
            update: jest.fn().mockResolvedValue({}),
            import: jest.fn().mockResolvedValue([])
          }),
          retrieve: jest.fn().mockResolvedValue({}),
          create: jest.fn().mockResolvedValue({})
        })
      }))
    }
  }));

  jest.unstable_mockModule('@aws-sdk/client-s3', () => ({
    S3Client: jest.fn().mockImplementation(() => ({ send: jest.fn().mockResolvedValue({}) })),
    PutObjectCommand: jest.fn(),
    DeleteObjectCommand: jest.fn()
  }));

  jest.unstable_mockModule('@aws-sdk/s3-request-presigner', () => ({
    getSignedUrl: jest.fn().mockResolvedValue('https://mock-s3-url.com/upload')
  }));

  jest.unstable_mockModule('../utils/cloudinary.js', () => ({
    uploadOnCloudinary: jest.fn().mockResolvedValue({
      url: 'https://cloudinary.com/mock-video.mp4',
      duration: 120,
    })
  }));

  jest.unstable_mockModule('bullmq', () => ({
    Queue: jest.fn().mockImplementation(() => ({
      add: jest.fn().mockResolvedValue({ id: 'mock-job-id' })
    }))
  }));

  const mockUserInstance = {
    _id: '507f1f77bcf86cd799439011',
    username: 'testuser',
    email: 'test@test.com',
    fullName: 'Test User',
    password: '$2b$10$hash',
    avatar: 'http://example.com/avatar.jpg',
    coverImage: '',
    refreshToken: 'mock-refresh-token',
    isPasswordCorrect: jest.fn().mockResolvedValue(true),
    generateAccessToken: jest.fn().mockReturnValue('mock-access-token'),
    generateRefreshToken: jest.fn().mockReturnValue('mock-refresh-token'),
    save: jest.fn().mockResolvedValue(true),
  };

  const userQueryMock = {
    select: jest.fn().mockResolvedValue(mockUserInstance),
    then: (resolve) => resolve(mockUserInstance),
  };

  jest.unstable_mockModule('../models/user.model.js', () => ({
    User: {
      findOne: jest.fn().mockResolvedValue(null),
      findById: jest.fn().mockReturnValue(userQueryMock),
      findByIdAndUpdate: jest.fn().mockReturnValue(userQueryMock),
      create: jest.fn().mockResolvedValue(mockUserInstance),
      aggregate: jest.fn().mockResolvedValue([]),
      countDocuments: jest.fn().mockResolvedValue(0),
    }
  }));

  jest.unstable_mockModule('../models/video.model.js', () => ({
    Video: {
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
        then: (resolve) => resolve([]),
      }),
      findById: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
        then: (resolve) => resolve(null),
      }),
      findByIdAndUpdate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
        then: (resolve) => resolve(null),
      }),
      findByIdAndDelete: jest.fn().mockResolvedValue(null),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ _id: 'mock-video-id' }),
      countDocuments: jest.fn().mockResolvedValue(0),
      exists: jest.fn().mockResolvedValue(false),
      aggregate: jest.fn().mockResolvedValue([]),
    }
  }));

  jest.unstable_mockModule('../models/watchHistory.model.js', () => ({
    __esModule: true,
    default: {
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
        then: (resolve) => resolve([]),
      }),
      findOneAndUpdate: jest.fn().mockReturnValue({
        then: (resolve) => resolve(null),
      }),
      deleteMany: jest.fn().mockResolvedValue({}),
      aggregate: jest.fn().mockResolvedValue([]),
    }
  }));

  jest.unstable_mockModule('../models/like.model.js', () => ({
    Like: {
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
        then: (resolve) => resolve([]),
      }),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
      findByIdAndDelete: jest.fn().mockResolvedValue(null),
      deleteMany: jest.fn().mockResolvedValue({}),
    }
  }));

  jest.unstable_mockModule('../models/comment.model.js', () => ({
    Comment: {
      find: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
      findByIdAndDelete: jest.fn().mockResolvedValue(null),
      deleteMany: jest.fn().mockResolvedValue({}),
    }
  }));

  jest.unstable_mockModule('../models/notification.model.js', () => ({
    __esModule: true,
    default: {
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
        then: (resolve) => resolve([]),
      }),
      findById: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
        then: (resolve) => resolve(null),
      }),
      create: jest.fn().mockResolvedValue({}),
      findByIdAndUpdate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
        then: (resolve) => resolve(null),
      }),
      updateMany: jest.fn().mockResolvedValue({}),
      countDocuments: jest.fn().mockResolvedValue(0),
    }
  }));

  jest.unstable_mockModule('../models/subscription.model.js', () => ({
    Subscription: {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
      deleteOne: jest.fn().mockResolvedValue({}),
      aggregate: jest.fn().mockResolvedValue([]),
      countDocuments: jest.fn().mockResolvedValue(0),
    }
  }));

  jest.unstable_mockModule('../models/playlist.model.js', () => ({
    Playlist: {
      find: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
    }
  }));

  jest.unstable_mockModule('../models/tweet.model.js', () => ({
    Tweet: {
      find: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
      aggregate: jest.fn().mockResolvedValue([]),
    }
  }));

  jest.unstable_mockModule('../models/videoAnalytics.model.js', () => ({
    __esModule: true,
    default: {
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({}),
      aggregate: jest.fn().mockResolvedValue([]),
      countDocuments: jest.fn().mockResolvedValue(0),
    }
  }));

  if (!options.skipServiceMocks) {
    jest.unstable_mockModule('../services/searchHistory.service.js', () => ({
      saveSearchQuery: jest.fn().mockResolvedValue(),
      getSearchHistory: jest.fn().mockResolvedValue([]),
    }));

    jest.unstable_mockModule('../services/analytics.service.js', () => ({
      getViewsOverTime: jest.fn().mockResolvedValue([]),
      getSubscriberGrowth: jest.fn().mockResolvedValue([]),
      getTopVideos: jest.fn().mockResolvedValue([]),
      getTrafficSources: jest.fn().mockResolvedValue([]),
      getAudienceRetention: jest.fn().mockResolvedValue([]),
      getSummaryStats: jest.fn().mockResolvedValue({}),
    }));

    jest.unstable_mockModule('../services/notification.service.js', () => ({
      sendNotification: jest.fn().mockResolvedValue(),
    }));

    jest.unstable_mockModule('../services/room.service.js', () => ({
      roomViewers: new Map(),
      registerRoomHandlers: jest.fn(),
    }));

    jest.unstable_mockModule('../services/typesenseSync.service.js', () => ({
      indexVideo: jest.fn().mockResolvedValue(),
      indexTweet: jest.fn().mockResolvedValue(),
      deleteVideo: jest.fn().mockResolvedValue(),
      deleteTweet: jest.fn().mockResolvedValue(),
      updateVideoViews: jest.fn().mockResolvedValue(),
    }));

    jest.unstable_mockModule('../services/recommendation.service.js', () => ({
      getContentBasedRecommendations: jest.fn().mockResolvedValue([]),
      getCollaborativeRecommendations: jest.fn().mockResolvedValue([]),
      getRecommendations: jest.fn().mockResolvedValue([]),
    }));
  }

  const appModule = await import('../app.js');
  return appModule.app;
}
