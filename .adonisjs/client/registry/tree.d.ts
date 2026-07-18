/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  eventStream: typeof routes['event_stream']
  subscribe: typeof routes['subscribe']
  unsubscribe: typeof routes['unsubscribe']
  home: typeof routes['home']
  privacyPolicy: typeof routes['privacy_policy']
  cgu: typeof routes['cgu']
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
    password: typeof routes['profile.password']
  }
  leaderboard: {
    index: typeof routes['leaderboard.index']
  }
  friends: {
    request: typeof routes['friends.request']
    accept: typeof routes['friends.accept']
    decline: typeof routes['friends.decline']
  }
  practice: {
    index: typeof routes['practice.index']
    question: typeof routes['practice.question']
    preview: typeof routes['practice.preview']
  }
  bandle: {
    index: typeof routes['bandle.index']
  }
  party: {
    index: typeof routes['party.index']
  }
  playlists: {
    index: typeof routes['playlists.index']
    create: typeof routes['playlists.create']
    store: typeof routes['playlists.store']
    manual: {
      store: typeof routes['playlists.manual.store']
    }
    play: typeof routes['playlists.play']
    party: typeof routes['playlists.party']
    edit: typeof routes['playlists.edit']
    update: typeof routes['playlists.update']
    destroy: typeof routes['playlists.destroy']
    tracks: {
      search: typeof routes['playlists.tracks.search']
      add: typeof routes['playlists.tracks.add']
      remove: typeof routes['playlists.tracks.remove']
    }
    share: typeof routes['playlists.share']
    unshare: typeof routes['playlists.unshare']
  }
  game: {
    index: typeof routes['game.index']
    starterPlaylist: typeof routes['game.starter_playlist']
    tracks: {
      search: typeof routes['game.tracks.search']
    }
    create: typeof routes['game.create']
    roundPreview: typeof routes['game.round_preview']
    lobby: typeof routes['game.lobby']
    join: typeof routes['game.join']
    start: typeof routes['game.start']
    pause: typeof routes['game.pause']
    resume: typeof routes['game.resume']
    stop: typeof routes['game.stop']
    destroy: typeof routes['game.destroy']
    play: typeof routes['game.play']
    answer: typeof routes['game.answer']
    leave: typeof routes['game.leave']
    heartbeat: typeof routes['game.heartbeat']
    results: typeof routes['game.results']
    replay: typeof routes['game.replay']
    state: typeof routes['game.state']
  }
  admin: {
    dashboard: typeof routes['admin.dashboard']
    games: {
      official: {
        create: typeof routes['admin.games.official.create']
      }
      update: typeof routes['admin.games.update']
      disable: typeof routes['admin.games.disable']
      reactivate: typeof routes['admin.games.reactivate']
      delete: typeof routes['admin.games.delete']
    }
    users: typeof routes['admin.users']
    ban: typeof routes['admin.ban']
    suspend: typeof routes['admin.suspend']
    unban: typeof routes['admin.unban']
    playlists: typeof routes['admin.playlists'] & {
      import: typeof routes['admin.playlists.import']
      toggle: typeof routes['admin.playlists.toggle']
      update: typeof routes['admin.playlists.update']
      tracks: {
        update: typeof routes['admin.playlists.tracks.update']
      }
    }
  }
}
