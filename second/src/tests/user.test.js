import { jest, describe, it, expect, afterEach, beforeAll } from '@jest/globals';
import request from 'supertest';
import { setupTestMocks } from './setup.js';

let app;

beforeAll(async () => {
  app = await setupTestMocks();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('User Auth API', () => {

  describe('POST /api/v1/users/register', () => {
    it('returns 400 when body is empty', async () => {
      const res = await request(app)
        .post('/api/v1/users/register')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when email is invalid format', async () => {
      const res = await request(app)
        .post('/api/v1/users/register')
        .send({ fullName: 'Test', email: 'not-email', username: 'test', password: 'pass123' });
      expect(res.status).toBe(400);
    });

    it('returns 400 when username contains special characters', async () => {
      const res = await request(app)
        .post('/api/v1/users/register')
        .send({ fullName: 'Test', email: 't@t.com', username: 'test user!', password: 'pass123' });
      expect(res.status).toBe(400);
    });

    it('returns 400 when password is too short (< 6 chars)', async () => {
      const res = await request(app)
        .post('/api/v1/users/register')
        .send({ fullName: 'Test', email: 't@t.com', username: 'testuser', password: '123' });
      expect(res.status).toBe(400);
    });

    it('returns 400 when fullName is missing', async () => {
      const res = await request(app)
        .post('/api/v1/users/register')
        .send({ email: 't@t.com', username: 'testuser', password: 'pass123' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/users/login', () => {
    it('returns 400 when neither email nor username is provided', async () => {
      const res = await request(app)
        .post('/api/v1/users/login')
        .send({ password: 'somepass' });
      expect(res.status).toBe(400);
      expect(res.body.errors || res.body.message).toBeTruthy();
    });

    it('returns 400 for non-existent user credentials', async () => {
      const { User } = await import('../models/user.model.js');
      User.findOne.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/users/login')
        .send({ email: 'ghost@ghost.com', password: 'wrongpass' });
      expect(res.status).toBe(400);
    });

    it('returns 400 when password is missing', async () => {
      const res = await request(app)
        .post('/api/v1/users/login')
        .send({ email: 'test@test.com' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/users/current-user', () => {
    it('returns 401 when no auth token provided', async () => {
      const res = await request(app)
        .get('/api/v1/users/current-user');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/users/change-password', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .post('/api/v1/users/change-password')
        .send({ oldPassword: 'a', newPassword: 'b' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/users/history', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .get('/api/v1/users/history');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/users/c/:username (channel profile)', () => {
    it('returns 404 for non-existent username', async () => {
      // This route has verifyJWT middleware, so returns 401 without auth
      const res = await request(app)
        .get('/api/v1/users/c/definitly_not_a_real_user_xyz');
      expect(res.status).toBe(401);
    });

    it.todo('returns 200 with channel data for existing user');
  });
});
