import { z } from 'zod';

export const createPlaylistSchema = z.object({
  name:        z.string().min(1).max(100).trim(),
  description: z.string().max(500).optional().default('')
});

export const updatePlaylistSchema = z.object({
  name:        z.string().min(1).max(100).trim().optional(),
  description: z.string().max(500).optional()
}).refine(data => data.name || data.description !== undefined, {
  message: 'At least one field required'
});
