import Game from "#models/game";
import GamePlayer from "#models/game_player";
import Round from "#models/round";
import Answer from "#models/answer";
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
  private readonly officialFirstStartDelayMs = 30_000;
  private readonly officialRestartDelayMs = 45_000;
  private readonly roundPrerollMs = 3_000;
  private readonly firstRoundDelayMs = 4_000;
  private readonly officialStartTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly gameProgressTimers = new Map<string, ReturnType<typeof setTimeout>>();

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
      source: options.source ?? "player",
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
      autoStartsAt: options.autoStartsAt ?? null,
      publicId: this.generatePublicId(),
      code: options.mode === "private" ? this.generateCode() : null,
    });

    // Ajouter l'hôte en tant que joueur
    const playerIds = new Set(options.initialPlayerIds ?? []);

    if (options.addHost !== false) {
      playerIds.delete(options.hostId);
      await GamePlayer.create({
        gameId: game.id,
        userId: options.hostId,
        joinedAt: DateTime.now(),
      });
    }

    if (playerIds.size > 0) {
      await GamePlayer.createMany(
        [...playerIds].map((userId) => ({
          gameId: game.id,
          userId,
          joinedAt: DateTime.now(),
        })),
      );
    }

    // Pré-générer tous les rounds
    await this.roundService.pregenerateRounds(game.id, options.playlistId, game.roundCount);

    if (game.source === "blindmedley" && options.autoStartsAt && playerIds.size > 0) {
      this.scheduleOfficialStart(
        game.id,
        Math.max(0, options.autoStartsAt.toMillis() - DateTime.now().toMillis()),
      );
    }

    if (game.mode === "public") this.broadcastPublicGamesChanged();

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
      if (game.source === "blindmedley") {
        this.clearOfficialStart(game.id);
        this.clearProgressSync(game.id);
        if (game.status === "waiting") {
          await game.merge({ autoStartsAt: null }).save();
          transmit.broadcast(`game/${game.publicId}`, { event: "official_countdown_cancelled" });
        }
        this.broadcastLobbyChanged(game.publicId);
        this.broadcastPublicGamesChanged();
        return;
      }
      // Plus personne → annuler la partie
      const publicId = game.publicId;
      this.clearProgressSync(game.id);
      await game.delete();
      if (publicId) transmit.broadcast(`game/${publicId}`, { event: "game_deleted" });
      this.broadcastPublicGamesChanged();
      return;
    }

    this.broadcastLobbyChanged(game.publicId);
    if (game.mode === "public") this.broadcastPublicGamesChanged();
  }

  async joinGame(gameId: string, userId: string): Promise<GamePlayer> {
    const game = await Game.query()
      .where("id", gameId)
      .whereIn("status", ["waiting", "starting", "active", "paused"])
      .firstOrFail();

    const playerCount = await GamePlayer.query()
      .where("game_id", gameId)
      .where("is_connected", true)
      .count("* as total");
    const connectedBefore = Number(playerCount[0].$extras.total);
    if (connectedBefore >= game.maxPlayers) {
      throw new Error("GAME_FULL");
    }

    const existing = await GamePlayer.query()
      .where("game_id", gameId)
      .where("user_id", userId)
      .first();
    const player = existing
      ? await existing.merge({ isConnected: true, leftAt: null }).save()
      : await GamePlayer.create({
          gameId,
          userId,
          joinedAt: DateTime.now(),
        });

    if (game.status === "waiting" && game.source === "blindmedley" && connectedBefore === 0) {
      const autoStartsAt = DateTime.now().plus({ milliseconds: this.officialFirstStartDelayMs });
      await game.merge({ autoStartsAt }).save();
      this.scheduleOfficialStart(game.id, this.officialFirstStartDelayMs);
      transmit.broadcast(`game/${game.publicId}`, {
        event: "official_countdown_started",
        autoStartsAt: autoStartsAt.toMillis(),
      });
    }

    this.broadcastLobbyChanged(game.publicId);
    if (game.mode === "public") this.broadcastPublicGamesChanged();

    return player;
  }

  async markPlayerConnected(gameId: string, userId: string): Promise<void> {
    await GamePlayer.query()
      .where("game_id", gameId)
      .where("user_id", userId)
      .update({ isConnected: true, leftAt: null });
  }

  async syncOfficialGames(): Promise<void> {
    await this.cleanupDuplicateOfficialGames();

    const games = await Game.query()
      .where("source", "blindmedley")
      .whereIn("status", ["waiting", "finished"]);

    const now = DateTime.now();
    for (const game of games) {
      if (!game.autoStartsAt) {
        if (game.status === "finished") await this.ensureOfficialRestartCountdown(game.id);
        continue;
      }
      const delayMs = game.autoStartsAt.toMillis() - now.toMillis();
      if (delayMs <= 0) {
        await this.startOfficialGameIfReady(game.id);
      } else if (!this.officialStartTimers.has(game.id)) {
        this.scheduleOfficialStart(game.id, delayMs);
      }
    }
  }

  async deleteEmptyPlayerGames(): Promise<void> {
    const games = await Game.query()
      .whereIn("status", ["waiting", "starting", "active", "paused"])
      .whereIn("mode", ["solo", "public", "private"])
      .preload("players", (query) => query.where("is_connected", true));

    for (const game of games) {
      if (game.players.length > 0 || game.source === "blindmedley") continue;
      const publicId = game.publicId;
      this.clearOfficialStart(game.id);
      this.clearProgressSync(game.id);
      await game.delete();
      if (publicId) transmit.broadcast(`game/${publicId}`, { event: "game_deleted" });
      this.broadcastPublicGamesChanged();
    }
  }

  async cleanupDuplicateOfficialGames(): Promise<void> {
    const games = await Game.query()
      .where("source", "blindmedley")
      .where("mode", "public")
      .whereIn("status", ["waiting", "starting", "active", "paused", "finished"])
      .preload("players", (query) => query.where("is_connected", true));

    const groups = new Map<string, Game[]>();
    for (const game of games) {
      const key = [
        game.playlistId ?? "no-playlist",
        game.name ?? "no-name",
        game.answerMode,
        game.answerTarget,
        game.difficulty,
        game.roundCount,
        game.roundDurationMs,
        game.maxPlayers,
      ].join(":");
      groups.set(key, [...(groups.get(key) ?? []), game]);
    }

    for (const duplicateGroup of groups.values()) {
      if (duplicateGroup.length <= 1) continue;

      const [keeper, ...duplicates] = duplicateGroup.sort((left, right) => {
        const connectedDelta = right.players.length - left.players.length;
        if (connectedDelta !== 0) return connectedDelta;

        const statusPriority = (status: string) => {
          if (status === "active") return 4;
          if (status === "starting") return 3;
          if (status === "waiting") return 2;
          if (status === "paused") return 1;
          return 0;
        };
        const statusDelta = statusPriority(right.status) - statusPriority(left.status);
        if (statusDelta !== 0) return statusDelta;

        return right.createdAt.toMillis() - left.createdAt.toMillis();
      });

      for (const duplicate of duplicates) {
        this.clearOfficialStart(duplicate.id);
        this.clearProgressSync(duplicate.id);
        const publicId = duplicate.publicId;

        if (duplicate.players.length === 0) {
          await duplicate.delete();
          if (publicId) transmit.broadcast(`game/${publicId}`, { event: "game_deleted" });
          continue;
        }

        await duplicate
          .merge({
            status: "cancelled",
            finishedAt: DateTime.now(),
            pausedAt: null,
            autoStartsAt: null,
          })
          .save();
        if (publicId) transmit.broadcast(`game/${publicId}`, { event: "game_stopped" });
      }

      if (keeper.mode === "public") this.broadcastPublicGamesChanged();
    }
  }

  async startGame(
    gameId: string,
    hostId: string,
    options: { force?: boolean; allowSinglePlayer?: boolean } = {},
  ): Promise<Game> {
    const query = Game.query().where("id", gameId).where("status", "waiting");
    if (!options.force) query.where("host_id", hostId);
    const game = await query.firstOrFail();

    const playerCount = await GamePlayer.query()
      .where("game_id", gameId)
      .where("is_connected", true)
      .count("* as total");
    const minPlayers = game.mode === "solo" || options.force || options.allowSinglePlayer ? 1 : 2;
    if (Number(playerCount[0].$extras.total) < minPlayers) {
      throw new Error("NOT_ENOUGH_PLAYERS");
    }

    this.clearOfficialStart(game.id);
    this.clearProgressSync(game.id);
    const startedAt = DateTime.now();
    const startsAt = startedAt.plus({ milliseconds: this.firstRoundDelayMs });
    await game.merge({ status: "starting", startedAt, autoStartsAt: null }).save();

    // Notifier le lobby que la partie démarre
    transmit.broadcast(`game/${game.publicId}`, {
      event: "game_starting",
      startsAt: startsAt.toMillis(),
      serverNow: Date.now(),
    });
    if (game.mode === "public") this.broadcastPublicGamesChanged();

    // Démarrer le premier round après un court temps de chargement client.
    this.scheduleProgressSync(game.id, this.firstRoundDelayMs);

    return game;
  }

  async startRound(gameId: string, roundNumber: number): Promise<void> {
    const game = await Game.findOrFail(gameId);
    if (game.status === "finished" || game.status === "cancelled" || game.status === "paused") return;
    if (game.currentRound > roundNumber) return;

    const round = await Round.query()
      .where("game_id", gameId)
      .where("round_number", roundNumber)
      .firstOrFail();
    if (round.startsAt && !round.revealedAt) return;
    if (round.revealedAt) return;

    const startedRound = await this.roundService.startRound(
      round,
      game.roundDurationMs,
      this.roundPrerollMs,
    );
    await game.merge({ status: "active", currentRound: roundNumber }).save();
    if (game.mode === "public") this.broadcastPublicGamesChanged();

    // Broadcaster le round à tous les joueurs
    const serverNow = Date.now();
    const roundPayload = await this.roundService.buildClientPayload(
      startedRound,
      serverNow,
      game.answerMode,
      game.publicId,
    );
    transmit.broadcast(`game/${game.publicId}`, { event: "round_started", ...roundPayload });

    // Planifier la fin du round
    const endDelayMs = Math.max(0, (startedRound.endsAt?.toMillis() ?? Date.now()) - Date.now());
    this.scheduleProgressSync(game.id, endDelayMs);
  }

  async endRound(
    gameId: string,
    roundNumber: number,
    options: { force?: boolean } = {},
  ): Promise<void> {
    const game = await Game.findOrFail(gameId);
    if (game.status === "finished" || game.status === "cancelled" || game.status === "paused") return;
    if (game.currentRound !== roundNumber) return;

    const round = await Round.query()
      .where("game_id", gameId)
      .where("round_number", roundNumber)
      .preload("track")
      .firstOrFail();

    // Éviter la double exécution (solo : timer annulé mais callback déjà parti)
    if (round.revealedAt) return;
    if (!options.force && round.endsAt && round.endsAt > DateTime.now()) return;

    if (options.force && (!round.endsAt || round.endsAt > DateTime.now())) {
      await round.merge({ endsAt: DateTime.now() }).save();
    }

    await this.roundService.revealRound(round);

    // Broadcaster la révélation de la bonne réponse
    const revealPayload = this.roundService.buildRevealPayload(round);
    transmit.broadcast(`game/${game.publicId}`, { event: "round_revealed", ...revealPayload });

    if (roundNumber >= game.roundCount) {
      await this.finishGame(game.id);
    } else {
      // Pause entre les rounds (2s en solo, 5s en multi)
      const pause = game.mode === "solo" ? 2000 : 5000;
      this.scheduleProgressSync(game.id, pause);
    }
  }

  async finishGame(gameId: string): Promise<Game> {
    const game = await Game.query().where("id", gameId).preload("playlist").firstOrFail();
    const isOfficialGame = game.source === "blindmedley";
    this.clearProgressSync(game.id);

    const players = await GamePlayer.query().where("game_id", gameId).orderBy("score", "desc");

    // Assigner les rangs. Les playlists créées par les joueurs restent dans l'historique,
    // mais ne donnent pas d'XP et n'alimentent pas le classement.
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const rank = i + 1;
      const xpEarned = isOfficialGame
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
    let nextAutoStartsAt: DateTime | null = null;
    if (isOfficialGame) {
      const connectedCount = await this.connectedPlayerCount(game.id);
      nextAutoStartsAt =
        connectedCount > 0 ? DateTime.now().plus({ milliseconds: this.officialRestartDelayMs }) : null;
      await finishedGame.merge({ autoStartsAt: nextAutoStartsAt }).save();
      if (nextAutoStartsAt) {
        this.scheduleOfficialStart(
          game.id,
          Math.max(0, nextAutoStartsAt.toMillis() - DateTime.now().toMillis()),
        );
      }
    }

    const finishPayload: Record<string, string | number | null> = {
      event: "game_finished",
      nextGameId: game.publicId,
      nextAutoStartsAt: nextAutoStartsAt?.toMillis() ?? null,
    };

    transmit.broadcast(`game/${game.publicId}`, finishPayload);
    if (game.mode === "public") this.broadcastPublicGamesChanged();

    // Mettre à jour l'historique/statistiques joueur (non bloquant).
    // Sur partie joueur : pas d'XP, pas d'achievements, pas de leaderboard.
    for (const player of players) {
      this.xpService
        .awardXp(player.userId, player.xpEarned, player, {
          awardXp: isOfficialGame,
          achievements: isOfficialGame,
          leaderboard: isOfficialGame,
        })
        .catch(console.error);
    }

    return finishedGame;
  }

  async pauseGame(gameId: string): Promise<Game> {
    const game = await Game.findOrFail(gameId);
    if (game.status !== "starting" && game.status !== "active") return game;

    this.clearProgressSync(game.id);
    const pausedGame = await game.merge({ status: "paused", pausedAt: DateTime.now() }).save();
    transmit.broadcast(`game/${game.publicId}`, { event: "game_paused" });
    if (game.mode === "public") this.broadcastPublicGamesChanged();
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
      this.scheduleProgressSync(game.id, remainingMs);

      const roundPayload = await this.roundService.buildClientPayload(
        currentRound,
        Date.now(),
        game.answerMode,
        game.publicId,
      );
      transmit.broadcast(`game/${game.publicId}`, { event: "game_resumed", ...roundPayload });
    } else {
      transmit.broadcast(`game/${game.publicId}`, { event: "game_resumed" });
    }

    if (game.mode === "public") this.broadcastPublicGamesChanged();

    return resumedGame;
  }

  async stopGame(gameId: string): Promise<Game> {
    const game = await Game.query()
      .where("id", gameId)
      .whereNotIn("status", ["finished", "cancelled"])
      .firstOrFail();

    this.clearOfficialStart(game.id);
    this.clearProgressSync(game.id);
    const stoppedGame = await game
      .merge({ status: "cancelled", finishedAt: DateTime.now(), pausedAt: null, autoStartsAt: null })
      .save();
    transmit.broadcast(`game/${game.publicId}`, { event: "game_stopped" });
    if (game.mode === "public") this.broadcastPublicGamesChanged();
    return stoppedGame;
  }

  async reactivateGame(gameId: string): Promise<Game> {
    const game = await Game.query().where("id", gameId).where("status", "cancelled").firstOrFail();
    this.clearProgressSync(game.id);
    const rounds = await Round.query().where("game_id", game.id).select("id");
    const roundIds = rounds.map((round) => round.id);

    if (roundIds.length > 0) {
      await Answer.query().whereIn("round_id", roundIds).delete();
    }

    await Round.query()
      .where("game_id", game.id)
      .update({ startsAt: null, endsAt: null, revealedAt: null });

    await GamePlayer.query().where("game_id", game.id).update({
      score: 0,
      streak: 0,
      bestStreak: 0,
      correct: 0,
      incorrect: 0,
      rank: null,
      xpEarned: 0,
      isConnected: false,
      leftAt: null,
    });

    const reactivatedGame = await game
      .merge({
        status: "waiting",
        currentRound: 0,
        startedAt: null,
        finishedAt: null,
        pausedAt: null,
        winnerId: null,
        autoStartsAt: null,
      })
      .save();

    transmit.broadcast(`game/${game.publicId}`, { event: "game_reactivated" });
    if (game.mode === "public") this.broadcastPublicGamesChanged();
    return reactivatedGame;
  }

  async updateAdminGame(
    gameId: string,
    options: {
      name: string;
      answerMode: "choices" | "text";
      answerTarget: "title" | "artist" | "both" | "separate";
      difficulty: number;
      maxPlayers: number;
      roundCount: number;
    },
  ): Promise<Game> {
    const game = await Game.findOrFail(gameId);
    const canRegenerateRounds = game.status === "waiting" || game.status === "cancelled";
    const structuralChange =
      game.roundCount !== options.roundCount ||
      game.answerMode !== options.answerMode ||
      game.answerTarget !== options.answerTarget;

    if (!canRegenerateRounds && structuralChange) {
      throw new Error("GAME_ALREADY_STARTED");
    }

    if (canRegenerateRounds && game.roundCount !== options.roundCount) {
      const rounds = await Round.query().where("game_id", game.id).select("id");
      const roundIds = rounds.map((round) => round.id);
      if (roundIds.length > 0) {
        await Answer.query().whereIn("round_id", roundIds).delete();
      }
      await Round.query().where("game_id", game.id).delete();
      if (!game.playlistId) throw new Error("PLAYLIST_REQUIRED");
      await this.roundService.pregenerateRounds(game.id, game.playlistId, options.roundCount);
    }

    const updatedGame = await game
      .merge({
        name: options.name,
        answerMode: options.answerMode,
        answerTarget: options.answerTarget,
        difficulty: options.difficulty,
        maxPlayers: options.maxPlayers,
        roundCount: options.roundCount,
        roundDurationMs: this.durationByDifficulty[options.difficulty] ?? game.roundDurationMs,
      })
      .save();

    transmit.broadcast(`game/${game.publicId}`, { event: "game_updated" });
    if (game.mode === "public") this.broadcastPublicGamesChanged();
    return updatedGame;
  }

  async deleteGame(gameId: string): Promise<void> {
    const game = await Game.findOrFail(gameId);
    const publicId = game.publicId;
    const wasPublic = game.mode === "public";
    this.clearOfficialStart(game.id);
    this.clearProgressSync(game.id);
    await game.delete();
    if (publicId) transmit.broadcast(`game/${publicId}`, { event: "game_deleted" });
    if (wasPublic) this.broadcastPublicGamesChanged();
  }

  async getGameState(gameId: string) {
    await this.syncGameProgress(gameId);
    await this.ensureOfficialRestartCountdown(gameId);

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

  async syncGameProgress(gameId: string): Promise<void> {
    const game = await Game.find(gameId);
    if (!game) return;
    const now = DateTime.now();

    if (game.status === "cancelled" || game.status === "paused") {
      this.clearProgressSync(game.id);
      return;
    }

    if (game.status === "finished") {
      if (game.source !== "blindmedley") return;
      await this.ensureOfficialRestartCountdown(game.id);
      const refreshedGame = await Game.find(game.id);
      if (!refreshedGame?.autoStartsAt) return;

      const delayMs = refreshedGame.autoStartsAt.toMillis() - DateTime.now().toMillis();
      if (delayMs <= 0) {
        await this.startOfficialGameIfReady(game.id);
      } else {
        this.scheduleOfficialStart(game.id, delayMs);
      }
      return;
    }

    if (game.status === "waiting") {
      if (game.source !== "blindmedley" || !game.autoStartsAt) return;
      const delayMs = game.autoStartsAt.toMillis() - now.toMillis();
      if (delayMs <= 0) {
        await this.startOfficialGameIfReady(game.id);
      } else {
        this.scheduleOfficialStart(game.id, delayMs);
      }
      return;
    }

    if (game.status === "starting") {
      const startsAt = (game.startedAt ?? now).plus({ milliseconds: this.firstRoundDelayMs });
      const delayMs = startsAt.toMillis() - now.toMillis();
      if (delayMs > 0) {
        this.scheduleProgressSync(game.id, delayMs);
        return;
      }
      await this.startRound(game.id, game.currentRound > 0 ? game.currentRound : 1);
      return;
    }

    if (game.status !== "active" || game.currentRound <= 0) return;

    const round = await Round.query()
      .where("game_id", game.id)
      .where("round_number", game.currentRound)
      .first();
    if (!round) return;

    if (!round.startsAt || !round.endsAt) {
      await this.startRound(game.id, round.roundNumber);
      return;
    }

    if (!round.revealedAt && round.endsAt && round.endsAt <= now) {
      await this.endRound(game.id, round.roundNumber);
      return;
    }

    if (!round.revealedAt) {
      this.scheduleProgressSync(game.id, round.endsAt.toMillis() - now.toMillis());
      return;
    }

    if (round.roundNumber >= game.roundCount) {
      await this.finishGame(game.id);
      return;
    }

    const pauseMs = game.mode === "solo" ? 2_000 : 5_000;
    const nextRoundAt = round.revealedAt.plus({ milliseconds: pauseMs });
    const delayMs = nextRoundAt.toMillis() - now.toMillis();
    if (delayMs <= 0) {
      await this.startRound(game.id, round.roundNumber + 1);
      return;
    }

    this.scheduleProgressSync(game.id, delayMs);
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
      choiceToken: params.choiceToken ?? null,
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
      setTimeout(
        () => this.endRound(game.id, params.roundNumber, { force: true }).catch(console.error),
        1500,
      );
    }

    return result;
  }

  private async connectedPlayerCount(gameId: string): Promise<number> {
    const connected = await GamePlayer.query()
      .where("game_id", gameId)
      .where("is_connected", true)
      .count("* as total");

    return Number(connected[0].$extras.total);
  }

  private scheduleOfficialStart(gameId: string, delayMs: number): void {
    this.clearOfficialStart(gameId);

    const timer = setTimeout(() => {
      this.startOfficialGameIfReady(gameId).catch(console.error);
    }, Math.max(0, delayMs));

    this.officialStartTimers.set(gameId, timer);
  }

  private scheduleProgressSync(gameId: string, delayMs: number): void {
    this.clearProgressSync(gameId);

    const timer = setTimeout(() => {
      this.gameProgressTimers.delete(gameId);
      this.syncGameProgress(gameId).catch(console.error);
    }, Math.max(0, delayMs));

    this.gameProgressTimers.set(gameId, timer);
  }

  private clearOfficialStart(gameId: string): void {
    const timer = this.officialStartTimers.get(gameId);
    if (!timer) return;
    clearTimeout(timer);
    this.officialStartTimers.delete(gameId);
  }

  private clearProgressSync(gameId: string): void {
    const timer = this.gameProgressTimers.get(gameId);
    if (!timer) return;
    clearTimeout(timer);
    this.gameProgressTimers.delete(gameId);
  }

  private broadcastLobbyChanged(publicId: string | null): void {
    if (!publicId) return;
    transmit.broadcast(`game/${publicId}`, { event: "players_updated" });
  }

  private broadcastPublicGamesChanged(): void {
    transmit.broadcast("games/public", { event: "public_games_changed" });
  }

  private async startOfficialGameIfReady(gameId: string): Promise<void> {
    this.clearOfficialStart(gameId);

    const game = await Game.query()
      .where("id", gameId)
      .where("source", "blindmedley")
      .whereIn("status", ["waiting", "finished"])
      .first();
    if (!game) return;

    const connectedCount = await this.connectedPlayerCount(game.id);
    if (connectedCount < 1) {
      await game
        .merge({
          status: "waiting",
          currentRound: 0,
          autoStartsAt: null,
          startedAt: null,
          finishedAt: null,
          pausedAt: null,
          winnerId: null,
        })
        .save();
      transmit.broadcast(`game/${game.publicId}`, { event: "official_countdown_cancelled" });
      this.broadcastLobbyChanged(game.publicId);
      this.broadcastPublicGamesChanged();
      return;
    }

    if (game.status === "finished") {
      await this.prepareOfficialGameRestart(game);
    }

    if (!game.hostId) return;
    await this.startGame(game.id, game.hostId, { force: true, allowSinglePlayer: true });
  }

  private async ensureOfficialRestartCountdown(gameId: string): Promise<void> {
    const game = await Game.query()
      .where("id", gameId)
      .where("source", "blindmedley")
      .where("status", "finished")
      .first();
    if (!game || game.autoStartsAt) return;

    if ((await this.connectedPlayerCount(game.id)) < 1) return;

    const autoStartsAt = DateTime.now().plus({ milliseconds: this.officialRestartDelayMs });
    await game.merge({ autoStartsAt }).save();
    this.scheduleOfficialStart(game.id, this.officialRestartDelayMs);
    transmit.broadcast(`game/${game.publicId}`, {
      event: "game_finished",
      nextGameId: game.publicId,
      nextAutoStartsAt: autoStartsAt.toMillis(),
    });
    this.broadcastPublicGamesChanged();
  }

  private async prepareOfficialGameRestart(game: Game): Promise<void> {
    if (!game.playlistId) return;
    this.clearProgressSync(game.id);

    const rounds = await Round.query().where("game_id", game.id).select("id");
    const roundIds = rounds.map((round) => round.id);
    if (roundIds.length > 0) {
      await Answer.query().whereIn("round_id", roundIds).delete();
      await Round.query().whereIn("id", roundIds).delete();
    }

    await GamePlayer.query().where("game_id", game.id).update({
      score: 0,
      streak: 0,
      bestStreak: 0,
      correct: 0,
      incorrect: 0,
      rank: null,
      xpEarned: 0,
      leftAt: null,
    });

    await this.roundService.pregenerateRounds(game.id, game.playlistId, game.roundCount);

    await game
      .merge({
        status: "waiting",
        currentRound: 0,
        startedAt: null,
        finishedAt: null,
        pausedAt: null,
        winnerId: null,
        autoStartsAt: null,
      })
      .save();

    transmit.broadcast(`game/${game.publicId}`, { event: "official_game_reset" });
    this.broadcastLobbyChanged(game.publicId);
    this.broadcastPublicGamesChanged();
  }

  private generatePublicId(): string {
    return crypto.randomBytes(6).toString("hex"); // 12 hex chars
  }

  private generateCode(): string {
    return crypto.randomBytes(3).toString("hex").toUpperCase();
  }
}
