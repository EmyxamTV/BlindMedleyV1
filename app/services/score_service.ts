import Round from "#models/round";
import GamePlayer from "#models/game_player";
import Answer from "#models/answer";
import { DateTime } from "luxon";
import type { AnswerTarget } from "#models/game";
import type {
  AnswerResult,
  ProcessAnswerParams,
  ProcessSeparateAnswerParams,
} from "#types/score";

const BASE_SCORE = 500;
const SPEED_BONUS_MAX = 350;
const INSTANT_BONUS_MAX = 75;
const STREAK_BONUS_STEP = 35;
const STREAK_BONUS_MAX = 175;
const DEFAULT_ROUND_DURATION_MS = 25_000;

export class ScoreService {
  async processAnswer(params: ProcessAnswerParams): Promise<AnswerResult> {
    const { round, gamePlayer, serverReceivedAt } = params;

    // Vérifier que le round est actif (horloge serveur fait autorité)
    const now = DateTime.now();
    if (!round.startsAt || !round.endsAt) {
      throw new Error("ROUND_NOT_STARTED");
    }
    if (now > round.endsAt) {
      throw new Error("ROUND_ENDED");
    }

    // Vérifier s'il a déjà répondu
    const existing = await Answer.query()
      .where("round_id", round.id)
      .where("game_player_id", gamePlayer.id)
      .first();
    if (existing?.isCorrect) {
      throw new Error("ALREADY_ANSWERED");
    }

    // Temps de réponse — calculé côté serveur uniquement
    const responseMs = serverReceivedAt - round.startsAt.toMillis();

    if (params.answerTarget === "separate" && params.answerText) {
      return this.processSeparateAnswer({
        round,
        gamePlayer,
        existing,
        answerText: params.answerText,
        responseMs,
        roundDurationMs: params.roundDurationMs,
      });
    }

    // Validation de la réponse
    const isCorrect = await this.validateAnswer(
      round,
      params.answerTrackId,
      params.answerText,
      params.answerTarget,
    );

    // Score calculé côté serveur
    const scoreEarned = isCorrect
      ? this.calculateScore(
          responseMs,
          gamePlayer.streak,
          params.roundDurationMs ?? round.game?.roundDurationMs ?? DEFAULT_ROUND_DURATION_MS,
        )
      : 0;

    // Flags anti-triche
    const flags = this.detectSuspiciousFlags(responseMs, isCorrect, gamePlayer);

    // Persister la réponse
    if (params.allowRetry && !isCorrect) {
      await gamePlayer.merge({ incorrect: gamePlayer.incorrect + 1, streak: 0 }).save();
      return { correct: false, scoreEarned: 0, responseMs, flags };
    }

    if (params.allowRetry) {
      await Answer.query()
        .where("round_id", round.id)
        .where("game_player_id", gamePlayer.id)
        .where("is_correct", false)
        .delete();
    }

    await Answer.create({
      roundId: round.id,
      gamePlayerId: gamePlayer.id,
      userId: gamePlayer.userId,
      answerTrackId: params.answerTrackId,
      answerText: params.answerText,
      isCorrect,
      scoreEarned,
      responseMs,
      suspiciousFlags: JSON.stringify(flags),
      submittedAt: DateTime.now(),
    });

    // Mettre à jour le GamePlayer
    if (isCorrect) {
      await gamePlayer
        .merge({
          score: gamePlayer.score + scoreEarned,
          correct: gamePlayer.correct + 1,
          streak: gamePlayer.streak + 1,
          bestStreak: Math.max(gamePlayer.bestStreak, gamePlayer.streak + 1),
        })
        .save();
    } else {
      await gamePlayer
        .merge({
          incorrect: gamePlayer.incorrect + 1,
          streak: 0,
        })
        .save();
    }

    return { correct: isCorrect, scoreEarned, responseMs, flags };
  }

  private async processSeparateAnswer(params: ProcessSeparateAnswerParams): Promise<AnswerResult> {
    const { round, gamePlayer, existing, answerText, responseMs } = params;
    const matches = await this.getTextMatches(round, answerText);
    const titleNew = matches.title && !existing?.titleCorrect;
    const artistNew = matches.artist && !existing?.artistCorrect;

    if (!titleNew && !artistNew) {
      await gamePlayer.merge({ incorrect: gamePlayer.incorrect + 1, streak: 0 }).save();
      return {
        correct: false,
        scoreEarned: 0,
        responseMs,
        flags: this.detectSuspiciousFlags(responseMs, false, gamePlayer),
      };
    }

    const titleCorrect = Boolean(existing?.titleCorrect || matches.title);
    const artistCorrect = Boolean(existing?.artistCorrect || matches.artist);
    const complete = titleCorrect && artistCorrect;
    const baseScore = this.calculateScore(
      responseMs,
      gamePlayer.streak,
      params.roundDurationMs ?? round.game?.roundDurationMs ?? DEFAULT_ROUND_DURATION_MS,
    );
    const scoreEarned = Math.floor((baseScore * (Number(titleNew) + Number(artistNew))) / 2);
    const flags = this.detectSuspiciousFlags(responseMs, true, gamePlayer);

    if (existing) {
      await existing
        .merge({
          answerText,
          isCorrect: complete,
          titleCorrect,
          artistCorrect,
          scoreEarned: existing.scoreEarned + scoreEarned,
          responseMs,
          suspiciousFlags: JSON.stringify(flags),
          submittedAt: DateTime.now(),
        })
        .save();
    } else {
      await Answer.create({
        roundId: round.id,
        gamePlayerId: gamePlayer.id,
        userId: gamePlayer.userId,
        answerText,
        answerTrackId: null,
        isCorrect: complete,
        titleCorrect,
        artistCorrect,
        scoreEarned,
        responseMs,
        suspiciousFlags: JSON.stringify(flags),
        submittedAt: DateTime.now(),
      });
    }

    await gamePlayer
      .merge({
        score: gamePlayer.score + scoreEarned,
        correct: gamePlayer.correct + (complete ? 1 : 0),
        streak: complete ? gamePlayer.streak + 1 : gamePlayer.streak,
        bestStreak: complete
          ? Math.max(gamePlayer.bestStreak, gamePlayer.streak + 1)
          : gamePlayer.bestStreak,
      })
      .save();

    return {
      correct: complete,
      partial: !complete,
      partialFound: titleNew ? "title" : "artist",
      titleFound: titleCorrect,
      artistFound: artistCorrect,
      scoreEarned,
      responseMs,
      flags,
    };
  }

  private async validateAnswer(
    round: Round,
    answerTrackId: string | null,
    answerText: string | null,
    answerTarget: AnswerTarget = "both",
  ): Promise<boolean> {
    if (!round.track) {
      await round.load("track");
    }
    const correctTrack = round.track;

    if (answerTrackId !== null) {
      return answerTrackId === correctTrack.id;
    }

    if (answerText) {
      const { title: titleMatches, artist: artistMatches } = await this.getTextMatches(
        round,
        answerText,
      );

      if (answerTarget === "title") return titleMatches;
      if (answerTarget === "artist") return artistMatches;
      return titleMatches && artistMatches;
    }

    return false;
  }

  private async getTextMatches(
    round: Round,
    answerText: string,
  ): Promise<{ title: boolean; artist: boolean }> {
    if (!round.track) await round.load("track");
    const normalized = this.normalizeText(answerText);
    return {
      title: this.matchesTextAnswer(normalized, this.normalizeText(round.track.title)),
      artist: this.matchesTextAnswer(normalized, this.normalizeText(round.track.artist)),
    };
  }

  private matchesTextAnswer(answer: string, expected: string): boolean {
    return (
      answer === expected ||
      answer.includes(expected) ||
      expected.includes(answer) ||
      this.isCloseAnswer(answer, expected)
    );
  }

  private isCloseAnswer(answer: string, expected: string): boolean {
    if (answer.length < 3 || expected.length < 3) return false;
    const maxDistance = Math.max(1, Math.floor(expected.length * 0.2));
    if (Math.abs(answer.length - expected.length) > maxDistance) return false;
    return this.levenshtein(answer, expected) <= maxDistance;
  }

  private levenshtein(left: string, right: string): number {
    const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
    for (let row = 1; row <= left.length; row++) {
      let diagonal = previous[0];
      previous[0] = row;
      for (let column = 1; column <= right.length; column++) {
        const above = previous[column];
        previous[column] = Math.min(
          previous[column] + 1,
          previous[column - 1] + 1,
          diagonal + (left[row - 1] === right[column - 1] ? 0 : 1),
        );
        diagonal = above;
      }
    }
    return previous[right.length];
  }

  private calculateScore(responseMs: number, streak: number, roundDurationMs: number): number {
    const safeDuration = Math.max(5_000, roundDurationMs || DEFAULT_ROUND_DURATION_MS);
    const responseRatio = Math.min(1, Math.max(0, responseMs / safeDuration));
    const timeLeftRatio = 1 - responseRatio;

    // Courbe réaliste : répondre deux fois plus vite ne double pas le score.
    // Ça récompense la vitesse, mais laisse une bonne réponse tardive valoir quelque chose.
    const speedBonus = Math.round(Math.pow(timeLeftRatio, 1.35) * SPEED_BONUS_MAX);

    // Petit bonus pour les réponses vraiment rapides, progressif et plafonné.
    const instantWindowRatio = Math.max(0, 1 - responseMs / Math.min(7_000, safeDuration * 0.35));
    const instantBonus = Math.round(Math.pow(instantWindowRatio, 1.8) * INSTANT_BONUS_MAX);

    // Les rounds courts sont plus difficiles, mais le bonus reste léger.
    const durationModifier = this.durationModifier(safeDuration);

    // Le streak donne un avantage, sans transformer la partie en x2.5 permanent.
    const streakBonus = Math.min(STREAK_BONUS_MAX, Math.max(0, streak) * STREAK_BONUS_STEP);

    return Math.max(100, Math.round((BASE_SCORE + speedBonus + instantBonus) * durationModifier + streakBonus));
  }

  private durationModifier(roundDurationMs: number): number {
    if (roundDurationMs <= 10_000) return 1.18;
    if (roundDurationMs <= 15_000) return 1.12;
    if (roundDurationMs <= 20_000) return 1.06;
    if (roundDurationMs <= 25_000) return 1;
    return 0.95;
  }

  private detectSuspiciousFlags(
    responseMs: number,
    isCorrect: boolean,
    player: GamePlayer,
  ): string[] {
    const flags: string[] = [];
    if (isCorrect && responseMs < 300) flags.push("IMPOSSIBLE_RESPONSE_TIME");
    if (isCorrect && responseMs < 800) flags.push("VERY_FAST_RESPONSE");
    if (player.correct >= 5 && player.incorrect === 0) flags.push("SUSPICIOUS_ACCURACY");
    return flags;
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, "")
      .trim();
  }
}
