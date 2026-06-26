import type { HttpContext } from "@adonisjs/core/http";
import leaderboardService from "#services/leaderboard_service";
import Friendship from "#models/friendship";
import Profile from "#models/profile";

export default class LeaderboardController {
  async index({ inertia, request, auth }: HttpContext) {
    const period = (request.qs().period as "global" | "weekly" | "monthly") ?? "global";
    const country = request.qs().country as string | undefined;

    const [top, myRank] = await Promise.all([
      leaderboardService.getLeaderboard(period, { country, limit: 100 }),
      leaderboardService.getUserRank(auth.user!.id, period),
    ]);

    // Leaderboard amis
    const allFriendships = await Friendship.query().where((q) => {
      q.where("requester_id", auth.user!.id).orWhere("addressee_id", auth.user!.id);
    });

    const friendships = allFriendships.filter((friendship) => friendship.status === "accepted");

    const friendIds = friendships.map((f) =>
      f.requesterId === auth.user!.id ? f.addresseeId : f.requesterId,
    );

    const friendsLeaderboard = await leaderboardService.getFriendsLeaderboard(
      auth.user!.id,
      friendIds,
    );
    const search = String(request.qs().search ?? "").trim();
    const searchResults =
      search.length >= 2
        ? await Profile.query()
            .where("username", "like", `%${search}%`)
            .whereNot("user_id", auth.user!.id)
            .limit(8)
        : [];

    const relationshipByUserId = new Map<
      number,
      { id: number; status: string; incoming: boolean }
    >();
    for (const friendship of allFriendships) {
      relationshipByUserId.set(
        friendship.requesterId === auth.user!.id ? friendship.addresseeId : friendship.requesterId,
        {
          id: friendship.id,
          status: friendship.status,
          incoming: friendship.addresseeId === auth.user!.id,
        },
      );
    }

    const incomingRequests = await Friendship.query()
      .where("addressee_id", auth.user!.id)
      .where("status", "pending")
      .preload("requester", (query) => query.preload("profile"));

    return inertia.render("leaderboard", {
      period,
      country: country ?? null,
      entries: top,
      myRank,
      friendsLeaderboard,
      search,
      searchResults: searchResults.map((profile) => ({
        userId: profile.userId,
        username: profile.username,
        avatarUrl: profile.avatarUrl,
        relationship: relationshipByUserId.get(profile.userId) ?? null,
      })),
      incomingRequests: incomingRequests.map((friendship) => ({
        id: friendship.id,
        username: friendship.requester.profile?.username ?? `Joueur ${friendship.requesterId}`,
        avatarUrl: friendship.requester.profile?.avatarUrl ?? null,
      })),
    });
  }
}
