import { z } from 'zod';

export const createTweetSchema = z.object({
  content: z.string().min(1).max(280).trim()
});

export const updateTweetSchema = z.object({
  content: z.string().min(1).max(280).trim()
});
