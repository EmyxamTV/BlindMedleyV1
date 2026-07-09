import type { Data } from "@generated/data";
import { type JSONDataTypes } from "@adonisjs/core/types/transformers";

export type InertiaProps<T extends Record<string, JSONDataTypes> = {}> = Record<
  string,
  JSONDataTypes
> &
  Partial<Data.SharedProps> &
  T;

export type AchievementData = Data.Achievement;
export type FriendshipData = Data.Friendship;
export type GameData = Data.Game;
export type GamePlayerData = Data.GamePlayer;
export type PlaylistData = Data.Playlist;
export type ProfileData = Data.Profile;
export type UserData = Data.User;

export type GameWithPlayers = GameData & {
  id: string;
  players: GamePlayerData[];
};

export type TrackHistory = {
  roundNumber: number;
  title: string;
  artist: string;
  coverUrl: string | null;
};

export type RoundChoice = {
  choiceToken: string;
  title: string;
  artist: string;
};

export type ClientRound = {
  roundNumber: number;
  roundToken: string;
  previewUrl: string | null;
  coverUrl: string | null;
  startsAt: number;
  endsAt: number;
  serverNow: number;
  choices: RoundChoice[];
  alreadyAnswered?: boolean;
};
