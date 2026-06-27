import Playlist from "#models/playlist";
import { DeezerService } from "#services/deezer_service";
import { SpotifyService } from "#services/spotify_service";
import { inject } from "@adonisjs/core";

type ImportOptions = {
  userId?: string;
  visibility: "public" | "private";
};

@inject()
export class PlaylistImportService {
  constructor(
    private readonly spotifyService: SpotifyService,
    private readonly deezerService: DeezerService,
  ) {}

  async importFromUrl(url: string, options: ImportOptions): Promise<Playlist> {
    const deezerMatch = url.match(/deezer\.com\/(?:[a-z]+\/)?playlist\/(\d+)/);
    if (deezerMatch) {
      return this.deezerService.importPlaylist(deezerMatch[1], {
        playlistKey:
          options.visibility === "private"
            ? `private:${options.userId}:deezer:${deezerMatch[1]}`
            : undefined,
        createdBy: options.userId,
        visibility: options.visibility,
      });
    }

    const spotifyMatch = url.match(/playlist\/([a-zA-Z0-9]+)/);
    if (spotifyMatch) {
      return this.spotifyService.importPlaylist(spotifyMatch[1], {
        playlistKey:
          options.visibility === "private"
            ? `private:${options.userId}:spotify:${spotifyMatch[1]}`
            : undefined,
        createdBy: options.userId,
        visibility: options.visibility,
      });
    }

    throw new Error("INVALID_PLAYLIST_URL");
  }
}
