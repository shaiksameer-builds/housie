import { z } from 'zod';
import { WinningCategory } from './game/types';

export const CreateRoomSchema = z.object({
  name: z
    .string()
    .min(3, 'Room name must be at least 3 characters')
    .max(50, 'Room name must be at most 50 characters')
    .trim(),
});

export const JoinRoomSchema = z.object({
  roomCode: z
    .string()
    .length(6, 'Room code must be exactly 6 characters')
    .toUpperCase()
    .trim(),
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(20, 'Display name must be at most 20 characters')
    .trim(),
});

export const ClaimWinSchema = z.object({
  roundId: z.string().min(1, 'Round ID is required'),
  category: z.nativeEnum(WinningCategory),
});

export const StartGameSchema = z.object({
  enabledCategories: z
    .array(z.nativeEnum(WinningCategory))
    .min(1, 'At least one winning category must be enabled'),
});

export const AutoCallSchema = z.object({
  enabled: z.boolean(),
  interval: z.number().min(2).max(30).optional().default(5),
});

export type CreateRoomInput = z.infer<typeof CreateRoomSchema>;
export type JoinRoomInput = z.infer<typeof JoinRoomSchema>;
export type ClaimWinInput = z.infer<typeof ClaimWinSchema>;
export type StartGameInput = z.infer<typeof StartGameSchema>;
export type AutoCallInput = z.infer<typeof AutoCallSchema>;
