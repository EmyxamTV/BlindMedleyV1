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
  'privacy_policy': {
    methods: ["GET","HEAD"]
    pattern: '/politique-confidentialite'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'cgu': {
    methods: ["GET","HEAD"]
    pattern: '/conditions-generales-utilisation'
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
      body: ExtractBody<InferInput<(typeof import('#validators/user').loginValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').loginValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/session_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/session_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
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
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/spotify_validators').spotifyCallbackValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/spotify_oauth_controller').default['callback']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/spotify_oauth_controller').default['callback']>>> | { status: 422; response: { errors: SimpleError[] } }
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
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/leaderboard_validators').leaderboardQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/leaderboard_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/leaderboard_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'friends.request': {
    methods: ["POST"]
    pattern: '/friends/:userId/request'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/friendship_validators').friendRequestParamsValidator)>>
      paramsTuple: [ParamValue]
      params: { userId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/friendship_validators').friendRequestParamsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/friendship_controller').default['request']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/friendship_controller').default['request']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'friends.accept': {
    methods: ["POST"]
    pattern: '/friends/:id/accept'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/friendship_validators').friendshipParamsValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/friendship_validators').friendshipParamsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/friendship_controller').default['accept']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/friendship_controller').default['accept']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'friends.decline': {
    methods: ["POST"]
    pattern: '/friends/:id/decline'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/friendship_validators').friendshipParamsValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/friendship_validators').friendshipParamsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/friendship_controller').default['decline']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/friendship_controller').default['decline']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'practice.index': {
    methods: ["GET","HEAD"]
    pattern: '/practice'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/practice_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/practice_controller').default['index']>>>
    }
  }
  'bandle.index': {
    methods: ["GET","HEAD"]
    pattern: '/bandle'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/practice_controller').default['bandle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/practice_controller').default['bandle']>>>
    }
  }
  'party.index': {
    methods: ["GET","HEAD"]
    pattern: '/party'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/playlist_controller').default['party']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/playlist_controller').default['party']>>>
    }
  }
  'practice.question': {
    methods: ["GET","HEAD"]
    pattern: '/practice/question'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/practice_validators').practiceQuestionQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/practice_controller').default['question']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/practice_controller').default['question']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'practice.preview': {
    methods: ["GET","HEAD"]
    pattern: '/audio/preview'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/practice_validators').previewQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/practice_controller').default['preview']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/practice_controller').default['preview']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'playlists.index': {
    methods: ["GET","HEAD"]
    pattern: '/playlists'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/playlist_validators').playlistsQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/playlist_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/playlist_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'playlists.create': {
    methods: ["GET","HEAD"]
    pattern: '/playlists/create'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/playlist_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/playlist_controller').default['create']>>>
    }
  }
  'playlists.store': {
    methods: ["POST"]
    pattern: '/playlists'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/playlist_validators').createPlaylistValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/playlist_validators').createPlaylistValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/playlist_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/playlist_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'playlists.play': {
    methods: ["GET","HEAD"]
    pattern: '/playlists/:id/play'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/playlist_controller').default['play']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/playlist_controller').default['play']>>>
    }
  }
  'playlists.party': {
    methods: ["GET","HEAD"]
    pattern: '/playlists/:id/party'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/playlist_controller').default['party']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/playlist_controller').default['party']>>>
    }
  }
  'playlists.edit': {
    methods: ["GET","HEAD"]
    pattern: '/playlists/:id/edit'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/playlist_controller').default['edit']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/playlist_controller').default['edit']>>>
    }
  }
  'playlists.update': {
    methods: ["POST"]
    pattern: '/playlists/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/playlist_validators').updatePlaylistValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/playlist_validators').updatePlaylistValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/playlist_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/playlist_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'playlists.destroy': {
    methods: ["POST"]
    pattern: '/playlists/:id/delete'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/playlist_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/playlist_controller').default['destroy']>>>
    }
  }
  'playlists.tracks.search': {
    methods: ["GET","HEAD"]
    pattern: '/playlists/:id/tracks/search'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/playlist_validators').trackSearchValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/playlist_controller').default['searchTracks']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/playlist_controller').default['searchTracks']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'playlists.tracks.add': {
    methods: ["POST"]
    pattern: '/playlists/:id/tracks'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/playlist_validators').addPlaylistTrackValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/playlist_validators').addPlaylistTrackValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/playlist_controller').default['addTrack']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/playlist_controller').default['addTrack']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'playlists.tracks.remove': {
    methods: ["POST"]
    pattern: '/playlists/:id/tracks/delete'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/playlist_validators').removePlaylistTracksValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/playlist_validators').removePlaylistTracksValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/playlist_controller').default['removeTracks']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/playlist_controller').default['removeTracks']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'playlists.share': {
    methods: ["POST"]
    pattern: '/playlists/:id/share'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/playlist_validators').sharePlaylistValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/playlist_validators').sharePlaylistValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/playlist_controller').default['share']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/playlist_controller').default['share']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'playlists.unshare': {
    methods: ["POST"]
    pattern: '/playlists/:id/share/:shareId/delete'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { id: ParamValue; shareId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/playlist_controller').default['unshare']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/playlist_controller').default['unshare']>>>
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
  'game.starter_playlist': {
    methods: ["POST"]
    pattern: '/game/starter-playlist'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/game_controller').default['createStarterPlaylist']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/game_controller').default['createStarterPlaylist']>>>
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
      body: ExtractBody<InferInput<(typeof import('#validators/game_validators').joinGameValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/game_validators').joinGameValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/game_controller').default['join']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/game_controller').default['join']>>> | { status: 422; response: { errors: SimpleError[] } }
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
  'game.leave': {
    methods: ["POST"]
    pattern: '/game/:id/leave'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/game_controller').default['leave']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/game_controller').default['leave']>>>
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
  'game.replay': {
    methods: ["POST"]
    pattern: '/game/:id/replay'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/game_controller').default['replay']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/game_controller').default['replay']>>>
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
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin_validators').adminUsersQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_controller').default['users']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_controller').default['users']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.ban': {
    methods: ["POST"]
    pattern: '/admin/users/:id/ban'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_validators').banUserValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_validators').banUserValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_controller').default['banUser']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_controller').default['banUser']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.suspend': {
    methods: ["POST"]
    pattern: '/admin/users/:id/suspend'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_validators').suspendUserValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_validators').suspendUserValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_controller').default['suspendUser']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_controller').default['suspendUser']>>> | { status: 422; response: { errors: SimpleError[] } }
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
      body: ExtractBody<InferInput<(typeof import('#validators/admin_validators').importPlaylistValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_validators').importPlaylistValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_controller').default['importPlaylist']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_controller').default['importPlaylist']>>> | { status: 422; response: { errors: SimpleError[] } }
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
  'admin.playlists.tracks.update': {
    methods: ["POST"]
    pattern: '/admin/playlists/:id/tracks/:trackId'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_validators').updatePlaylistTrackValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { id: ParamValue; trackId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_validators').updatePlaylistTrackValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_controller').default['updatePlaylistTrack']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_controller').default['updatePlaylistTrack']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
}
