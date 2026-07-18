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
  /**
   * La manche est annoncée avant son début. Ce délai laisse le navigateur
   * charger l'extrait sans entamer le chronomètre de jeu.
   */
  private readonly firstRoundPrerollMs = 4_000;
  private readonly nextRoundPrerollMs = 2_000;
  /** Un filet de sécurité après un redémarrage, pas le moteur temps réel. */
  private readonly lifecycleRecoveryMs = 60_000;
  private readonly presenceGraceMs = 45_000;
  /**
   * Une partie ne possède qu'une seule échéance active. Cela évite qu'un ancien
   * timeout de révélation, de pause ou de relance puisse se déclencher après
   * qu'une nouvelle phase a déjà été programmée.
   */
  private readonly transitionTimers = new Map<
    string,
    { timer: ReturnType<typeof setTimeout>; kind: "official" | "progress" }
  >();
  private readonly progressingGameIds = new Set<string>();
  private lifecycleRecoveryTimer: ReturnType<typeof setInterval> | null = null;
  private lifecycleStarted = false;
  private lifecycleRecoveryInFlight = false;

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

  /**
   * Démarre l'ordonnanceur unique du processus. Les pages HTTP ne font que
   * lire l'état ; les changements de phase viennent uniquement d'ici.
   */
  async startLifecycle(): Promise<void> {
    if (this.lifecycleStarted) return;
    this.lifecycleStarted = true;

    await GamePlayer.query()
      .where("is_connected", true)
      .whereNull("last_seen_at")
      .update({ lastSeenAt: DateTime.now() });
    await this.cleanupDuplicateOfficialGames();
    await this.runLifecycleRecovery();
    this.lifecycleRecoveryTimer = setInterval(() => {
      this.runLifecycleRecovery().catch(console.error);
    }, this.lifecycleRecoveryMs);
  }

  stopLifecycle(): void {
    this.lifecycleStarted = false;
    if (this.lifecycleRecoveryTimer) {
      clearInterval(this.lifecycleRecoveryTimer);
      this.lifecycleRecoveryTimer = null;
    }

    for (const gameId of this.transitionTimers.keys()) this.clearTransition(gameId);
  }

  private async recoverLifecycle(): Promise<void> {
    const games = await Game.query()
      .whereIn("status", ["waiting", "starting", "active", "finished"])
      .select(["id"]);

    // Les timestamps stockés en base restent la source de vérité. Au démarrage
    // ou après une longue suspension, cette passe remet chaque échéance en
    // route ; en fonctionnement normal les timeouts ci-dessous suffisent.
    await Promise.all(games.map((game) => this.syncGameProgress(game.id)));
  }

  private async runLifecycleRecovery(): Promise<void> {
    if (this.lifecycleRecoveryInFlight) return;
    this.lifecycleRecoveryInFlight = true;
    try {
      await this.expireStalePlayers();
      await this.recoverLifecycle();
    } finally {
      this.lifecycleRecoveryInFlight = false;
    }
  }

  private async expireStalePlayers(): Promise<void> {
    const staleBefore = DateTime.now().minus({ milliseconds: this.presenceGraceMs });
    const stalePlayers = await GamePlayer.query()
      .where("is_connected", true)
      .where((query) => {
        query.where("last_seen_at", "<", staleBefore.toSQL()!).orWhereNull("last_seen_at");
      })
      .select(["gameId", "userId"]);

    for (const player of stalePlayers) {
      await this.leaveGame(player.gameId, player.userId);
    }
  }

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
    try {
      const playerIds = new Set(options.initialPlayerIds ?? []);

      if (options.addHost !== false) {
        playerIds.delete(options.hostId);
        await GamePlayer.create({
          gameId: game.id,
          userId: options.hostId,
          joinedAt: DateTime.now(),
          lastSeenAt: DateTime.now(),
        });
      }

      if (playerIds.size > 0) {
        await GamePlayer.createMany(
          [...playerIds].map((userId) => ({
            gameId: game.id,
            userId,
            joinedAt: DateTime.now(),
            lastSeenAt: DateTime.now(),
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
    } catch (error) {
      this.clearOfficialStart(game.id);
      this.clearProgressSync(game.id);
      await game.delete();
      throw error;
    }

    if (game.mode === "public") this.broadcastPublicGamesChanged();

    return game;
  }

  async leaveGame(gameId: string, userId: string): Promise<void> {
    const game = await Game.findOrFail(gameId);
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
        if (game.status === "finished") {
          await this.prepareOfficialGameRestart(game);
          return;
        }
        if (game.status === "waiting") {
          await game.merge({ autoStartsAt: null }).save();
          transmit.broadcast(`game/${game.publicId}`, { event: "official_countdown_cancelled" });
        }
        this.broadcastLobbyChanged(game.publicId);
        this.broadcastPublicGamesChanged();
        return;
      }
      // Plus personne → annuler la partie
      if (game.status === "finished" || game.status === "cancelled") return;

      if (
        game.mode === "public" &&
        (game.status === "starting" || game.status === "active" || game.status === "paused")
      ) {
        this.broadcastLobbyChanged(game.publicId);
        this.broadcastPublicGamesChanged();
        return;
      }

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
      ? await existing.merge({ isConnected: true, leftAt: null, lastSeenAt: DateTime.now() }).save()
      : await GamePlayer.create({
          gameId,
          userId,
          joinedAt: DateTime.now(),
          lastSeenAt: DateTime.now(),
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
    await this.heartbeatPlayer(gameId, userId);
  }

  async heartbeatPlayer(gameId: string, userId: string): Promise<void> {
    const player = await GamePlayer.query()
      .where("game_id", gameId)
      .where("user_id", userId)
      .first();
    if (!player) return;

    const wasConnected = player.isConnected;
    await player.merge({ isConnected: true, leftAt: null, lastSeenAt: DateTime.now() }).save();
    if (wasConnected) return;

    const game = await Game.find(gameId);
    if (!game) return;

    if (game.source === "blindmedley" && game.status === "waiting" && !game.autoStartsAt) {
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
  }

  async syncOfficialGames(): Promise<void> {
    const games = await Game.query()
      .where("source", "blindmedley")
      .whereIn("status", ["waiting", "starting", "active", "finished"])
      .select(["id"]);

    await Promise.all(games.map((game) => this.syncGameProgress(game.id)));
  }

  async deleteEmptyPlayerGames(): Promise<void> {
    const games = await Game.query()
      .where("status", "waiting")
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
      .whereIn("status", ["waiting", "starting", "active", "paused"])
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
    const claimed = await Game.query()
      .where("id", game.id)
      .where("status", "waiting")
      .update({ status: "starting", startedAt: DateTime.now(), autoStartsAt: null });
    if (claimed.length === 0) return Game.findOrFail(game.id);

    // Notifier le lobby que la partie démarre
    transmit.broadcast(`game/${game.publicId}`, {
      event: "game_starting",
      serverNow: Date.now(),
    });
    if (game.mode === "public") this.broadcastPublicGamesChanged();

    // Démarrer le premier round après un court temps de chargement client.
    await this.startRound(game.id, 1);

    return Game.findOrFail(game.id);
  }

  async startRound(gameId: string, roundNumber: number): Promise<void> {
    const game = await Game.findOrFail(gameId);
    if (game.status === "finished" || game.status === "cancelled" || game.status === "paused")
      return;
    if (game.currentRound > roundNumber) return;

    const prerollMs = roundNumber === 1 ? this.firstRoundPrerollMs : this.nextRoundPrerollMs;
    const startsAt = DateTime.now().plus({ milliseconds: prerollMs });
    const endsAt = startsAt.plus({ milliseconds: game.roundDurationMs });
    const claimed = await Round.query()
      .where("game_id", gameId)
      .where("round_number", roundNumber)
      .whereNull("starts_at")
      .whereNull("revealed_at")
      .update({ startsAt, endsAt });
    if (claimed.length === 0) return;

    const startedRound = await Round.query()
      .where("game_id", gameId)
      .where("round_number", roundNumber)
      .preload("track")
      .firstOrFail();
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
    if (game.status === "finished" || game.status === "cancelled" || game.status === "paused")
      return;
    if (game.currentRound !== roundNumber) return;

    const now = DateTime.now();
    const claim = Round.query()
      .where("game_id", gameId)
      .where("round_number", roundNumber)
      .whereNull("revealed_at");
    if (!options.force) claim.where("ends_at", "<=", now.toSQL()!);

    const claimed = await claim.update({
      revealedAt: now,
      ...(options.force ? { endsAt: now } : {}),
    });
    if (claimed.length === 0) return;

    const round = await Round.query()
      .where("game_id", gameId)
      .where("round_number", roundNumber)
      .preload("track")
      .firstOrFail();

    // Éviter la double exécution (solo : timer annulé mais callback déjà parti)

    // Broadcaster la révélation de la bonne réponse
    const revealPayload = this.roundService.buildRevealPayload(round);
    transmit.broadcast(`game/${game.publicId}`, {
      event: "round_revealed",
      ...revealPayload,
      serverNow: Date.now(),
    });

    if (roundNumber >= game.roundCount) {
      await this.finishGame(game.id);
    } else {
      const pause = this.betweenRoundPauseMs(game.mode);
      this.scheduleProgressSync(game.id, pause);
    }
  }

  async finishGame(gameId: string): Promise<Game> {
    const initialGame = await Game.findOrFail(gameId);
    this.clearProgressSync(initialGame.id);

    const claimed = await Game.query()
      .where("id", gameId)
      .whereIn("status", ["active", "starting"])
      .update({ status: "finished", finishedAt: DateTime.now(), pausedAt: null });
    if (claimed.length === 0) return Game.findOrFail(gameId);

    const game = await Game.query().where("id", gameId).preload("playlist").firstOrFail();
    const isOfficialGame = game.source === "blindmedley";

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
    const finishedGame = await game.merge({ winnerId: winner?.userId ?? null }).save();

    // Broadcaster en premier — la partie est terminée quoi qu'il arrive
    let nextAutoStartsAt: DateTime | null = null;
    if (isOfficialGame) {
      const connectedCount = await this.connectedPlayerCount(game.id);
      nextAutoStartsAt =
        connectedCount > 0
          ? DateTime.now().plus({ milliseconds: this.officialRestartDelayMs })
          : null;
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

    // Une partie officielle vide doit rester disponible dans l'onglet Public.
    // On réinitialise immédiatement son cycle sans lui attribuer de compte à rebours.
    if (isOfficialGame && !nextAutoStartsAt) {
      await this.prepareOfficialGameRestart(finishedGame);
      return Game.findOrFail(gameId);
    }

    return finishedGame;
  }

  async pauseGame(gameId: string): Promise<Game> {
    const game = await Game.findOrFail(gameId);
    if (game.status !== "starting" && game.status !== "active") return game;

    this.clearProgressSync(game.id);
    const pausedGame = await game.merge({ status: "paused", pausedAt: DateTime.now() }).save();
    transmit.broadcast(`game/${game.publicId}`, {
      event: "game_paused",
      serverNow: Date.now(),
    });
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

      if (currentRound?.revealedAt) {
        await currentRound
          .merge({ revealedAt: currentRound.revealedAt.plus({ milliseconds: pauseMs }) })
          .save();
      } else if (currentRound?.endsAt) {
        await currentRound
          .merge({
            startsAt:
              currentRound.startsAt?.plus({ milliseconds: pauseMs }) ?? currentRound.startsAt,
            endsAt: currentRound.endsAt.plus({ milliseconds: pauseMs }),
          })
          .save();
      }
    }

    if (!currentRound) {
      const resumedGame = await game.merge({ status: "starting", pausedAt: null }).save();
      transmit.broadcast(`game/${game.publicId}`, { event: "game_resumed" });
      await this.startRound(game.id, game.currentRound > 0 ? game.currentRound : 1);
      return Game.findOrFail(resumedGame.id);
    }

    const resumedGame = await game.merge({ status: "active", pausedAt: null }).save();

    if (currentRound.revealedAt) {
      const pause = this.betweenRoundPauseMs(game.mode);
      const remainingMs = Math.max(
        0,
        currentRound.revealedAt.plus({ milliseconds: pause }).toMillis() - now.toMillis(),
      );
      this.scheduleProgressSync(game.id, remainingMs);
      transmit.broadcast(`game/${game.publicId}`, { event: "game_resumed" });
    } else if (currentRound.endsAt) {
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
      .merge({
        status: "cancelled",
        finishedAt: DateTime.now(),
        pausedAt: null,
        autoStartsAt: null,
      })
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
    if (this.progressingGameIds.has(gameId)) return;
    this.progressingGameIds.add(gameId);

    try {
      await this.syncGameProgressUnsafe(gameId);
    } finally {
      this.progressingGameIds.delete(gameId);
    }
  }

  private async syncGameProgressUnsafe(gameId: string): Promise<void> {
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

    const pauseMs = this.betweenRoundPauseMs(game.mode);
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
        .where("is_connected", true)
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
    if (!result.partial) {
      transmit.broadcast(`game/${game.publicId}`, {
        event: "answer_submitted",
        userId: params.userId,
        roundNumber: params.roundNumber,
        responseMs: result.responseMs,
        isCorrect: result.correct,
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

  private betweenRoundPauseMs(mode: string): number {
    return mode === "solo" ? 1_500 : 3_000;
  }

  private async connectedPlayerCount(gameId: string): Promise<number> {
    const connected = await GamePlayer.query()
      .where("game_id", gameId)
      .where("is_connected", true)
      .count("* as total");

    return Number(connected[0].$extras.total);
  }

  private scheduleOfficialStart(gameId: string, delayMs: number): void {
    this.scheduleTransition(gameId, delayMs, "official");
  }

  private scheduleProgressSync(gameId: string, delayMs: number): void {
    this.scheduleTransition(gameId, delayMs, "progress");
  }

  private clearOfficialStart(gameId: string): void {
    this.clearTransition(gameId, "official");
  }

  private clearProgressSync(gameId: string): void {
    this.clearTransition(gameId, "progress");
  }

  private scheduleTransition(gameId: string, delayMs: number, kind: "official" | "progress"): void {
    this.clearTransition(gameId);

    const timer = setTimeout(
      () => {
        // clearTimeout ne peut pas arrêter un callback déjà placé dans la file
        // d'événements. Cette garde élimine donc les anciennes échéances.
        if (this.transitionTimers.get(gameId)?.timer !== timer) return;
        this.transitionTimers.delete(gameId);
        this.syncGameProgress(gameId).catch(console.error);
      },
      Math.max(0, delayMs),
    );

    this.transitionTimers.set(gameId, { timer, kind });
  }

  private clearTransition(gameId: string, kind?: "official" | "progress"): void {
    const scheduled = this.transitionTimers.get(gameId);
    if (!scheduled || (kind && scheduled.kind !== kind)) return;
    clearTimeout(scheduled.timer);
    this.transitionTimers.delete(gameId);
  }

  private broadcastLobbyChanged(publicId: string | null): void {
    if (!publicId) return;
    void this.broadcastLobbyPlayers(publicId).catch(console.error);
  }

  private async broadcastLobbyPlayers(publicId: string): Promise<void> {
    const game = await Game.query().where("public_id", publicId).select("id").first();
    if (!game) return;

    const players = await GamePlayer.query()
      .where("game_id", game.id)
      .preload("user", (query) => query.preload("profile"))
      .orderBy("joined_at", "asc");

    transmit.broadcast(`game/${publicId}`, {
      event: "players_updated",
      players: players.map((player) => ({
        id: player.id,
        gameId: player.gameId,
        userId: player.userId,
        score: player.score,
        correct: player.correct,
        incorrect: player.incorrect,
        streak: player.streak,
        bestStreak: player.bestStreak,
        rank: player.rank,
        xpEarned: player.xpEarned,
        isConnected: player.isConnected,
        joinedAt: player.joinedAt.toISO(),
        leftAt: player.leftAt?.toISO() ?? null,
        username: displayUsernameForUser({
          username: player.user?.profile?.username,
          fullName: player.user?.fullName,
          fallback: `User${player.userId}`,
        }),
        avatarUrl: player.user?.profile?.avatarUrl ?? null,
      })),
    });
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
