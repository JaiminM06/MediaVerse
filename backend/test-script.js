import { setupTestMocks, createMockRes } from './src/tests/setup.js';
const app = await setupTestMocks();
const tweetController = await import('./src/controllers/tweet.controller.js');
const { Tweet } = await import('./src/models/tweet.model.js');
const { jest } = await import('@jest/globals');

const saved = { _id: '507f1f77bcf86cd799439011', content: 'hello', owner: { _id: 'u1', username: 'a', avatar: 'av', fullName: 'A' }, mentions: [], media: [], hashtags: [], isRetweet: false };
Tweet.create.mockResolvedValue(saved);
Tweet.findById.mockReturnValue({ 
  populate: () => ({ populate: () => ({ then(cb) { cb(saved); return { catch() {} }; }, catch() { return this; } }) }), 
  then(cb) { cb(saved); return { catch() {} }; }, 
  catch() { return this; } 
});

const { res, next } = createMockRes();
next.mockImplementation((err) => console.log('NEXT CALLED WITH ERROR:', err));

await tweetController.createTweet({ params: {}, query: {}, body: { content: 'hello' }, ip: '127.0.0.1', headers: {}, socket: { remoteAddress: '127.0.0.1' }, user: { _id: 'u1', username: 'a' } }, res, next);
console.log('RES.STATUS CALLS:', res.status.mock.calls);
