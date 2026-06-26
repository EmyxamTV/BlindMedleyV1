import type { HttpContext } from "@adonisjs/core/http";
import { LeaderboardService } from "#services/leaderboard_service";
import Friendship from "#models/friendship";
import Profile from "#models/profile";
import FriendshipTransformer from "#transformers/friendship_transformer";
import ProfileTransformer from "#transformers/profile_transformer";
import { leaderboardQueryValidator } from "#validators/leaderboard_validators";
import { inject } from "@adonisjs/core";

@inject()
export default class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  async index({ inertia, request, auth }: HttpContext) {
    const {
      period = "global",
      country,
      search = "",
    } = await request.validateUsing(leaderboardQueryValidator, { data: request.qs() });

    const [top, myRank] = await Promise.all([
      this.leaderboardService.getLeaderboard(period, { country, limit: 100 }),
      this.leaderboardService.getUserRank(auth.user!.id, period),
    ]);

    // Leaderboard amis
    const allFriendships = await Friendship.query().where((q) => {
      q.where("requester_id", auth.user!.id).orWhere("addressee_id", auth.user!.id);
    });

    const friendships = allFriendships.filter((friendship) => friendship.status === "accepted");

    const friendIds = friendships.map((f) =>
      f.requesterId === auth.user!.id ? f.addresseeId : f.requesterId,
    );

    const friendsLeaderboard = await this.leaderboardService.getFriendsLeaderboard(
      auth.user!.id,
      friendIds,
    );
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
      searchResults: ProfileTransformer.transform(searchResults),
      relationshipByUserId: Object.fromEntries(relationshipByUserId),
      incomingRequests: FriendshipTransformer.transform(incomingRequests),
    });
  }
}
