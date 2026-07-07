import type { HttpContext } from "@adonisjs/core/http";
import Game from "#models/game";
import GamePlayer from "#models/game_player";
import Playlist from "#models/playlist";
import Round from "#models/round";
import Answer from "#models/answer";
import TrackCache from "#models/track_cache";
import type User from "#models/user";
import { GameService } from "#services/game_service";
import { RoundService } from "#services/round_service";
import { DeezerService } from "#services/deezer_service";
import { PlaylistAccessService } from "#services/playlist_access_service";
import { SpotifyService } from "#services/spotify_service";
import { sanitizeTrackText } from "#services/track_sanitizer";
import { displayUsernameForUser } from "#services/display_name";
import AnswerTransformer from "#transformers/answer_transformer";
import GamePlayerTransformer from "#transformers/game_player_transformer";
import GameTransformer from "#transformers/game_transformer";
import {
  createGameValidator,
  gameTrackSearchValidator,
  joinGameValidator,
  submitAnswerValidator,
} from "#validators/game_validators";
import { inject } from "@adonisjs/core";
import { DateTime } from "luxon";

@inject()
export default class GameController {
  constructor(
    private readonly gameService: GameService,
    private readonly roundService: RoundService,
    private readonly deezerService: DeezerService,
    private readonly spotifyService: SpotifyService,
    private readonly playlistAccess: PlaylistAccessService,
  ) {}

  // ── Résoudre un publicId → Game (lève 404 si introuvable) ─────────────
  private async resolveGame(publicId: string): Promise<Game> {
    return Game.query().where("public_id", publicId).firstOrFail();
  }

  // Page de création / liste des parties publiques
  async index({ inertia, auth }: HttpContext) {
    const user = auth.user!;

    const [playlists, publicGames, activePlayer] = await Promise.all([
      this.playlistAccess
        .forUser(Playlist.query().where("is_active", true), user)
        .orderBy("created_at", "desc")
        .preload("tracks", (query) => {
          query
            .where("has_preview", true)
            .whereNotNull("preview_url")
            .orderBy("playlist_tracks.position", "asc");
        }),
      Game.query()
        .where("mode", "public")
        .where("status", "waiting")
        .orderBy("created_at", "desc")
        .preload("playlist")
        .preload("host", (query) => query.preload("profile"))
        .preload("players", (query) => query.where("is_connected", true)),
      GamePlayer.query()
        .where("user_id", user.id)
        .where("is_connected", true)
        .whereHas("game", (query) => query.whereIn("status", ["waiting", "starting", "active"]))
        .preload("game")
        .first(),
    ]);

    return inertia.render("game/index", {
      playlists: playlists.map((playlist) => ({
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        coverUrl: playlist.coverUrl,
        genre: playlist.genre,
        trackCount: playlist.tracks.length,
        tracks: playlist.tracks.map((track) => ({
          id: track.id,
          title: track.title,
          artist: track.artist,
          album: track.album,
          coverUrl: track.coverUrl,
          hasPreview: track.hasPreview,
        })),
      })),
      publicGames: GameTransformer.transform(publicGames, user.id),
      myActiveGameId: activePlayer?.game?.publicId ?? null,
    });
  }

  // Créer une partie
  async create({ request, auth, response, session }: HttpContext) {
    const payload = await request.validateUsing(createGameValidator);
    const user = auth.user!;
    const playlistIds = [
      ...new Set([...(payload.playlistIds ?? []), payload.playlistId].filter(Boolean)),
    ] as string[];
    const trackIds = [...new Set(payload.trackIds ?? [])];

    let playlistId: string;
    try {
      playlistId = await this.resolveCreationPlaylist({
        user,
        playlistIds,
        trackIds,
        roundCount: payload.roundCount ?? 10,
      });
    } catch (error) {
      session.flash("error", error instanceof Error ? error.message : "Impossible de créer la partie.");
      return response.redirect().back();
    }

    const game = await this.gameService.createGame({ ...payload, playlistId, hostId: user.id });

    return response.redirect().toRoute("game.lobby", { id: game.publicId! });
  }

  async createStarterPlaylist({ response, session }: HttpContext) {
    await this.deezerService.importStarterPlaylist();
    session.flash("success", "Playlist de démarrage prête. Tu peux maintenant lancer une partie.");

    return response.redirect().toRoute("playlists.index");
  }

  async searchTracks({ request, response }: HttpContext) {
    const { query } = await request.validateUsing(gameTrackSearchValidator, { data: request.qs() });
    const [cachedTracks, deezerTracks, spotifyTracks] = await Promise.all([
      TrackCache.query()
        .where("has_preview", true)
        .whereNotNull("preview_url")
        .where((trackQuery) => {
          trackQuery.whereILike("title", `%${query}%`).orWhereILike("artist", `%${query}%`);
        })
        .limit(8),
      this.deezerService.searchTracks(query, 8).catch(() => []),
      this.spotifyService.searchTracks(query, 8).catch(() => []),
    ]);

    const tracks = new Map<string, TrackCache>();
    for (const track of cachedTracks) tracks.set(this.trackKey(track.title, track.artist), track);

    for (const track of deezerTracks) {
      const title = sanitizeTrackText(track.title);
      const artist = sanitizeTrackText(track.artist.name);
      const key = this.trackKey(title, artist);
      if (tracks.has(key)) continue;

      const record = await TrackCache.updateOrCreate(
        { spotifyId: `deezer:${track.id}` },
        {
          title,
          artist,
          album: sanitizeTrackText(track.album.title ?? null),
          previewUrl: track.preview || null,
          coverUrl: track.album.cover_medium ?? null,
          durationMs: track.duration * 1000,
          releaseYear: track.album.release_date
            ? Number.parseInt(track.album.release_date.substring(0, 4))
            : null,
          hasPreview: Boolean(track.preview),
          metadata: JSON.stringify(track),
          cachedAt: DateTime.now(),
          expiresAt: DateTime.now().plus({ days: 30 }),
        },
      );
      if (record.hasPreview) tracks.set(key, record);
    }

    for (const track of spotifyTracks) {
      const title = sanitizeTrackText(track.name);
      const artist = sanitizeTrackText(track.artists.map((item) => item.name).join(", "));
      const key = this.trackKey(title, artist);
      if (tracks.has(key)) continue;

      const previewUrl = track.preview_url ?? (await this.spotifyService.getDeezerPreview(title, artist));
      const record = await TrackCache.updateOrCreate(
        { spotifyId: track.id },
        {
          title,
          artist,
          album: sanitizeTrackText(track.album?.name ?? null),
          previewUrl,
          coverUrl: track.album?.images?.[0]?.url ?? null,
          durationMs: track.duration_ms,
          releaseYear: track.album?.release_date
            ? Number.parseInt(track.album.release_date.substring(0, 4))
            : null,
          hasPreview: Boolean(previewUrl),
          metadata: JSON.stringify(track),
          cachedAt: DateTime.now(),
          expiresAt: DateTime.now().plus({ days: 30 }),
        },
      );
      if (record.hasPreview) tracks.set(key, record);
    }

    return response.json({
      results: [...tracks.values()].slice(0, 12).map((track) => ({
        id: track.id,
        title: track.title,
        artist: track.artist,
        album: track.album,
        coverUrl: track.coverUrl,
      })),
    });
  }

  // Page lobby d'une partie
  async lobby({ inertia, params, auth }: HttpContext) {
    const resolved = await this.resolveGame(params.id);
    const { game } = await this.gameService.getGameState(resolved.id);

    const isPlayer = game.players.some((p) => p.userId === auth.user!.id);
    if (!isPlayer && game.mode !== "public") {
      return inertia.render("errors/not_found", {});
    }

    return inertia.render("game/lobby", {
      game: GameTransformer.transform(game, auth.user!.id),
      isHost: game.hostId === auth.user!.id,
      canModerate: auth.user!.isModerator,
    });
  }

  // Rejoindre une partie publique ou avec un code
  async join({ request, params, auth, response, session }: HttpContext) {
    const { code } = await request.validateUsing(joinGameValidator);
    let game: Game;

    if (code) {
      const found = await Game.query().where("code", code).where("status", "waiting").first();
      if (!found) {
        session.flash("error", "Code de partie invalide ou partie démarrée");
        return response.redirect().back();
      }
      game = found;
    } else {
      game = await this.resolveGame(params.id);
    }

    await this.gameService.joinGame(game.id, auth.user!.id);
    return response.redirect().toRoute("game.lobby", { id: game.publicId! });
  }

  // Démarrer la partie (hôte seulement)
  async start({ params, auth, response }: HttpContext) {
    const game = await this.resolveGame(params.id);
    const user = auth.user!;
    const isHost = game.hostId === user.id;
    if (!isHost && !user.isModerator) return response.forbidden();
    await this.gameService.startGame(game.id, user.id, { force: !isHost && user.isModerator });
    return response.redirect().toRoute("game.play", { id: params.id });
  }

  async pause({ params, auth, response }: HttpContext) {
    if (!auth.user!.isModerator) return response.forbidden();
    await this.gameService.pauseGame((await this.resolveGame(params.id)).id);
    return response.redirect().back();
  }

  async resume({ params, auth, response }: HttpContext) {
    if (!auth.user!.isModerator) return response.forbidden();
    await this.gameService.resumeGame((await this.resolveGame(params.id)).id);
    return response.redirect().back();
  }

  async stop({ params, auth, response }: HttpContext) {
    if (!auth.user!.isModerator) return response.forbidden();
    await this.gameService.stopGame((await this.resolveGame(params.id)).id);
    return response.redirect().toRoute("game.index");
  }

  async destroy({ params, auth, response }: HttpContext) {
    if (!auth.user!.isModerator) return response.forbidden();
    await this.gameService.deleteGame((await this.resolveGame(params.id)).id);
    return response.redirect().toRoute("game.index");
  }

  // Page de jeu
  async play({ inertia, params, auth }: HttpContext) {
    const resolved = await this.resolveGame(params.id);
    const { game, currentRound } = await this.gameService.getGameState(resolved.id);

    const isPlayer = game.players.some((p) => p.userId === auth.user!.id);
    if (!isPlayer) {
      return inertia.render("errors/not_found", {});
    }

    if (game.status === "finished") {
      return inertia.location(`/game/${params.id}/results`);
    }
    if (game.status === "cancelled") {
      return inertia.location("/game");
    }

    const myPlayer = game.players.find((p) => p.userId === auth.user!.id)!;

    let roundPayload = null;
    if (currentRound && currentRound.startsAt) {
      const serverNow = Date.now();
      roundPayload = await this.roundService.buildClientPayload(
        currentRound,
        serverNow,
        game.answerMode,
      );

      const answered = await GamePlayer.query()
        .where("id", myPlayer.id)
        .whereHas("answers", (q) => q.where("round_id", currentRound.id).where("is_correct", true))
        .first();
      (roundPayload as Record<string, unknown>).alreadyAnswered = Boolean(answered);
    }

    return inertia.render("game/play", {
      game: GameTransformer.transform(game, auth.user!.id),
      myPlayer: GamePlayerTransformer.transform(myPlayer, auth.user!.id),
      round: roundPayload,
      history: await this.getHistory(resolved.id),
      serverNow: Date.now(),
      canModerate: auth.user!.isModerator,
    });
  }

  // Soumettre une réponse
  async answer({ request, params, auth, response }: HttpContext) {
    const resolved = await this.resolveGame(params.id);
    const payload = await request.validateUsing(submitAnswerValidator);

    const result = await this.gameService.submitAnswer({
      ...payload,
      gameId: resolved.id,
      userId: auth.user!.id,
    });

    if (request.accepts(["json"])) {
      return response.json({ success: true, ...result });
    }

    return response.redirect().toRoute("game.play", { id: params.id });
  }

  // Quitter une partie
  async leave({ params, auth, response }: HttpContext) {
    const resolved = await this.resolveGame(params.id);
    await this.gameService.leaveGame(resolved.id, auth.user!.id);
    return response.json({ ok: true });
  }

  // Page résultats
  async results({ inertia, params, auth }: HttpContext) {
    const game = await Game.query()
      .where("public_id", params.id)
      .where("status", "finished")
      .preload("players", (q) => q.orderBy("rank").preload("user", (uq) => uq.preload("profile")))
      .preload("playlist")
      .firstOrFail();

    const myPlayer = game.players.find((p) => p.userId === auth.user!.id);

    return inertia.render("game/results", {
      game: GameTransformer.transform(game, auth.user!.id),
      players: GamePlayerTransformer.transform(game.players, auth.user!.id),
      myXpEarned: myPlayer?.xpEarned ?? 0,
      history: await this.getHistory(game.id),
    });
  }

  // API: état courant de la partie (polling)
  async replay({ params, auth, response }: HttpContext) {
    const previousGame = await Game.query()
      .where("public_id", params.id)
      .where("status", "finished")
      .firstOrFail();

    if (previousGame.mode === "matchmaking") throw new Error("UNSUPPORTED_GAME_MODE");
    if (!previousGame.playlistId) throw new Error("PLAYLIST_NOT_FOUND");
    if (!(await this.playlistAccess.canUse(previousGame.playlistId, auth.user!))) {
      return response.notFound();
    }

    const game = await this.gameService.createGame({
      mode: previousGame.mode,
      answerMode: previousGame.answerMode,
      answerTarget: previousGame.answerTarget,
      playlistId: previousGame.playlistId,
      difficulty: previousGame.difficulty,
      maxPlayers: previousGame.maxPlayers,
      roundCount: previousGame.roundCount,
      roundDurationMs: previousGame.roundDurationMs,
      hostId: auth.user!.id,
    });

    return response.redirect().toRoute("game.lobby", { id: game.publicId! });
  }

  async state({ params, response, serialize }: HttpContext) {
    const resolved = await this.resolveGame(params.id);
    const { game, currentRound } = await this.gameService.getGameState(resolved.id);
    const serverNow = Date.now();

    let roundPayload = null;
    if (currentRound?.startsAt) {
      roundPayload = await this.roundService.buildClientPayload(
        currentRound,
        serverNow,
        game.answerMode,
      );
    }

    const answerPings = currentRound
      ? await Answer.query()
          .where("round_id", currentRound.id)
          .where("is_correct", true)
          .select(["user_id", "response_ms", "is_correct"])
          .then((answers) => serialize.withoutWrapping(AnswerTransformer.transform(answers)))
      : [];

    const answerProgress =
      currentRound && game.answerTarget === "separate"
        ? await Answer.query()
            .where("round_id", currentRound.id)
            .select(["user_id", "title_correct", "artist_correct"])
            .then(async (answers) => {
              const serializedAnswers = await serialize.withoutWrapping(
                AnswerTransformer.transform(answers),
              );
              return serializedAnswers.map((answer) => ({
                userId: answer.userId,
                titleFound: Boolean(answer.titleCorrect),
                artistFound: Boolean(answer.artistCorrect),
              }));
            })
        : [];

    return response.json({
      status: game.status,
      currentRound: game.currentRound,
      round: roundPayload,
      serverNow,
      scores: await serialize.withoutWrapping(GamePlayerTransformer.transform(game.players)),
      answerPings,
      answerProgress,
      history: await this.getHistory(resolved.id),
    });
  }

  private async getHistory(gameId: string) {
    const [players, rounds] = await Promise.all([
      GamePlayer.query()
        .where("game_id", gameId)
        .orderBy("rank")
        .preload("user", (q) => q.preload("profile")),
      Round.query()
        .where("game_id", gameId)
        .whereNotNull("revealed_at")
        .preload("track")
        .preload("answers")
        .orderBy("round_number", "desc"),
    ]);

    return rounds.map((round) => ({
      roundNumber: round.roundNumber,
      title: round.track?.title ?? "",
      artist: round.track?.artist ?? "",
      coverUrl: round.track?.coverUrl ?? null,
      players: players.map((player) => {
        const answers = round.answers.filter((answer) => answer.gamePlayerId === player.id);
        const scoreEarned = answers.reduce((total, answer) => total + answer.scoreEarned, 0);

        return {
          userId: player.userId,
          username: displayUsernameForUser({
            username: player.user?.profile?.username,
            fullName: player.user?.fullName,
            fallback: `User${player.userId}`,
          }),
          avatarUrl: player.user?.profile?.avatarUrl ?? null,
          won: answers.some(
            (answer) =>
              answer.isCorrect || answer.titleCorrect || answer.artistCorrect || answer.scoreEarned > 0,
          ),
          scoreEarned,
        };
      }),
    }));
  }

  private async resolveCreationPlaylist({
    user,
    playlistIds,
    trackIds,
    roundCount,
  }: {
    user: User;
    playlistIds: string[];
    trackIds: string[];
    roundCount: number;
  }) {
    if (playlistIds.length === 0 && trackIds.length === 0) {
      throw new Error("Aucune playlist ou musique sélectionnée.");
    }

    for (const playlistId of playlistIds) {
      if (!(await this.playlistAccess.canUse(playlistId, user))) {
        throw new Error("Playlist inaccessible.");
      }
    }

    if (playlistIds.length === 1 && trackIds.length === 0) return playlistIds[0];

    const trackIdSet = new Set(trackIds);
    if (playlistIds.length > 0) {
      const playlistTracks = await TrackCache.query()
        .where("has_preview", true)
        .whereNotNull("preview_url")
        .whereHas("playlists", (query) => query.whereIn("playlists.id", playlistIds))
        .select("id");
      for (const track of playlistTracks) trackIdSet.add(track.id);
    }

    const selectedTracks = await TrackCache.query()
      .whereIn("id", [...trackIdSet])
      .where("has_preview", true)
      .whereNotNull("preview_url")
      .select("id");

    if (selectedTracks.length < roundCount) {
      throw new Error(
        `Pas assez de musiques avec extrait audio (${selectedTracks.length}/${roundCount}).`,
      );
    }

    const playlist = await Playlist.create({
      name: `Mix partie ${DateTime.now().toFormat("dd/MM HH:mm")}`,
      description: "Playlist générée automatiquement pour une partie.",
      trackCount: selectedTracks.length,
      isActive: true,
      createdBy: user.id,
      visibility: "private",
      lastSyncedAt: DateTime.now(),
    });

    await playlist.related("tracks").attach(
      Object.fromEntries(selectedTracks.map((track, index) => [track.id, { position: index + 1 }])),
    );

    return playlist.id;
  }

  private trackKey(title: string, artist: string) {
    return `${title.trim().toLowerCase()}::${artist.trim().toLowerCase()}`;
  }
}
