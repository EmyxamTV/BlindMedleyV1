import LeaderboardSnapshot from "#models/leaderboard_snapshot";
import { DateTime } from "luxon";
import type { LeaderboardEntry } from "#types/leaderboard";
import { displayUsernameForUser } from "#services/display_name";

export class LeaderboardService {
  async addScore(userId: string, score: number, country?: string | null): Promise<void> {
    const periods = ["global", this.getWeeklyPeriod(), this.getMonthlyPeriod()];

    for (const period of periods) {
      await LeaderboardSnapshot.updateOrCreate(
        { userId, period },
        { score: 0, country: country ?? null, computedAt: DateTime.now() },
      );

      // Incrémenter le score
      await LeaderboardSnapshot.query()
        .where("user_id", userId)
        .where("period", period)
        .increment("score", score)
        .update({ computed_at: DateTime.now().toSQL() });
    }
  }

  async getLeaderboard(
    period: "global" | "weekly" | "monthly",
    options: { country?: string; limit?: number; offset?: number } = {},
  ): Promise<LeaderboardEntry[]> {
    const periodKey =
      period === "weekly"
        ? this.getWeeklyPeriod()
        : period === "monthly"
          ? this.getMonthlyPeriod()
          : "global";
    const limit = options.limit ?? 100;
    const offset = options.offset ?? 0;

    const query = LeaderboardSnapshot.query()
      .where("period", periodKey)
      .preload("user", (q) => q.preload("profile"))
      .orderBy("score", "desc")
      .limit(limit)
      .offset(offset);

    if (options.country) {
      query.where("country", options.country);
    }

    const snapshots = await query;

    return snapshots.map((s, i) => ({
      rank: offset + i + 1,
      userId: s.userId,
      username: displayUsernameForUser({
        username: s.user?.profile?.username,
        fullName: s.user?.fullName,
        fallback: `User${s.userId}`,
      }),
      avatarUrl: s.user?.profile?.avatarUrl ?? null,
      level: s.user?.profile?.level ?? 1,
      score: Number(s.score),
      country: s.country,
    }));
  }

  async getUserRank(
    userId: string,
    period: "global" | "weekly" | "monthly",
  ): Promise<number | null> {
    const periodKey =
      period === "weekly"
        ? this.getWeeklyPeriod()
        : period === "monthly"
          ? this.getMonthlyPeriod()
          : "global";

    const snapshot = await LeaderboardSnapshot.query()
      .where("user_id", userId)
      .where("period", periodKey)
      .first();

    if (!snapshot) return null;

    const rank = await LeaderboardSnapshot.query()
      .where("period", periodKey)
      .where("score", ">", snapshot.score)
      .count("* as total");

    return Number(rank[0].$extras.total) + 1;
  }

  async getFriendsLeaderboard(userId: string, friendIds: string[]): Promise<LeaderboardEntry[]> {
    const ids = [...friendIds, userId];
    const snapshots = await LeaderboardSnapshot.query()
      .where("period", "global")
      .whereIn("user_id", ids)
      .preload("user", (q) => q.preload("profile"))
      .orderBy("score", "desc");

    return snapshots.map((s, i) => ({
      rank: i + 1,
      userId: s.userId,
      username: displayUsernameForUser({
        username: s.user?.profile?.username,
        fullName: s.user?.fullName,
        fallback: `User${s.userId}`,
      }),
      avatarUrl: s.user?.profile?.avatarUrl ?? null,
      level: s.user?.profile?.level ?? 1,
      score: Number(s.score),
      country: s.country,
    }));
  }

  getWeeklyPeriod(): string {
    const now = DateTime.now();
    const week = now.weekNumber;
    return `weekly:${now.year}-W${String(week).padStart(2, "0")}`;
  }

  getMonthlyPeriod(): string {
    const now = DateTime.now();
    return `monthly:${now.year}-${String(now.month).padStart(2, "0")}`;
  }
}
