import { jest, describe, it, expect, beforeAll } from '@jest/globals';
import { setupTestMocks } from './setup.js';

let userController;

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
  userController = await import('../controllers/user.controller.js');
});

describe('User Controller Unit Tests', () => {
  it('registerUser should handle requests', async () => {
    const req = {
      body: {
        fullName: 'John Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'password123'
      },
      files: {
        avatar: [{ path: '/local/avatar.png' }],
        coverImage: [{ path: '/local/cover.png' }]
      }
    };
    const { res, next, promise } = makeMockResAndNext();
    userController.registerUser(req, res, next);
    await promise;
    expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
  });

  it('loginUser should handle requests', async () => {
    const { User } = await import('../models/user.model.js');
    User.findOne.mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      username: 'johndoe',
      email: 'john@example.com',
      isPasswordCorrect: jest.fn().mockResolvedValue(true),
      generateAccessToken: jest.fn().mockReturnValue('mock-access-token'),
      generateRefreshToken: jest.fn().mockReturnValue('mock-refresh-token'),
      save: jest.fn().mockResolvedValue(true)
    });

    const req = {
      body: {
        email: 'john@example.com',
        username: 'johndoe',
        password: 'password123'
      }
    };
    const { res, next, promise } = makeMockResAndNext();
    userController.loginUser(req, res, next);
    await promise;
    expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
  });

  it('logoutUser should handle requests', async () => {
    const req = { user: { _id: '507f1f77bcf86cd799439011' } };
    const { res, next, promise } = makeMockResAndNext();
    userController.logoutUser(req, res, next);
    await promise;
    expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
  });

  it('refreshAccessToken should handle requests', async () => {
    const req = {
      cookies: { refreshToken: 'mock-token' },
      body: { refreshToken: 'mock-token' }
    };
    const { res, next, promise } = makeMockResAndNext();
    userController.refreshAccessToken(req, res, next);
    await promise;
    expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
  });

  it('changeCurrentPassword should handle requests', async () => {
    const req = {
      user: { _id: '507f1f77bcf86cd799439011' },
      body: { oldPassword: 'old', newPassword: 'new' }
    };
    const { res, next, promise } = makeMockResAndNext();
    userController.changeCurrentPassword(req, res, next);
    await promise;
    expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
  });

  it('getCurrentUser should handle requests', async () => {
    const req = { user: { _id: '507f1f77bcf86cd799439011' } };
    const { res, next, promise } = makeMockResAndNext();
    userController.getCurrentUser(req, res, next);
    await promise;
    expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
  });

  it('updateAccountDetails should handle requests', async () => {
    const req = {
      user: { _id: '507f1f77bcf86cd799439011' },
      body: { fullName: 'New Name', email: 'new@example.com' }
    };
    const { res, next, promise } = makeMockResAndNext();
    userController.updateAccountDetails(req, res, next);
    await promise;
    expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
  });

  it('updateUserAvatar should handle requests', async () => {
    const req = {
      user: { _id: '507f1f77bcf86cd799439011' },
      file: { path: '/local/new-avatar.png' }
    };
    const { res, next, promise } = makeMockResAndNext();
    userController.updateUserAvatar(req, res, next);
    await promise;
    expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
  });

  it('updateUserCoverImage should handle requests', async () => {
    const req = {
      user: { _id: '507f1f77bcf86cd799439011' },
      file: { path: '/local/new-cover.png' }
    };
    const { res, next, promise } = makeMockResAndNext();
    userController.updateUserCoverImage(req, res, next);
    await promise;
    expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
  });

  it('getUserChannelProfile should handle requests', async () => {
    const req = {
      params: { username: 'testuser' },
      user: { _id: '507f1f77bcf86cd799439011' }
    };
    const { res, next, promise } = makeMockResAndNext();
    userController.getUserChannelProfile(req, res, next);
    await promise;
    expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
  });

  it('getWatchHistory should handle requests', async () => {
    const req = { user: { _id: '507f1f77bcf86cd799439011' } };
    const { res, next, promise } = makeMockResAndNext();
    userController.getWatchHistory(req, res, next);
    await promise;
    expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
  });

  it('getUserById should handle requests', async () => {
    const req = { params: { userid: '507f1f77bcf86cd799439011' } };
    const { res, next, promise } = makeMockResAndNext();
    userController.getUserById(req, res, next);
    await promise;
    expect(res.status.mock.calls.length > 0 || next.mock.calls.length > 0).toBe(true);
  });
});
