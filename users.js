import { z } from 'zod';
import { TASK_STATUSES, TASK_PRIORITIES } from '../models/Task.js';

const isoDate = z
  .string()
  .datetime({ offset: true })
  .or(z.string().regex(/^\d{4}-\d{2}-\d{2}/))
  .optional()
  .nullable();

export const createTaskSchema = {
  body: z.object({
    title: z.string().trim().min(1).max(200),
    description: z.string().max(5000).optional().default(''),
    assignee: z.string().nullable().optional(),
    status: z.enum(TASK_STATUSES).optional(),
    priority: z.enum(TASK_PRIORITIES).optional(),
    dueDate: isoDate,
  }),
};

export const updateTaskSchema = {
  body: z
    .object({
      title: z.string().trim().min(1).max(200).optional(),
      description: z.string().max(5000).optional(),
      assignee: z.string().nullable().optional(),
      status: z.enum(TASK_STATUSES).optional(),
      priority: z.enum(TASK_PRIORITIES).optional(),
      dueDate: isoDate,
    })
    .refine((v) => Object.keys(v).length > 0, { message: 'At least one field required' }),
};
