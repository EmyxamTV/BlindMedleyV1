export interface DeezerTrack {
  id: number;
  title: string;
  duration: number;
  preview: string;
  artist: { id: number; name: string };
  album: { id: number; title: string; cover_medium: string; release_date: string };
}

export interface DeezerPlaylist {
  id: number;
  title: string;
  description: string;
  picture_medium: string;
  nb_tracks: number;
  tracks: { data: DeezerTrack[] };
}
