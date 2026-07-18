/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'event_stream': {
    methods: ["GET","HEAD"],
    pattern: '/__transmit/events',
    tokens: [{"old":"/__transmit/events","type":0,"val":"__transmit","end":""},{"old":"/__transmit/events","type":0,"val":"events","end":""}],
    types: placeholder as Registry['event_stream']['types'],
  },
  'subscribe': {
    methods: ["POST"],
    pattern: '/__transmit/subscribe',
    tokens: [{"old":"/__transmit/subscribe","type":0,"val":"__transmit","end":""},{"old":"/__transmit/subscribe","type":0,"val":"subscribe","end":""}],
    types: placeholder as Registry['subscribe']['types'],
  },
  'unsubscribe': {
    methods: ["POST"],
    pattern: '/__transmit/unsubscribe',
    tokens: [{"old":"/__transmit/unsubscribe","type":0,"val":"__transmit","end":""},{"old":"/__transmit/unsubscribe","type":0,"val":"unsubscribe","end":""}],
    types: placeholder as Registry['unsubscribe']['types'],
  },
  'home': {
    methods: ["GET","HEAD"],
    pattern: '/',
    tokens: [{"old":"/","type":0,"val":"/","end":""}],
    types: placeholder as Registry['home']['types'],
  },
  'privacy_policy': {
    methods: ["GET","HEAD"],
    pattern: '/politique-confidentialite',
    tokens: [{"old":"/politique-confidentialite","type":0,"val":"politique-confidentialite","end":""}],
    types: placeholder as Registry['privacy_policy']['types'],
  },
  'cgu': {
    methods: ["GET","HEAD"],
    pattern: '/conditions-generales-utilisation',
    tokens: [{"old":"/conditions-generales-utilisation","type":0,"val":"conditions-generales-utilisation","end":""}],
    types: placeholder as Registry['cgu']['types'],
  },
  'new_account.create': {
    methods: ["GET","HEAD"],
    pattern: '/signup',
    tokens: [{"old":"/signup","type":0,"val":"signup","end":""}],
    types: placeholder as Registry['new_account.create']['types'],
  },
  'new_account.store': {
    methods: ["POST"],
    pattern: '/signup',
    tokens: [{"old":"/signup","type":0,"val":"signup","end":""}],
    types: placeholder as Registry['new_account.store']['types'],
  },
  'session.create': {
    methods: ["GET","HEAD"],
    pattern: '/login',
    tokens: [{"old":"/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['session.create']['types'],
  },
  'session.store': {
    methods: ["POST"],
    pattern: '/login',
    tokens: [{"old":"/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['session.store']['types'],
  },
  'session.destroy': {
    methods: ["POST"],
    pattern: '/logout',
    tokens: [{"old":"/logout","type":0,"val":"logout","end":""}],
    types: placeholder as Registry['session.destroy']['types'],
  },
  'spotify.redirect': {
    methods: ["GET","HEAD"],
    pattern: '/auth/spotify',
    tokens: [{"old":"/auth/spotify","type":0,"val":"auth","end":""},{"old":"/auth/spotify","type":0,"val":"spotify","end":""}],
    types: placeholder as Registry['spotify.redirect']['types'],
  },
  'spotify.callback': {
    methods: ["GET","HEAD"],
    pattern: '/auth/spotify/callback',
    tokens: [{"old":"/auth/spotify/callback","type":0,"val":"auth","end":""},{"old":"/auth/spotify/callback","type":0,"val":"spotify","end":""},{"old":"/auth/spotify/callback","type":0,"val":"callback","end":""}],
    types: placeholder as Registry['spotify.callback']['types'],
  },
  'profile.show': {
    methods: ["GET","HEAD"],
    pattern: '/profile',
    tokens: [{"old":"/profile","type":0,"val":"profile","end":""}],
    types: placeholder as Registry['profile.show']['types'],
  },
  'profile.view': {
    methods: ["GET","HEAD"],
    pattern: '/profile/:id',
    tokens: [{"old":"/profile/:id","type":0,"val":"profile","end":""},{"old":"/profile/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['profile.view']['types'],
  },
  'profile.update': {
    methods: ["POST"],
    pattern: '/profile',
    tokens: [{"old":"/profile","type":0,"val":"profile","end":""}],
    types: placeholder as Registry['profile.update']['types'],
  },
  'profile.password': {
    methods: ["POST"],
    pattern: '/profile/password',
    tokens: [{"old":"/profile/password","type":0,"val":"profile","end":""},{"old":"/profile/password","type":0,"val":"password","end":""}],
    types: placeholder as Registry['profile.password']['types'],
  },
  'leaderboard.index': {
    methods: ["GET","HEAD"],
    pattern: '/leaderboard',
    tokens: [{"old":"/leaderboard","type":0,"val":"leaderboard","end":""}],
    types: placeholder as Registry['leaderboard.index']['types'],
  },
  'friends.request': {
    methods: ["POST"],
    pattern: '/friends/:userId/request',
    tokens: [{"old":"/friends/:userId/request","type":0,"val":"friends","end":""},{"old":"/friends/:userId/request","type":1,"val":"userId","end":""},{"old":"/friends/:userId/request","type":0,"val":"request","end":""}],
    types: placeholder as Registry['friends.request']['types'],
  },
  'friends.accept': {
    methods: ["POST"],
    pattern: '/friends/:id/accept',
    tokens: [{"old":"/friends/:id/accept","type":0,"val":"friends","end":""},{"old":"/friends/:id/accept","type":1,"val":"id","end":""},{"old":"/friends/:id/accept","type":0,"val":"accept","end":""}],
    types: placeholder as Registry['friends.accept']['types'],
  },
  'friends.decline': {
    methods: ["POST"],
    pattern: '/friends/:id/decline',
    tokens: [{"old":"/friends/:id/decline","type":0,"val":"friends","end":""},{"old":"/friends/:id/decline","type":1,"val":"id","end":""},{"old":"/friends/:id/decline","type":0,"val":"decline","end":""}],
    types: placeholder as Registry['friends.decline']['types'],
  },
  'practice.index': {
    methods: ["GET","HEAD"],
    pattern: '/practice',
    tokens: [{"old":"/practice","type":0,"val":"practice","end":""}],
    types: placeholder as Registry['practice.index']['types'],
  },
  'bandle.index': {
    methods: ["GET","HEAD"],
    pattern: '/bandle',
    tokens: [{"old":"/bandle","type":0,"val":"bandle","end":""}],
    types: placeholder as Registry['bandle.index']['types'],
  },
  'party.index': {
    methods: ["GET","HEAD"],
    pattern: '/party',
    tokens: [{"old":"/party","type":0,"val":"party","end":""}],
    types: placeholder as Registry['party.index']['types'],
  },
  'practice.question': {
    methods: ["GET","HEAD"],
    pattern: '/practice/question',
    tokens: [{"old":"/practice/question","type":0,"val":"practice","end":""},{"old":"/practice/question","type":0,"val":"question","end":""}],
    types: placeholder as Registry['practice.question']['types'],
  },
  'practice.preview': {
    methods: ["GET","HEAD"],
    pattern: '/audio/preview',
    tokens: [{"old":"/audio/preview","type":0,"val":"audio","end":""},{"old":"/audio/preview","type":0,"val":"preview","end":""}],
    types: placeholder as Registry['practice.preview']['types'],
  },
  'playlists.index': {
    methods: ["GET","HEAD"],
    pattern: '/playlists',
    tokens: [{"old":"/playlists","type":0,"val":"playlists","end":""}],
    types: placeholder as Registry['playlists.index']['types'],
  },
  'playlists.create': {
    methods: ["GET","HEAD"],
    pattern: '/playlists/create',
    tokens: [{"old":"/playlists/create","type":0,"val":"playlists","end":""},{"old":"/playlists/create","type":0,"val":"create","end":""}],
    types: placeholder as Registry['playlists.create']['types'],
  },
  'playlists.store': {
    methods: ["POST"],
    pattern: '/playlists',
    tokens: [{"old":"/playlists","type":0,"val":"playlists","end":""}],
    types: placeholder as Registry['playlists.store']['types'],
  },
  'playlists.manual.store': {
    methods: ["POST"],
    pattern: '/playlists/manual',
    tokens: [{"old":"/playlists/manual","type":0,"val":"playlists","end":""},{"old":"/playlists/manual","type":0,"val":"manual","end":""}],
    types: placeholder as Registry['playlists.manual.store']['types'],
  },
  'playlists.play': {
    methods: ["GET","HEAD"],
    pattern: '/playlists/:id/play',
    tokens: [{"old":"/playlists/:id/play","type":0,"val":"playlists","end":""},{"old":"/playlists/:id/play","type":1,"val":"id","end":""},{"old":"/playlists/:id/play","type":0,"val":"play","end":""}],
    types: placeholder as Registry['playlists.play']['types'],
  },
  'playlists.party': {
    methods: ["GET","HEAD"],
    pattern: '/playlists/:id/party',
    tokens: [{"old":"/playlists/:id/party","type":0,"val":"playlists","end":""},{"old":"/playlists/:id/party","type":1,"val":"id","end":""},{"old":"/playlists/:id/party","type":0,"val":"party","end":""}],
    types: placeholder as Registry['playlists.party']['types'],
  },
  'playlists.edit': {
    methods: ["GET","HEAD"],
    pattern: '/playlists/:id/edit',
    tokens: [{"old":"/playlists/:id/edit","type":0,"val":"playlists","end":""},{"old":"/playlists/:id/edit","type":1,"val":"id","end":""},{"old":"/playlists/:id/edit","type":0,"val":"edit","end":""}],
    types: placeholder as Registry['playlists.edit']['types'],
  },
  'playlists.update': {
    methods: ["POST"],
    pattern: '/playlists/:id',
    tokens: [{"old":"/playlists/:id","type":0,"val":"playlists","end":""},{"old":"/playlists/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['playlists.update']['types'],
  },
  'playlists.destroy': {
    methods: ["POST"],
    pattern: '/playlists/:id/delete',
    tokens: [{"old":"/playlists/:id/delete","type":0,"val":"playlists","end":""},{"old":"/playlists/:id/delete","type":1,"val":"id","end":""},{"old":"/playlists/:id/delete","type":0,"val":"delete","end":""}],
    types: placeholder as Registry['playlists.destroy']['types'],
  },
  'playlists.tracks.search': {
    methods: ["GET","HEAD"],
    pattern: '/playlists/:id/tracks/search',
    tokens: [{"old":"/playlists/:id/tracks/search","type":0,"val":"playlists","end":""},{"old":"/playlists/:id/tracks/search","type":1,"val":"id","end":""},{"old":"/playlists/:id/tracks/search","type":0,"val":"tracks","end":""},{"old":"/playlists/:id/tracks/search","type":0,"val":"search","end":""}],
    types: placeholder as Registry['playlists.tracks.search']['types'],
  },
  'playlists.tracks.add': {
    methods: ["POST"],
    pattern: '/playlists/:id/tracks',
    tokens: [{"old":"/playlists/:id/tracks","type":0,"val":"playlists","end":""},{"old":"/playlists/:id/tracks","type":1,"val":"id","end":""},{"old":"/playlists/:id/tracks","type":0,"val":"tracks","end":""}],
    types: placeholder as Registry['playlists.tracks.add']['types'],
  },
  'playlists.tracks.remove': {
    methods: ["POST"],
    pattern: '/playlists/:id/tracks/delete',
    tokens: [{"old":"/playlists/:id/tracks/delete","type":0,"val":"playlists","end":""},{"old":"/playlists/:id/tracks/delete","type":1,"val":"id","end":""},{"old":"/playlists/:id/tracks/delete","type":0,"val":"tracks","end":""},{"old":"/playlists/:id/tracks/delete","type":0,"val":"delete","end":""}],
    types: placeholder as Registry['playlists.tracks.remove']['types'],
  },
  'playlists.share': {
    methods: ["POST"],
    pattern: '/playlists/:id/share',
    tokens: [{"old":"/playlists/:id/share","type":0,"val":"playlists","end":""},{"old":"/playlists/:id/share","type":1,"val":"id","end":""},{"old":"/playlists/:id/share","type":0,"val":"share","end":""}],
    types: placeholder as Registry['playlists.share']['types'],
  },
  'playlists.unshare': {
    methods: ["POST"],
    pattern: '/playlists/:id/share/:shareId/delete',
    tokens: [{"old":"/playlists/:id/share/:shareId/delete","type":0,"val":"playlists","end":""},{"old":"/playlists/:id/share/:shareId/delete","type":1,"val":"id","end":""},{"old":"/playlists/:id/share/:shareId/delete","type":0,"val":"share","end":""},{"old":"/playlists/:id/share/:shareId/delete","type":1,"val":"shareId","end":""},{"old":"/playlists/:id/share/:shareId/delete","type":0,"val":"delete","end":""}],
    types: placeholder as Registry['playlists.unshare']['types'],
  },
  'game.index': {
    methods: ["GET","HEAD"],
    pattern: '/game',
    tokens: [{"old":"/game","type":0,"val":"game","end":""}],
    types: placeholder as Registry['game.index']['types'],
  },
  'game.starter_playlist': {
    methods: ["POST"],
    pattern: '/game/starter-playlist',
    tokens: [{"old":"/game/starter-playlist","type":0,"val":"game","end":""},{"old":"/game/starter-playlist","type":0,"val":"starter-playlist","end":""}],
    types: placeholder as Registry['game.starter_playlist']['types'],
  },
  'game.tracks.search': {
    methods: ["GET","HEAD"],
    pattern: '/game/tracks/search',
    tokens: [{"old":"/game/tracks/search","type":0,"val":"game","end":""},{"old":"/game/tracks/search","type":0,"val":"tracks","end":""},{"old":"/game/tracks/search","type":0,"val":"search","end":""}],
    types: placeholder as Registry['game.tracks.search']['types'],
  },
  'game.create': {
    methods: ["POST"],
    pattern: '/game',
    tokens: [{"old":"/game","type":0,"val":"game","end":""}],
    types: placeholder as Registry['game.create']['types'],
  },
  'game.round_preview': {
    methods: ["GET","HEAD"],
    pattern: '/game/:id/round-preview',
    tokens: [{"old":"/game/:id/round-preview","type":0,"val":"game","end":""},{"old":"/game/:id/round-preview","type":1,"val":"id","end":""},{"old":"/game/:id/round-preview","type":0,"val":"round-preview","end":""}],
    types: placeholder as Registry['game.round_preview']['types'],
  },
  'game.lobby': {
    methods: ["GET","HEAD"],
    pattern: '/game/:id',
    tokens: [{"old":"/game/:id","type":0,"val":"game","end":""},{"old":"/game/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['game.lobby']['types'],
  },
  'game.join': {
    methods: ["POST"],
    pattern: '/game/:id/join',
    tokens: [{"old":"/game/:id/join","type":0,"val":"game","end":""},{"old":"/game/:id/join","type":1,"val":"id","end":""},{"old":"/game/:id/join","type":0,"val":"join","end":""}],
    types: placeholder as Registry['game.join']['types'],
  },
  'game.start': {
    methods: ["POST"],
    pattern: '/game/:id/start',
    tokens: [{"old":"/game/:id/start","type":0,"val":"game","end":""},{"old":"/game/:id/start","type":1,"val":"id","end":""},{"old":"/game/:id/start","type":0,"val":"start","end":""}],
    types: placeholder as Registry['game.start']['types'],
  },
  'game.pause': {
    methods: ["POST"],
    pattern: '/game/:id/pause',
    tokens: [{"old":"/game/:id/pause","type":0,"val":"game","end":""},{"old":"/game/:id/pause","type":1,"val":"id","end":""},{"old":"/game/:id/pause","type":0,"val":"pause","end":""}],
    types: placeholder as Registry['game.pause']['types'],
  },
  'game.resume': {
    methods: ["POST"],
    pattern: '/game/:id/resume',
    tokens: [{"old":"/game/:id/resume","type":0,"val":"game","end":""},{"old":"/game/:id/resume","type":1,"val":"id","end":""},{"old":"/game/:id/resume","type":0,"val":"resume","end":""}],
    types: placeholder as Registry['game.resume']['types'],
  },
  'game.stop': {
    methods: ["POST"],
    pattern: '/game/:id/stop',
    tokens: [{"old":"/game/:id/stop","type":0,"val":"game","end":""},{"old":"/game/:id/stop","type":1,"val":"id","end":""},{"old":"/game/:id/stop","type":0,"val":"stop","end":""}],
    types: placeholder as Registry['game.stop']['types'],
  },
  'game.destroy': {
    methods: ["POST"],
    pattern: '/game/:id/delete',
    tokens: [{"old":"/game/:id/delete","type":0,"val":"game","end":""},{"old":"/game/:id/delete","type":1,"val":"id","end":""},{"old":"/game/:id/delete","type":0,"val":"delete","end":""}],
    types: placeholder as Registry['game.destroy']['types'],
  },
  'game.play': {
    methods: ["GET","HEAD"],
    pattern: '/game/:id/play',
    tokens: [{"old":"/game/:id/play","type":0,"val":"game","end":""},{"old":"/game/:id/play","type":1,"val":"id","end":""},{"old":"/game/:id/play","type":0,"val":"play","end":""}],
    types: placeholder as Registry['game.play']['types'],
  },
  'game.answer': {
    methods: ["POST"],
    pattern: '/game/:id/answer',
    tokens: [{"old":"/game/:id/answer","type":0,"val":"game","end":""},{"old":"/game/:id/answer","type":1,"val":"id","end":""},{"old":"/game/:id/answer","type":0,"val":"answer","end":""}],
    types: placeholder as Registry['game.answer']['types'],
  },
  'game.leave': {
    methods: ["POST"],
    pattern: '/game/:id/leave',
    tokens: [{"old":"/game/:id/leave","type":0,"val":"game","end":""},{"old":"/game/:id/leave","type":1,"val":"id","end":""},{"old":"/game/:id/leave","type":0,"val":"leave","end":""}],
    types: placeholder as Registry['game.leave']['types'],
  },
  'game.heartbeat': {
    methods: ["POST"],
    pattern: '/game/:id/heartbeat',
    tokens: [{"old":"/game/:id/heartbeat","type":0,"val":"game","end":""},{"old":"/game/:id/heartbeat","type":1,"val":"id","end":""},{"old":"/game/:id/heartbeat","type":0,"val":"heartbeat","end":""}],
    types: placeholder as Registry['game.heartbeat']['types'],
  },
  'game.results': {
    methods: ["GET","HEAD"],
    pattern: '/game/:id/results',
    tokens: [{"old":"/game/:id/results","type":0,"val":"game","end":""},{"old":"/game/:id/results","type":1,"val":"id","end":""},{"old":"/game/:id/results","type":0,"val":"results","end":""}],
    types: placeholder as Registry['game.results']['types'],
  },
  'game.replay': {
    methods: ["POST"],
    pattern: '/game/:id/replay',
    tokens: [{"old":"/game/:id/replay","type":0,"val":"game","end":""},{"old":"/game/:id/replay","type":1,"val":"id","end":""},{"old":"/game/:id/replay","type":0,"val":"replay","end":""}],
    types: placeholder as Registry['game.replay']['types'],
  },
  'game.state': {
    methods: ["GET","HEAD"],
    pattern: '/game/:id/state',
    tokens: [{"old":"/game/:id/state","type":0,"val":"game","end":""},{"old":"/game/:id/state","type":1,"val":"id","end":""},{"old":"/game/:id/state","type":0,"val":"state","end":""}],
    types: placeholder as Registry['game.state']['types'],
  },
  'admin.dashboard': {
    methods: ["GET","HEAD"],
    pattern: '/admin',
    tokens: [{"old":"/admin","type":0,"val":"admin","end":""}],
    types: placeholder as Registry['admin.dashboard']['types'],
  },
  'admin.games.official.create': {
    methods: ["POST"],
    pattern: '/admin/games/official',
    tokens: [{"old":"/admin/games/official","type":0,"val":"admin","end":""},{"old":"/admin/games/official","type":0,"val":"games","end":""},{"old":"/admin/games/official","type":0,"val":"official","end":""}],
    types: placeholder as Registry['admin.games.official.create']['types'],
  },
  'admin.games.update': {
    methods: ["POST"],
    pattern: '/admin/games/:id',
    tokens: [{"old":"/admin/games/:id","type":0,"val":"admin","end":""},{"old":"/admin/games/:id","type":0,"val":"games","end":""},{"old":"/admin/games/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['admin.games.update']['types'],
  },
  'admin.games.disable': {
    methods: ["POST"],
    pattern: '/admin/games/:id/disable',
    tokens: [{"old":"/admin/games/:id/disable","type":0,"val":"admin","end":""},{"old":"/admin/games/:id/disable","type":0,"val":"games","end":""},{"old":"/admin/games/:id/disable","type":1,"val":"id","end":""},{"old":"/admin/games/:id/disable","type":0,"val":"disable","end":""}],
    types: placeholder as Registry['admin.games.disable']['types'],
  },
  'admin.games.reactivate': {
    methods: ["POST"],
    pattern: '/admin/games/:id/reactivate',
    tokens: [{"old":"/admin/games/:id/reactivate","type":0,"val":"admin","end":""},{"old":"/admin/games/:id/reactivate","type":0,"val":"games","end":""},{"old":"/admin/games/:id/reactivate","type":1,"val":"id","end":""},{"old":"/admin/games/:id/reactivate","type":0,"val":"reactivate","end":""}],
    types: placeholder as Registry['admin.games.reactivate']['types'],
  },
  'admin.games.delete': {
    methods: ["POST"],
    pattern: '/admin/games/:id/delete',
    tokens: [{"old":"/admin/games/:id/delete","type":0,"val":"admin","end":""},{"old":"/admin/games/:id/delete","type":0,"val":"games","end":""},{"old":"/admin/games/:id/delete","type":1,"val":"id","end":""},{"old":"/admin/games/:id/delete","type":0,"val":"delete","end":""}],
    types: placeholder as Registry['admin.games.delete']['types'],
  },
  'admin.users': {
    methods: ["GET","HEAD"],
    pattern: '/admin/users',
    tokens: [{"old":"/admin/users","type":0,"val":"admin","end":""},{"old":"/admin/users","type":0,"val":"users","end":""}],
    types: placeholder as Registry['admin.users']['types'],
  },
  'admin.ban': {
    methods: ["POST"],
    pattern: '/admin/users/:id/ban',
    tokens: [{"old":"/admin/users/:id/ban","type":0,"val":"admin","end":""},{"old":"/admin/users/:id/ban","type":0,"val":"users","end":""},{"old":"/admin/users/:id/ban","type":1,"val":"id","end":""},{"old":"/admin/users/:id/ban","type":0,"val":"ban","end":""}],
    types: placeholder as Registry['admin.ban']['types'],
  },
  'admin.suspend': {
    methods: ["POST"],
    pattern: '/admin/users/:id/suspend',
    tokens: [{"old":"/admin/users/:id/suspend","type":0,"val":"admin","end":""},{"old":"/admin/users/:id/suspend","type":0,"val":"users","end":""},{"old":"/admin/users/:id/suspend","type":1,"val":"id","end":""},{"old":"/admin/users/:id/suspend","type":0,"val":"suspend","end":""}],
    types: placeholder as Registry['admin.suspend']['types'],
  },
  'admin.unban': {
    methods: ["POST"],
    pattern: '/admin/users/:id/unban',
    tokens: [{"old":"/admin/users/:id/unban","type":0,"val":"admin","end":""},{"old":"/admin/users/:id/unban","type":0,"val":"users","end":""},{"old":"/admin/users/:id/unban","type":1,"val":"id","end":""},{"old":"/admin/users/:id/unban","type":0,"val":"unban","end":""}],
    types: placeholder as Registry['admin.unban']['types'],
  },
  'admin.playlists': {
    methods: ["GET","HEAD"],
    pattern: '/admin/playlists',
    tokens: [{"old":"/admin/playlists","type":0,"val":"admin","end":""},{"old":"/admin/playlists","type":0,"val":"playlists","end":""}],
    types: placeholder as Registry['admin.playlists']['types'],
  },
  'admin.playlists.import': {
    methods: ["POST"],
    pattern: '/admin/playlists/import',
    tokens: [{"old":"/admin/playlists/import","type":0,"val":"admin","end":""},{"old":"/admin/playlists/import","type":0,"val":"playlists","end":""},{"old":"/admin/playlists/import","type":0,"val":"import","end":""}],
    types: placeholder as Registry['admin.playlists.import']['types'],
  },
  'admin.playlists.toggle': {
    methods: ["POST"],
    pattern: '/admin/playlists/:id/toggle',
    tokens: [{"old":"/admin/playlists/:id/toggle","type":0,"val":"admin","end":""},{"old":"/admin/playlists/:id/toggle","type":0,"val":"playlists","end":""},{"old":"/admin/playlists/:id/toggle","type":1,"val":"id","end":""},{"old":"/admin/playlists/:id/toggle","type":0,"val":"toggle","end":""}],
    types: placeholder as Registry['admin.playlists.toggle']['types'],
  },
  'admin.playlists.update': {
    methods: ["POST"],
    pattern: '/admin/playlists/:id',
    tokens: [{"old":"/admin/playlists/:id","type":0,"val":"admin","end":""},{"old":"/admin/playlists/:id","type":0,"val":"playlists","end":""},{"old":"/admin/playlists/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['admin.playlists.update']['types'],
  },
  'admin.playlists.tracks.update': {
    methods: ["POST"],
    pattern: '/admin/playlists/:id/tracks/:trackId',
    tokens: [{"old":"/admin/playlists/:id/tracks/:trackId","type":0,"val":"admin","end":""},{"old":"/admin/playlists/:id/tracks/:trackId","type":0,"val":"playlists","end":""},{"old":"/admin/playlists/:id/tracks/:trackId","type":1,"val":"id","end":""},{"old":"/admin/playlists/:id/tracks/:trackId","type":0,"val":"tracks","end":""},{"old":"/admin/playlists/:id/tracks/:trackId","type":1,"val":"trackId","end":""}],
    types: placeholder as Registry['admin.playlists.tracks.update']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
