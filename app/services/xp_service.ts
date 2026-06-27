import Profile from "#models/profile";
import Achievement from "#models/achievement";
import { DateTime } from "luxon";
import type GamePlayer from "#models/game_player";
import { LeaderboardService } from "#services/leaderboard_service";
import { inject } from "@adonisjs/core";

// XP nécessaire pour chaque niveau
function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.4, level - 1));
}

@inject()
export class XpService {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  calculateGameXp(player: GamePlayer, rank: number, totalPlayers: number): number {
    let xp = 10; // base

    // Bonus pour les bonnes réponses
    xp += player.correct * 15;

    // Bonus de rang (uniquement en multijoueur)
    if (totalPlayers > 1) {
      if (rank === 1) xp += 100;
      else if (rank === 2) xp += 60;
      else if (rank === 3) xp += 30;
    }

    // Bonus streak
    xp += player.bestStreak * 5;

    return xp;
  }

  async awardXp(userId: string, amount: number, player: GamePlayer): Promise<void> {
    let profile = await Profile.query().where("user_id", userId).first();
    if (!profile) {
      // Filet de sécurité : créer le profil s'il n'existe pas encore
      profile = await Profile.create({ userId });
    }

    let newXp = profile.xp + amount;
    let newLevel = profile.level;
    let newXpToNext = profile.xpToNextLevel;

    // Level up
    while (newXp >= newXpToNext) {
      newXp -= newXpToNext;
      newLevel++;
      newXpToNext = xpForLevel(newLevel + 1);
    }

    const newAvgScore = Math.round(
      (profile.avgScore * profile.totalGames + player.score) / (profile.totalGames + 1),
    );
    const newAvgMs = Math.round(
      (profile.avgResponseMs * profile.totalAnswers + player.correct * 1500) /
        Math.max(profile.totalAnswers + player.correct, 1),
    );

    await profile
      .merge({
        xp: newXp,
        level: newLevel,
        xpToNextLevel: newXpToNext,
        totalGames: profile.totalGames + 1,
        totalWins: profile.totalWins + (player.rank === 1 ? 1 : 0),
        totalCorrect: profile.totalCorrect + player.correct,
        totalAnswers: profile.totalAnswers + player.correct + player.incorrect,
        avgScore: newAvgScore,
        avgResponseMs: newAvgMs,
        bestStreak: Math.max(profile.bestStreak, player.bestStreak),
      })
      .save();

    await this.leaderboardService.addScore(userId, player.score, profile.country);

    // Vérifier les achievements
    await this.checkAchievements(userId, profile, player);
  }

  private async checkAchievements(
    userId: string,
    profile: Profile,
    player: GamePlayer,
  ): Promise<void> {
    const achievements = await Achievement.all();
    const userAchievements = await Achievement.query()
      .whereHas("users", (q) => q.where("users.id", userId))
      .select("id");

    const unlockedIds = new Set(userAchievements.map((a) => a.id));

    for (const achievement of achievements) {
      if (unlockedIds.has(achievement.id)) continue;

      if (this.meetsCondition(JSON.parse(achievement.condition), profile, player)) {
        await achievement.related("users").attach({
          [userId]: { unlocked_at: DateTime.now().toSQL() },
        });
      }
    }
  }

  private meetsCondition(
    condition: Record<string, unknown>,
    profile: Profile,
    player: GamePlayer,
  ): boolean {
    const { type, threshold } = condition as { type: string; threshold: number };

    switch (type) {
      case "total_games":
        return profile.totalGames + 1 >= threshold;
      case "total_wins":
        return profile.totalWins + (player.rank === 1 ? 1 : 0) >= threshold;
      case "level":
        return profile.level >= threshold;
      case "streak":
        return player.bestStreak >= threshold;
      case "perfect_game":
        return player.incorrect === 0 && player.correct >= 5;
      default:
        return false;
    }
  }
}
