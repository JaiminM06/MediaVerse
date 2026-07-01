import { z } from 'zod';

export const publishVideoSchema = z.object({
  title:       z.string().min(3).max(100).trim(),
  description: z.string().max(5000).trim().optional().default(''),
  tags:        z.array(z.string().max(30)).max(10).optional().default([])
});

export const updateVideoSchema = z.object({
  title:       z.string().min(3).max(100).trim().optional(),
  description: z.string().max(5000).trim().optional(),
  tags:        z.array(z.string().max(30)).max(10).optional()
}).refine(data => data.title || data.description || data.tags, {
  message: 'At least one field required'
});

export const requestUploadUrlSchema = z.object({
  fileName:    z.string().min(1),
  contentType: z.enum(['video/mp4', 'video/webm', 'video/quicktime']),
  fileSize:    z.number().positive().max(524288000, 'File size exceeds 500MB limit'),
  title:       z.string().min(3).max(100).trim(),
  description: z.string().max(5000).optional().default(''),
  tags:        z.array(z.string()).max(10).optional().default([])
});
