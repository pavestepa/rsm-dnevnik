import { z } from 'zod';

export const phoneSchema = z
  .string()
  .regex(/^\+[1-9]\d{7,14}$/, 'Phone must be E.164 format');

export const createContactSchema = z.object({
  phone: phoneSchema,
  displayName: z.string().trim().min(1).max(120).optional(),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;

export const messageTextSchema = z.object({
  type: z.literal('text'),
  text: z.string().trim().min(1).max(4000),
});

export type MessageTextInput = z.infer<typeof messageTextSchema>;
