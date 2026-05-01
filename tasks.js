import { z } from 'zod';

export const signupSchema = {
  body: z.object({
    name: z.string().trim().min(1, 'Name is required').max(80),
    email: z.string().trim().toLowerCase().email('Invalid email'),
    password: z.string().min(8, 'Password must be at least 8 characters').max(200),
  }),
};

export const loginSchema = {
  body: z.object({
    email: z.string().trim().toLowerCase().email('Invalid email'),
    password: z.string().min(1, 'Password is required'),
  }),
};
