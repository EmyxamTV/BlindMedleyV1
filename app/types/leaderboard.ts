import type { JSONDataTypes } from "@adonisjs/core/types/transformers";

export interface LeaderboardEntry extends Record<string, JSONDataTypes> {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string | null;
  level: number;
  score: number;
  country: string | null;
}
