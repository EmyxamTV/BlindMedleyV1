export interface SpotifyTokenResponse {
  access_token: string;
  expires_in: number;
}

export interface SpotifyTrackObject {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { name: string; images: { url: string }[]; release_date: string };
  preview_url: string | null;
  duration_ms: number;
  popularity: number;
}

export interface SpotifyPlaylistObject {
  id: string;
  name: string;
  description: string;
  images: { url: string }[];
  tracks: { total: number };
}
