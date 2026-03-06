/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractResponse } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'home': {
    methods: ["GET","HEAD"]
    pattern: '/'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'new_account.create': {
    methods: ["GET","HEAD"]
    pattern: '/signup'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/new_account_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/new_account_controller').default['create']>>>
    }
  }
  'new_account.store': {
    methods: ["POST"]
    pattern: '/signup'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').signupValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').signupValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/new_account_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/new_account_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'session.create': {
    methods: ["GET","HEAD"]
    pattern: '/login'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/session_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/session_controller').default['create']>>>
    }
  }
  'session.store': {
    methods: ["POST"]
    pattern: '/login'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/session_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/session_controller').default['store']>>>
    }
  }
  'session.destroy': {
    methods: ["POST"]
    pattern: '/logout'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/session_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/session_controller').default['destroy']>>>
    }
  }
  'spotify.redirect': {
    methods: ["GET","HEAD"]
    pattern: '/auth/spotify'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/spotify_oauth_controller').default['redirect']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/spotify_oauth_controller').default['redirect']>>>
    }
  }
  'spotify.callback': {
    methods: ["GET","HEAD"]
    pattern: '/auth/spotify/callback'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/spotify_oauth_controller').default['callback']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/spotify_oauth_controller').default['callback']>>>
    }
  }
  'profile.show': {
    methods: ["GET","HEAD"]
    pattern: '/profile'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/profile_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/profile_controller').default['show']>>>
    }
  }
  'profile.view': {
    methods: ["GET","HEAD"]
    pattern: '/profile/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/profile_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/profile_controller').default['show']>>>
    }
  }
  'profile.update': {
    methods: ["POST"]
    pattern: '/profile'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/profile_validators').updateProfileValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/profile_validators').updateProfileValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/profile_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/profile_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'leaderboard.index': {
    methods: ["GET","HEAD"]
    pattern: '/leaderboard'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/leaderboard_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/leaderboard_controller').default['index']>>>
    }
  }
  'game.index': {
    methods: ["GET","HEAD"]
    pattern: '/game'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/game_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/game_controller').default['index']>>>
    }
  }
  'game.create': {
    methods: ["POST"]
    pattern: '/game'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/game_validators').createGameValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/game_validators').createGameValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/game_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/game_controller').default['create']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'game.lobby': {
    methods: ["GET","HEAD"]
    pattern: '/game/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/game_controller').default['lobby']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/game_controller').default['lobby']>>>
    }
  }
  'game.join': {
    methods: ["POST"]
    pattern: '/game/:id/join'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/game_controller').default['join']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/game_controller').default['join']>>>
    }
  }
  'game.start': {
    methods: ["POST"]
    pattern: '/game/:id/start'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/game_controller').default['start']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/game_controller').default['start']>>>
    }
  }
  'game.play': {
    methods: ["GET","HEAD"]
    pattern: '/game/:id/play'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/game_controller').default['play']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/game_controller').default['play']>>>
    }
  }
  'game.answer': {
    methods: ["POST"]
    pattern: '/game/:id/answer'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/game_validators').submitAnswerValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/game_validators').submitAnswerValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/game_controller').default['answer']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/game_controller').default['answer']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'game.results': {
    methods: ["GET","HEAD"]
    pattern: '/game/:id/results'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/game_controller').default['results']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/game_controller').default['results']>>>
    }
  }
  'game.state': {
    methods: ["GET","HEAD"]
    pattern: '/game/:id/state'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/game_controller').default['state']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/game_controller').default['state']>>>
    }
  }
  'admin.dashboard': {
    methods: ["GET","HEAD"]
    pattern: '/admin'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_controller').default['dashboard']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_controller').default['dashboard']>>>
    }
  }
  'admin.users': {
    methods: ["GET","HEAD"]
    pattern: '/admin/users'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_controller').default['users']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_controller').default['users']>>>
    }
  }
  'admin.ban': {
    methods: ["POST"]
    pattern: '/admin/users/:id/ban'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_controller').default['banUser']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_controller').default['banUser']>>>
    }
  }
  'admin.suspend': {
    methods: ["POST"]
    pattern: '/admin/users/:id/suspend'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_controller').default['suspendUser']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_controller').default['suspendUser']>>>
    }
  }
  'admin.unban': {
    methods: ["POST"]
    pattern: '/admin/users/:id/unban'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_controller').default['unbanUser']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_controller').default['unbanUser']>>>
    }
  }
  'admin.playlists': {
    methods: ["GET","HEAD"]
    pattern: '/admin/playlists'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_controller').default['playlists']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_controller').default['playlists']>>>
    }
  }
  'admin.playlists.import': {
    methods: ["POST"]
    pattern: '/admin/playlists/import'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_controller').default['importPlaylist']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_controller').default['importPlaylist']>>>
    }
  }
  'admin.playlists.toggle': {
    methods: ["POST"]
    pattern: '/admin/playlists/:id/toggle'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_controller').default['togglePlaylist']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_controller').default['togglePlaylist']>>>
    }
  }
}
