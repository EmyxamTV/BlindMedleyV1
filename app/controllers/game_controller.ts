import type { HttpContext } from "@adonisjs/core/http";
import Game from "#models/game";
import GamePlayer from "#models/game_player";
import Round from "#models/round";
import Answer from "#models/answer";
import { GameService } from "#services/game_service";
import { RoundService } from "#services/round_service";
import { DeezerService } from "#services/deezer_service";
import { PlaylistAccessService } from "#services/playlist_access_service";
import AnswerTransformer from "#transformers/answer_transformer";
import GamePlayerTransformer from "#transformers/game_player_transformer";
import GameTransformer from "#transformers/game_transformer";
import {
  createGameValidator,
  joinGameValidator,
  submitAnswerValidator,
} from "#validators/game_validators";
import { inject } from "@adonisjs/core";

@inject()
export default class GameController {
  constructor(
    private readonly gameService: GameService,
    private readonly roundService: RoundService,
    private readonly deezerService: DeezerService,
    private readonly playlistAccess: PlaylistAccessService,
  ) {}

  // ── Résoudre un publicId → Game (lève 404 si introuvable) ─────────────
  private async resolveGame(publicId: string): Promise<Game> {
    return Game.query().where("public_id", publicId).firstOrFail();
  }

  // Page lobby / création
  async index({ response }: HttpContext) {
    return response.redirect().toRoute("playlists.index");
  }

  // Créer une partie
  async create({ request, auth, response }: HttpContext) {
    const payload = await request.validateUsing(createGameValidator);
    if (!(await this.playlistAccess.canUse(payload.playlistId, auth.user!))) {
      return response.notFound();
    }

    const game = await this.gameService.createGame({ ...payload, hostId: auth.user!.id });

    return response.redirect().toRoute("game.lobby", { id: game.publicId! });
  }

  async createStarterPlaylist({ response, session }: HttpContext) {
    await this.deezerService.importStarterPlaylist();
    session.flash("success", "Playlist de démarrage prête. Tu peux maintenant lancer une partie.");

    return response.redirect().toRoute("playlists.index");
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
    await this.gameService.startGame(game.id, auth.user!.id);
    return response.redirect().toRoute("game.play", { id: params.id });
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

  private async getHistory(gameId: number) {
    const rounds = await Round.query()
      .where("game_id", gameId)
      .whereNotNull("revealed_at")
      .preload("track")
      .orderBy("round_number", "desc");

    return rounds.map((round) => ({
      roundNumber: round.roundNumber,
      title: round.track?.title ?? "",
      artist: round.track?.artist ?? "",
      coverUrl: round.track?.coverUrl ?? null,
    }));
  }
}
