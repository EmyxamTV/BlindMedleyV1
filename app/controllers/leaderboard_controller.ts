import type { HttpContext } from '@adonisjs/core/http'
import leaderboardService from '#services/leaderboard_service'
import Friendship from '#models/friendship'

export default class LeaderboardController {
  async index({ inertia, request, auth }: HttpContext) {
    const period = (request.qs().period as 'global' | 'weekly' | 'monthly') ?? 'global'
    const country = request.qs().country as string | undefined

    const [top, myRank] = await Promise.all([
      leaderboardService.getLeaderboard(period, { country, limit: 100 }),
      leaderboardService.getUserRank(auth.user!.id, period),
    ])

    // Leaderboard amis
    const friendships = await Friendship.query()
      .where((q) => {
        q.where('requester_id', auth.user!.id).orWhere('addressee_id', auth.user!.id)
      })
      .where('status', 'accepted')

    const friendIds = friendships.map((f) =>
      f.requesterId === auth.user!.id ? f.addresseeId : f.requesterId
    )

    const friendsLeaderboard = await leaderboardService.getFriendsLeaderboard(auth.user!.id, friendIds)

    return inertia.render('leaderboard', {
      period,
      country: country ?? null,
      entries: top,
      myRank,
      friendsLeaderboard,
    })
  }
}
