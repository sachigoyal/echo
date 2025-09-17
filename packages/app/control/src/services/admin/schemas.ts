import { z } from 'zod';

export const adminCreateCreditGrantSchema = z.object({
  amountInDollars: z.number().positive('Amount must be positive'),
  expiresAt: z
    .date()
    .refine(date => date > new Date(), {
      message: 'Expiration date must be in the future',
    })
    .optional()
    .default(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)),
  maxUses: z
    .number()
    .int()
    .positive('Max uses must be a positive integer')
    .optional(),
  maxUsesPerUser: z
    .number()
    .int()
    .positive('Max uses per user must be a positive integer')
    .optional(),
});

export const adminUpdateCreditGrantSchema = adminCreateCreditGrantSchema
  .partial()
  .extend({
    id: z.string(),
    isArchived: z.boolean().optional(),
  });
