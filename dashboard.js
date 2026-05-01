import { z } from 'zod';

export const createProjectSchema = {
  body: z.object({
    name: z.string().trim().min(1).max(120),
    description: z.string().max(2000).optional().default(''),
  }),
};

export const updateProjectSchema = {
  body: z
    .object({
      name: z.string().trim().min(1).max(120).optional(),
      description: z.string().max(2000).optional(),
    })
    .refine((v) => Object.keys(v).length > 0, { message: 'At least one field required' }),
};

export const addMemberSchema = {
  body: z.object({
    userId: z.string().min(1, 'userId is required'),
    role: z.enum(['admin', 'member']).default('member'),
  }),
};

export const updateMemberSchema = {
  body: z.object({
    role: z.enum(['admin', 'member']),
  }),
};
