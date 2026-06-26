import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z.string().min(2).max(50).trim(),
  email:    z.string().email().toLowerCase(),
  username: z.string().min(3).max(30).toLowerCase()
             .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, underscores'),
  password: z.string().min(6).max(100)
});

export const loginSchema = z.object({
  email:    z.string().email().optional(),
  username: z.string().min(3).optional(),
  password: z.string().min(1, 'Password is required')
}).refine(data => data.email || data.username, {
  message: 'Either email or username is required'
});

export const updateAccountSchema = z.object({
  fullName: z.string().min(2).max(50).trim().optional(),
  email:    z.string().email().toLowerCase().optional()
}).refine(data => data.fullName || data.email, {
  message: 'At least one field required'
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Old password is required'),
  newPassword: z.string().min(6).max(100)
});
