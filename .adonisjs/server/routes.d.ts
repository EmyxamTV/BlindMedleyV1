import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'home': { paramsTuple?: []; params?: {} }
    'privacy_policy': { paramsTuple?: []; params?: {} }
    'cgu': { paramsTuple?: []; params?: {} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'new_account.store': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'spotify.redirect': { paramsTuple?: []; params?: {} }
    'spotify.callback': { paramsTuple?: []; params?: {} }
    'profile.show': { paramsTuple?: []; params?: {} }
    'profile.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'profile.update': { paramsTuple?: []; params?: {} }
    'leaderboard.index': { paramsTuple?: []; params?: {} }
    'friends.request': { paramsTuple: [ParamValue]; params: {'userId': ParamValue} }
    'friends.accept': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'friends.decline': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'practice.index': { paramsTuple?: []; params?: {} }
    'bandle.index': { paramsTuple?: []; params?: {} }
    'party.index': { paramsTuple?: []; params?: {} }
    'practice.question': { paramsTuple?: []; params?: {} }
    'practice.preview': { paramsTuple?: []; params?: {} }
    'playlists.index': { paramsTuple?: []; params?: {} }
    'playlists.create': { paramsTuple?: []; params?: {} }
    'playlists.store': { paramsTuple?: []; params?: {} }
    'playlists.manual.store': { paramsTuple?: []; params?: {} }
    'playlists.play': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'playlists.party': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'playlists.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'playlists.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'playlists.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'playlists.tracks.search': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'playlists.tracks.add': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'playlists.tracks.remove': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'playlists.share': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'playlists.unshare': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'shareId': ParamValue} }
    'game.index': { paramsTuple?: []; params?: {} }
    'game.starter_playlist': { paramsTuple?: []; params?: {} }
    'game.tracks.search': { paramsTuple?: []; params?: {} }
    'game.create': { paramsTuple?: []; params?: {} }
    'game.lobby': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'game.join': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'game.start': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'game.pause': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'game.resume': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'game.stop': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'game.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'game.play': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'game.answer': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'game.leave': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'game.results': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'game.replay': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'game.state': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.dashboard': { paramsTuple?: []; params?: {} }
    'admin.users': { paramsTuple?: []; params?: {} }
    'admin.ban': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.suspend': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.unban': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.playlists': { paramsTuple?: []; params?: {} }
    'admin.playlists.import': { paramsTuple?: []; params?: {} }
    'admin.playlists.toggle': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.playlists.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.playlists.tracks.update': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'trackId': ParamValue} }
  }
  GET: {
    'home': { paramsTuple?: []; params?: {} }
    'privacy_policy': { paramsTuple?: []; params?: {} }
    'cgu': { paramsTuple?: []; params?: {} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'spotify.redirect': { paramsTuple?: []; params?: {} }
    'spotify.callback': { paramsTuple?: []; params?: {} }
    'profile.show': { paramsTuple?: []; params?: {} }
    'profile.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'leaderboard.index': { paramsTuple?: []; params?: {} }
    'practice.index': { paramsTuple?: []; params?: {} }
    'bandle.index': { paramsTuple?: []; params?: {} }
    'party.index': { paramsTuple?: []; params?: {} }
    'practice.question': { paramsTuple?: []; params?: {} }
    'practice.preview': { paramsTuple?: []; params?: {} }
    'playlists.index': { paramsTuple?: []; params?: {} }
    'playlists.create': { paramsTuple?: []; params?: {} }
    'playlists.play': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'playlists.party': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'playlists.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'playlists.tracks.search': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'game.index': { paramsTuple?: []; params?: {} }
    'game.tracks.search': { paramsTuple?: []; params?: {} }
    'game.lobby': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'game.play': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'game.results': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'game.state': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.dashboard': { paramsTuple?: []; params?: {} }
    'admin.users': { paramsTuple?: []; params?: {} }
    'admin.playlists': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'home': { paramsTuple?: []; params?: {} }
    'privacy_policy': { paramsTuple?: []; params?: {} }
    'cgu': { paramsTuple?: []; params?: {} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'spotify.redirect': { paramsTuple?: []; params?: {} }
    'spotify.callback': { paramsTuple?: []; params?: {} }
    'profile.show': { paramsTuple?: []; params?: {} }
    'profile.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'leaderboard.index': { paramsTuple?: []; params?: {} }
    'practice.index': { paramsTuple?: []; params?: {} }
    'bandle.index': { paramsTuple?: []; params?: {} }
    'party.index': { paramsTuple?: []; params?: {} }
    'practice.question': { paramsTuple?: []; params?: {} }
    'practice.preview': { paramsTuple?: []; params?: {} }
    'playlists.index': { paramsTuple?: []; params?: {} }
    'playlists.create': { paramsTuple?: []; params?: {} }
    'playlists.play': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'playlists.party': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'playlists.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'playlists.tracks.search': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'game.index': { paramsTuple?: []; params?: {} }
    'game.tracks.search': { paramsTuple?: []; params?: {} }
    'game.lobby': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'game.play': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'game.results': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'game.state': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.dashboard': { paramsTuple?: []; params?: {} }
    'admin.users': { paramsTuple?: []; params?: {} }
    'admin.playlists': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'new_account.store': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'profile.update': { paramsTuple?: []; params?: {} }
    'friends.request': { paramsTuple: [ParamValue]; params: {'userId': ParamValue} }
    'friends.accept': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'friends.decline': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'playlists.store': { paramsTuple?: []; params?: {} }
    'playlists.manual.store': { paramsTuple?: []; params?: {} }
    'playlists.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'playlists.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'playlists.tracks.add': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'playlists.tracks.remove': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'playlists.share': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'playlists.unshare': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'shareId': ParamValue} }
    'game.starter_playlist': { paramsTuple?: []; params?: {} }
    'game.create': { paramsTuple?: []; params?: {} }
    'game.join': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'game.start': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'game.pause': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'game.resume': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'game.stop': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'game.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'game.answer': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'game.leave': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'game.replay': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.ban': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.suspend': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.unban': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.playlists.import': { paramsTuple?: []; params?: {} }
    'admin.playlists.toggle': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.playlists.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.playlists.tracks.update': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'trackId': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}