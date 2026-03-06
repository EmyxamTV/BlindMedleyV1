/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'home': {
    methods: ["GET","HEAD"],
    pattern: '/',
    tokens: [{"old":"/","type":0,"val":"/","end":""}],
    types: placeholder as Registry['home']['types'],
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
  'leaderboard.index': {
    methods: ["GET","HEAD"],
    pattern: '/leaderboard',
    tokens: [{"old":"/leaderboard","type":0,"val":"leaderboard","end":""}],
    types: placeholder as Registry['leaderboard.index']['types'],
  },
  'game.index': {
    methods: ["GET","HEAD"],
    pattern: '/game',
    tokens: [{"old":"/game","type":0,"val":"game","end":""}],
    types: placeholder as Registry['game.index']['types'],
  },
  'game.create': {
    methods: ["POST"],
    pattern: '/game',
    tokens: [{"old":"/game","type":0,"val":"game","end":""}],
    types: placeholder as Registry['game.create']['types'],
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
  'game.results': {
    methods: ["GET","HEAD"],
    pattern: '/game/:id/results',
    tokens: [{"old":"/game/:id/results","type":0,"val":"game","end":""},{"old":"/game/:id/results","type":1,"val":"id","end":""},{"old":"/game/:id/results","type":0,"val":"results","end":""}],
    types: placeholder as Registry['game.results']['types'],
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
