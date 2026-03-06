/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  home: typeof routes['home']
  newAccount: {
    create: typeof routes['new_account.create']
    store: typeof routes['new_account.store']
  }
  session: {
    create: typeof routes['session.create']
    store: typeof routes['session.store']
    destroy: typeof routes['session.destroy']
  }
  spotify: {
    redirect: typeof routes['spotify.redirect']
    callback: typeof routes['spotify.callback']
  }
  profile: {
    show: typeof routes['profile.show']
    view: typeof routes['profile.view']
    update: typeof routes['profile.update']
  }
  leaderboard: {
    index: typeof routes['leaderboard.index']
  }
  game: {
    index: typeof routes['game.index']
    create: typeof routes['game.create']
    lobby: typeof routes['game.lobby']
    join: typeof routes['game.join']
    start: typeof routes['game.start']
    play: typeof routes['game.play']
    answer: typeof routes['game.answer']
    results: typeof routes['game.results']
    state: typeof routes['game.state']
  }
  admin: {
    dashboard: typeof routes['admin.dashboard']
    users: typeof routes['admin.users']
    ban: typeof routes['admin.ban']
    suspend: typeof routes['admin.suspend']
    unban: typeof routes['admin.unban']
    playlists: typeof routes['admin.playlists'] & {
      import: typeof routes['admin.playlists.import']
      toggle: typeof routes['admin.playlists.toggle']
    }
  }
}
