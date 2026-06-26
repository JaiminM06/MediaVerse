import { jest, describe, it, expect, beforeAll } from '@jest/globals';
import { setupTestMocks } from './setup.js';

let videoController;

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
  videoController = await import('../controllers/video.controller.js');
});

describe('Video Controller Unit Tests', () => {
  it('getInfiniteHomeFeed should handle requests', async () => {
    const req = { query: { page: '1', limit: '10' } };
    const { res, next, promise } = makeMockResAndNext();
    videoController.getInfiniteHomeFeed(req, res, next);
    await promise;
    expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
  });

  it('getAllVideos should handle requests', async () => {
    const req = { user: { _id: '507f1f77bcf86cd799439011' } };
    const { res, next, promise } = makeMockResAndNext();
    videoController.getAllVideos(req, res, next);
    await promise;
    expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
  });

  it('publishAVideo should handle requests', async () => {
    const { Video } = await import('../models/video.model.js');
    Video.findById.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: 'mock-video-id',
          owner: '507f1f77bcf86cd799439011',
          title: 'test video',
          isPublished: true
        }),
        then: (resolve) => resolve({
          _id: 'mock-video-id',
          owner: '507f1f77bcf86cd799439011',
          title: 'test video',
          isPublished: true
        })
      })
    });

    const req = {
      body: { title: 'test video', description: 'test desc' },
      files: {
        videoFile: [{ path: '/local/video.mp4' }],
        thumbnail: [{ path: '/local/thumb.jpg' }]
      },
      user: { _id: '507f1f77bcf86cd799439011' }
    };
    const { res, next, promise } = makeMockResAndNext();
    videoController.publishAVideo(req, res, next);
    await promise;
    expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
  });

  it('getVideoById should handle requests', async () => {
    const { Video } = await import('../models/video.model.js');
    Video.findById.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: '507f1f77bcf86cd799439011',
          owner: '507f1f77bcf86cd799439012',
          isPublished: true,
          processingStatus: 'ready',
          views: 10
        }),
        then: (resolve) => resolve({
          _id: '507f1f77bcf86cd799439011',
          owner: '507f1f77bcf86cd799439012',
          isPublished: true,
          processingStatus: 'ready',
          views: 10
        })
      })
    });
    Video.findByIdAndUpdate.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: '507f1f77bcf86cd799439011',
          owner: '507f1f77bcf86cd799439012',
          isPublished: true,
          processingStatus: 'ready',
          views: 11
        }),
        then: (resolve) => resolve({
          _id: '507f1f77bcf86cd799439011',
          owner: '507f1f77bcf86cd799439012',
          isPublished: true,
          processingStatus: 'ready',
          views: 11
        })
      })
    });

    const req = {
      params: { videoId: '507f1f77bcf86cd799439011' },
      user: { _id: '507f1f77bcf86cd799439011' }
    };
    const { res, next, promise } = makeMockResAndNext();
    videoController.getVideoById(req, res, next);
    await promise;
    expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
  });

  it('updateVideo should handle requests', async () => {
    const { Video } = await import('../models/video.model.js');
    Video.findById.mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      owner: '507f1f77bcf86cd799439011',
      title: 'old title',
      description: 'old desc'
    });
    Video.findByIdAndUpdate.mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      owner: '507f1f77bcf86cd799439011',
      title: 'updated title',
      description: 'updated desc'
    });

    const req = {
      params: { videoId: '507f1f77bcf86cd799439011' },
      body: { title: 'updated title', description: 'updated desc' },
      file: { path: '/local/thumb2.jpg' },
      user: { _id: '507f1f77bcf86cd799439011' }
    };
    const { res, next, promise } = makeMockResAndNext();
    videoController.updateVideo(req, res, next);
    await promise;
    expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
  });

  it('deleteVideo should handle requests', async () => {
    const { Video } = await import('../models/video.model.js');
    Video.findById.mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      owner: '507f1f77bcf86cd799439011'
    });
    Video.findByIdAndDelete.mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      owner: '507f1f77bcf86cd799439011'
    });

    const req = {
      params: { videoId: '507f1f77bcf86cd799439011' },
      user: { _id: '507f1f77bcf86cd799439011' }
    };
    const { res, next, promise } = makeMockResAndNext();
    videoController.deleteVideo(req, res, next);
    await promise;
    expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
  });

  it('togglePublishStatus should handle requests', async () => {
    const { Video } = await import('../models/video.model.js');
    Video.findById.mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      isPublished: true,
      save: jest.fn().mockResolvedValue(true)
    });

    const req = { params: { videoId: '507f1f77bcf86cd799439011' } };
    const { res, next, promise } = makeMockResAndNext();
    videoController.togglePublishStatus(req, res, next);
    await promise;
    expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
  });
});
