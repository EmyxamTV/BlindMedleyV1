import Game from "#models/game";
import GamePlayer from "#models/game_player";
import Round from "#models/round";
import { RoundService } from "#services/round_service";
import { ScoreService } from "#services/score_service";
import { XpService } from "#services/xp_service";
import { DateTime } from "luxon";
import crypto from "node:crypto";
import transmit from "@adonisjs/transmit/services/main";
import { inject } from "@adonisjs/core";
import type { CreateGameOptions, SubmitAnswerParams } from "#types/game";
import { displayUsernameForUser } from "#services/display_name";

@inject()
export class GameService {
  constructor(
    private readonly roundService: RoundService,
    private readonly scoreService: ScoreService,
    private readonly xpService: XpService,
  ) {}

  private readonly durationByDifficulty: Record<number, number> = {
    1: 30_000,
    2: 25_000,
    3: 20_000,
    4: 15_000,
    5: 10_000,
  };

  async createGame(options: CreateGameOptions): Promise<Game> {
    const game = await Game.create({
      name: options.name || null,
      mode: options.mode,
      answerMode: options.answerMode ?? "choices",
      answerTarget: options.answerTarget ?? "both",
      playlistId: options.playlistId,
      difficulty: options.difficulty ?? 2,
      maxPlayers: options.mode === "solo" ? 1 : (options.maxPlayers ?? 8),
      roundCount: options.roundCount ?? 10,
      roundDurationMs:
        options.roundDurationMs ?? this.durationByDifficulty[options.difficulty ?? 2] ?? 25_000,
      hostId: options.hostId,
      status: "waiting",
      currentRound: 0,
      publicId: this.generatePublicId(),
      code: options.mode === "private" ? this.generateCode() : null,
    });

    // Ajouter l'hôte en tant que joueur
    await GamePlayer.create({
      gameId: game.id,
      userId: options.hostId,
      joinedAt: DateTime.now(),
    });

    // Pré-générer tous les rounds
    await this.roundService.pregenerateRounds(game.id, options.playlistId, game.roundCount);

    return game;
  }

  async leaveGame(gameId: string, userId: string): Promise<void> {
    const game = await Game.findOrFail(gameId);
    if (game.status === "finished" || game.status === "cancelled") return;

    const player = await GamePlayer.query()
      .where("game_id", gameId)
      .where("user_id", userId)
      .first();
    if (!player) return;

    await player.merge({ isConnected: false, leftAt: DateTime.now() }).save();

    // Vérifier s'il reste des joueurs connectés
    const connected = await GamePlayer.query()
      .where("game_id", gameId)
      .where("is_connected", true)
      .count("* as total");

    if (Number(connected[0].$extras.total) === 0) {
      // Plus personne → annuler la partie
      const publicId = game.publicId;
      await game.delete();
      if (publicId) transmit.broadcast(`game/${publicId}`, { event: "game_deleted" });
    }
  }

  async joinGame(gameId: string, userId: string): Promise<GamePlayer> {
    const game = await Game.query().where("id", gameId).where("status", "waiting").firstOrFail();

    const playerCount = await GamePlayer.query().where("game_id", gameId).count("* as total");
    if (Number(playerCount[0].$extras.total) >= game.maxPlayers) {
      throw new Error("GAME_FULL");
    }

    const existing = await GamePlayer.query()
      .where("game_id", gameId)
      .where("user_id", userId)
      .first();
    if (existing) return existing;

    return GamePlayer.create({
      gameId,
      userId,
      joinedAt: DateTime.now(),
    });
  }

  async deleteEmptyPlayerGames(): Promise<void> {
    const games = await Game.query()
      .whereIn("status", ["waiting", "starting", "active", "paused"])
      .whereIn("mode", ["solo", "public", "private"])
      .preload("players", (query) => query.where("is_connected", true));

    for (const game of games) {
      if (game.players.length > 0) continue;
      const publicId = game.publicId;
      await game.delete();
      if (publicId) transmit.broadcast(`game/${publicId}`, { event: "game_deleted" });
    }
  }

  async startGame(gameId: string, hostId: string, options: { force?: boolean } = {}): Promise<Game> {
    const query = Game.query().where("id", gameId).where("status", "waiting");
    if (!options.force) query.where("host_id", hostId);
    const game = await query.firstOrFail();

    const playerCount = await GamePlayer.query().where("game_id", gameId).count("* as total");
    if (!options.force && game.mode !== "solo" && Number(playerCount[0].$extras.total) < 2) {
      throw new Error("NOT_ENOUGH_PLAYERS");
    }

    await game.merge({ status: "starting", startedAt: DateTime.now() }).save();

    // Notifier le lobby que la partie démarre
    transmit.broadcast(`game/${game.publicId}`, { event: "game_starting" });

    // Démarrer le premier round après un countdown de 3s
    setTimeout(() => this.startRound(game.id, 1).catch(console.error), 3000);

    return game;
  }

  async startRound(gameId: string, roundNumber: number): Promise<void> {
    const game = await Game.findOrFail(gameId);
    if (game.status === "finished" || game.status === "cancelled" || game.status === "paused") return;

    const round = await Round.query()
      .where("game_id", gameId)
      .where("round_number", roundNumber)
      .firstOrFail();

    await this.roundService.startRound(round, game.roundDurationMs);
    await game.merge({ status: "active", currentRound: roundNumber }).save();

    // Broadcaster le round à tous les joueurs
    const serverNow = Date.now();
    const roundPayload = await this.roundService.buildClientPayload(
      round,
      serverNow,
      game.answerMode,
    );
    transmit.broadcast(`game/${game.publicId}`, { event: "round_started", ...roundPayload });

    // Planifier la fin du round
    setTimeout(
      () => this.endRound(game.id, roundNumber).catch(console.error),
      game.roundDurationMs,
    );
  }

  async endRound(gameId: string, roundNumber: number): Promise<void> {
    const game = await Game.findOrFail(gameId);
    if (game.status === "finished" || game.status === "cancelled" || game.status === "paused") return;

    const round = await Round.query()
      .where("game_id", gameId)
      .where("round_number", roundNumber)
      .preload("track")
      .firstOrFail();

    // Éviter la double exécution (solo : timer annulé mais callback déjà parti)
    if (round.revealedAt) return;

    await this.roundService.revealRound(round);

    // Broadcaster la révélation de la bonne réponse
    const revealPayload = this.roundService.buildRevealPayload(round);
    transmit.broadcast(`game/${game.publicId}`, { event: "round_revealed", ...revealPayload });

    if (roundNumber >= game.roundCount) {
      await this.finishGame(game.id);
    } else {
      // Pause entre les rounds (2s en solo, 5s en multi)
      const pause = game.mode === "solo" ? 2000 : 5000;
      setTimeout(() => this.startRound(game.id, roundNumber + 1).catch(console.error), pause);
    }
  }

  async finishGame(gameId: string): Promise<Game> {
    const game = await Game.query().where("id", gameId).preload("playlist").firstOrFail();
    const isOfficialPlaylist = !game.playlist?.createdBy;

    const players = await GamePlayer.query().where("game_id", gameId).orderBy("score", "desc");

    // Assigner les rangs. Les playlists créées par les joueurs restent dans l'historique,
    // mais ne donnent pas d'XP et n'alimentent pas le classement.
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const rank = i + 1;
      const xpEarned = isOfficialPlaylist
        ? this.xpService.calculateGameXp(player, rank, players.length)
        : 0;
      await player.merge({ rank, xpEarned }).save();
    }

    const winner = players[0];
    const finishedGame = await game
      .merge({
        status: "finished",
        finishedAt: DateTime.now(),
        winnerId: winner?.userId ?? null,
      })
      .save();

    // Broadcaster en premier — la partie est terminée quoi qu'il arrive
    transmit.broadcast(`game/${game.publicId}`, { event: "game_finished" });

    // Mettre à jour l'historique/statistiques joueur (non bloquant).
    // Sur playlist joueur : pas d'XP, pas d'achievements, pas de leaderboard.
    for (const player of players) {
      this.xpService
        .awardXp(player.userId, player.xpEarned, player, {
          awardXp: isOfficialPlaylist,
          achievements: isOfficialPlaylist,
          leaderboard: isOfficialPlaylist,
        })
        .catch(console.error);
    }

    return finishedGame;
  }

  async pauseGame(gameId: string): Promise<Game> {
    const game = await Game.query()
      .where("id", gameId)
      .where("status", "active")
      .firstOrFail();

    const pausedGame = await game.merge({ status: "paused", pausedAt: DateTime.now() }).save();
    transmit.broadcast(`game/${game.publicId}`, { event: "game_paused" });
    return pausedGame;
  }

  async resumeGame(gameId: string): Promise<Game> {
    const game = await Game.query().where("id", gameId).where("status", "paused").firstOrFail();
    const now = DateTime.now();
    const pausedAt = game.pausedAt ?? now;
    const pauseMs = Math.max(0, now.toMillis() - pausedAt.toMillis());

    let currentRound: Round | null = null;
    if (game.currentRound > 0) {
      currentRound = await Round.query()
        .where("game_id", gameId)
        .where("round_number", game.currentRound)
        .preload("track")
        .first();

      if (currentRound?.endsAt) {
        await currentRound
          .merge({
            startsAt: currentRound.startsAt?.plus({ milliseconds: pauseMs }) ?? currentRound.startsAt,
            endsAt: currentRound.endsAt.plus({ milliseconds: pauseMs }),
          })
          .save();
      }
    }

    const resumedGame = await game.merge({ status: "active", pausedAt: null }).save();

    if (currentRound?.endsAt) {
      const remainingMs = Math.max(0, currentRound.endsAt.toMillis() - now.toMillis());
      setTimeout(
        () => this.endRound(game.id, currentRound!.roundNumber).catch(console.error),
        remainingMs,
      );

      const roundPayload = await this.roundService.buildClientPayload(currentRound, Date.now(), game.answerMode);
      transmit.broadcast(`game/${game.publicId}`, { event: "game_resumed", ...roundPayload });
    } else {
      transmit.broadcast(`game/${game.publicId}`, { event: "game_resumed" });
    }

    return resumedGame;
  }

  async stopGame(gameId: string): Promise<Game> {
    const game = await Game.query()
      .where("id", gameId)
      .whereNotIn("status", ["finished", "cancelled"])
      .firstOrFail();

    const stoppedGame = await game
      .merge({ status: "cancelled", finishedAt: DateTime.now(), pausedAt: null })
      .save();
    transmit.broadcast(`game/${game.publicId}`, { event: "game_stopped" });
    return stoppedGame;
  }

  async deleteGame(gameId: string): Promise<void> {
    const game = await Game.findOrFail(gameId);
    const publicId = game.publicId;
    await game.delete();
    if (publicId) transmit.broadcast(`game/${publicId}`, { event: "game_deleted" });
  }

  async getGameState(gameId: string) {
    const game = await Game.query()
      .where("id", gameId)
      .preload("players", (q) => q.preload("user", (uq) => uq.preload("profile")))
      .preload("playlist")
      .firstOrFail();

    const currentRound =
      game.currentRound > 0
        ? await Round.query()
            .where("game_id", gameId)
            .where("round_number", game.currentRound)
            .preload("track")
            .first()
        : null;

    return { game, currentRound };
  }

  async submitAnswer(params: SubmitAnswerParams) {
    const serverReceivedAt = Date.now();

    const game = await Game.query()
      .where("id", params.gameId)
      .where("status", "active")
      .where("current_round", params.roundNumber)
      .firstOrFail();

    const [round, gamePlayer] = await Promise.all([
      Round.query()
        .where("game_id", params.gameId)
        .where("round_number", params.roundNumber)
        .preload("track")
        .firstOrFail(),
      GamePlayer.query()
        .where("game_id", params.gameId)
        .where("user_id", params.userId)
        .firstOrFail(),
    ]);

    const result = await this.scoreService.processAnswer({
      round,
      gamePlayer,
      answerTrackId: params.answerTrackId ?? null,
      answerText: params.answerText ?? null,
      serverReceivedAt,
      allowRetry: game.answerMode === "text",
      answerTarget: game.answerTarget,
      roundDurationMs: game.roundDurationMs,
    });

    // Broadcaster la mise à jour des scores
    if (result.correct) {
      transmit.broadcast(`game/${game.publicId}`, {
        event: "answer_submitted",
        userId: params.userId,
        roundNumber: params.roundNumber,
        responseMs: result.responseMs,
        isCorrect: true,
      });
    }

    if (game.answerTarget === "separate" && (result.titleFound || result.artistFound)) {
      transmit.broadcast(`game/${game.publicId}`, {
        event: "answer_progress",
        userId: params.userId,
        roundNumber: params.roundNumber,
        titleFound: Boolean(result.titleFound),
        artistFound: Boolean(result.artistFound),
      });
    }

    const updatedPlayers = await GamePlayer.query()
      .where("game_id", params.gameId)
      .preload("user", (q) => q.preload("profile"));

    transmit.broadcast(`game/${game.publicId}`, {
      event: "scores_updated",
      players: updatedPlayers.map((p) => ({
        userId: p.userId,
        username: displayUsernameForUser({
          username: p.user?.profile?.username,
          fullName: p.user?.fullName,
          fallback: `User${p.userId}`,
        }),
        score: p.score,
        streak: p.streak,
        correct: p.correct,
        incorrect: p.incorrect,
      })),
    });

    // En mode solo : déclencher la fin du round dès que le joueur a répondu
    // revealedAt dans endRound empêche la double exécution si le timer normal se déclenche après
    if (game.mode === "solo" && (game.answerMode !== "text" || result.correct)) {
      setTimeout(() => this.endRound(game.id, params.roundNumber).catch(console.error), 1500);
    }

    return result;
  }

  private generatePublicId(): string {
    return crypto.randomBytes(6).toString("hex"); // 12 hex chars
  }

  private generateCode(): string {
    return crypto.randomBytes(3).toString("hex").toUpperCase();
  }
}
