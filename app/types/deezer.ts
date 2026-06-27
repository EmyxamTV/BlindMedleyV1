export interface DeezerTrack {
  id: number;
  title: string;
  duration: number;
  preview: string | null;
  artist: { id: number; name: string };
  album: { id: number; title: string; cover_medium: string | null; release_date: string | null };
}

export interface DeezerPlaylist {
  id: number;
  title: string;
  description: string;
  picture_medium: string;
  nb_tracks: number;
  tracks: { data: DeezerTrack[] };
}
