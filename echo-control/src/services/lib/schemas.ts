import { z } from 'zod';

const userIdSchema = z.uuid();

export type UserId = z.infer<typeof userIdSchema>;
