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

describe('Search API', () => {

  describe('GET /api/v1/search', () => {
    it('returns 400 when q param is missing', async () => {
      const res = await request(app)
        .get('/api/v1/search');
      expect(res.status).toBe(400);
    });

    it('returns 200 with empty results for non-matching query', async () => {
      const res = await request(app)
        .get('/api/v1/search?q=zzzzzzz_noresults_xyz');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('accepts type=video filter', async () => {
      const res = await request(app)
        .get('/api/v1/search?q=test&type=video');
      expect(res.status).toBe(200);
    });

    it('accepts type=tweet filter', async () => {
      const res = await request(app)
        .get('/api/v1/search?q=test&type=tweet');
      expect(res.status).toBe(200);
    });

    it('accepts type=all filter', async () => {
      const res = await request(app)
        .get('/api/v1/search?q=test&type=all');
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/v1/search/autocomplete', () => {
    it('returns 400 when q is less than 2 characters', async () => {
      const res = await request(app)
        .get('/api/v1/search/autocomplete?q=a');
      expect(res.status).toBe(400);
    });

    it('returns 200 with suggestions for valid query', async () => {
      const res = await request(app)
        .get('/api/v1/search/autocomplete?q=te');
      expect(res.status).toBe(200);
      expect(res.body.data.suggestions).toBeDefined();
      expect(Array.isArray(res.body.data.suggestions)).toBe(true);
    });
  });

  describe('GET /api/v1/search/history', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .get('/api/v1/search/history');
      expect(res.status).toBe(401);
    });
  });
});
