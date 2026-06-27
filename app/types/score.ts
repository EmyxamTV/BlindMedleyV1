import type Round from "#models/round";
import type GamePlayer from "#models/game_player";
import type Answer from "#models/answer";
import type { AnswerTarget } from "#models/game";

export interface AnswerResult {
  correct: boolean;
  partial?: boolean;
  partialFound?: "title" | "artist" | null;
  titleFound?: boolean;
  artistFound?: boolean;
  scoreEarned: number;
  responseMs: number;
  flags: string[];
}

export type ProcessAnswerParams = {
  round: Round;
  gamePlayer: GamePlayer;
  answerTrackId: string | null;
  answerText: string | null;
  serverReceivedAt: number;
  allowRetry?: boolean;
  answerTarget?: AnswerTarget;
};

export type ProcessSeparateAnswerParams = {
  round: Round;
  gamePlayer: GamePlayer;
  existing: Answer | null;
  answerText: string;
  responseMs: number;
};
