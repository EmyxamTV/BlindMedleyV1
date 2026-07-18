import type { ApplicationService } from "@adonisjs/core/types";
import type { HttpContext } from "@adonisjs/core/http";
import { GameService } from "#services/game_service";
import { RoundService } from "#services/round_service";
import { ScoreService } from "#services/score_service";
import { XpService } from "#services/xp_service";
import Game from "#models/game";
import GamePlayer from "#models/game_player";

type RealtimePlayer = {
  gameId: string;
  userId: string;
  uids: Set<string>;
};

/**
 * Le moteur de jeu garde les échéances des manches en mémoire. Il doit donc
 * être unique pour tout le processus HTTP : une instance par requête ne peut
 * ni annuler ni remplacer les minuteurs créés par une requête précédente.
 */
export default class GameProvider {
  private gameService: GameService | null = null;
  private presenceRefreshTimer: ReturnType<typeof setInterval> | null = null;
  private readonly realtimePlayers = new Map<string, RealtimePlayer>();
  private readonly playerKeyByUid = new Map<string, string>();
  private readonly pendingLeaves = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly stopTransmitListeners: Array<() => void> = [];

  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container.singleton(GameService, async (resolver) => {
      return new GameService(
        await resolver.make(RoundService),
        await resolver.make(ScoreService),
        await resolver.make(XpService),
      );
    });
  }

  async start() {
    this.gameService = await this.app.container.make(GameService);

    const transmit = await this.app.container.make("transmit");
    this.stopTransmitListeners.push(
      transmit.on("subscribe", ({ uid, channel, context }) => {
        void this.attachRealtimePlayer(uid, channel, context).catch(console.error);
      }),
      transmit.on("unsubscribe", ({ uid }) => {
        this.detachRealtimeUid(uid);
      }),
      transmit.on("disconnect", ({ uid }) => {
        this.detachRealtimeUid(uid);
      }),
    );

    // Le navigateur conserve une seule connexion SSE. Le serveur rafraîchit
    // lui-même la présence tant que cette connexion existe, sans requête HTTP
    // périodique côté joueur.
    this.presenceRefreshTimer = setInterval(() => {
      void this.refreshRealtimePresence().catch(console.error);
    }, 25_000);
  }

  async ready() {
    await this.gameService?.startLifecycle();
  }

  async shutdown() {
    if (this.presenceRefreshTimer) clearInterval(this.presenceRefreshTimer);
    this.presenceRefreshTimer = null;
    for (const timer of this.pendingLeaves.values()) clearTimeout(timer);
    this.pendingLeaves.clear();
    for (const unsubscribe of this.stopTransmitListeners.splice(0)) unsubscribe();
    this.realtimePlayers.clear();
    this.playerKeyByUid.clear();

    this.gameService?.stopLifecycle();
    this.gameService = null;
  }

  private playerKey(gameId: string, userId: string): string {
    return `${gameId}:${userId}`;
  }

  private async attachRealtimePlayer(
    uid: string,
    channel: string,
    context: HttpContext,
  ): Promise<void> {
    if (!channel.startsWith("game/")) return;
    await context.auth.check();
    const user = context.auth.user;
    if (!user) return;

    const publicId = channel.slice("game/".length);
    const game = await Game.query().where("public_id", publicId).select("id").first();
    if (!game) return;

    const player = await GamePlayer.query()
      .where("game_id", game.id)
      .where("user_id", user.id)
      .first();
    if (!player) return;

    const key = this.playerKey(game.id, user.id);
    const pendingLeave = this.pendingLeaves.get(key);
    if (pendingLeave) clearTimeout(pendingLeave);
    this.pendingLeaves.delete(key);

    const previousKey = this.playerKeyByUid.get(uid);
    if (previousKey && previousKey !== key) this.detachRealtimeUid(uid);

    const realtimePlayer = this.realtimePlayers.get(key) ?? {
      gameId: game.id,
      userId: user.id,
      uids: new Set<string>(),
    };
    realtimePlayer.uids.add(uid);
    this.realtimePlayers.set(key, realtimePlayer);
    this.playerKeyByUid.set(uid, key);

    await this.gameService?.heartbeatPlayer(game.id, user.id);
  }

  private detachRealtimeUid(uid: string): void {
    const key = this.playerKeyByUid.get(uid);
    if (!key) return;
    this.playerKeyByUid.delete(uid);

    const realtimePlayer = this.realtimePlayers.get(key);
    if (!realtimePlayer) return;
    realtimePlayer.uids.delete(uid);
    if (realtimePlayer.uids.size > 0 || this.pendingLeaves.has(key)) return;

    // Une navigation Inertia remplace la connexion du lobby par celle de la
    // partie. Cette marge évite de faire sortir puis rentrer le joueur.
    const timer = setTimeout(() => {
      this.pendingLeaves.delete(key);
      const current = this.realtimePlayers.get(key);
      if (!current || current.uids.size > 0) return;
      this.realtimePlayers.delete(key);
      void this.gameService?.leaveGame(current.gameId, current.userId).catch(console.error);
    }, 5_000);
    this.pendingLeaves.set(key, timer);
  }

  private async refreshRealtimePresence(): Promise<void> {
    if (!this.gameService) return;
    const players = [...this.realtimePlayers.values()].filter((player) => player.uids.size > 0);
    await Promise.all(
      players.map((player) =>
        this.gameService!.heartbeatPlayer(player.gameId, player.userId).catch(() => undefined),
      ),
    );
  }
}
