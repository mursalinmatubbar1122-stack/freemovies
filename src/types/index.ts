export type ContentType = 'movie' | 'tv' | 'anime' | 'livetv';

export interface MediaItem {
  id: number;
  contentType: 'movie' | 'tv' | 'anime';
  title?: string;
  name?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  overview?: string;
  idMal?: number | null;
  _tmdbId?: number;
}

export interface CastMember {
  id: number;
  name: string;
  character?: string;
  profile_path?: string | null;
  _aniprofile?: string | null;
}

export interface MediaDetail extends MediaItem {
  genres?: { id?: number; name: string }[];
  runtime?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  seasons?: {
    season_number: number;
    episode_count: number;
    name?: string;
  }[];
  external_ids?: {
    imdb_id?: string;
  };
  imdb_id?: string;
  videos?: {
    results: {
      key: string;
      site: string;
      type: string;
    }[];
  };
  _anilistCast?: CastMember[];
}

export interface PersonItem {
  id: number;
  name: string;
  profile_path?: string | null;
  known_for_department?: string;
  biography?: string;
  media_type?: string;
}

export interface IPTVChannel {
  id: string;
  name: string;
  group: string;
  logo: string;
  url: string;
  country?: string;
}

export interface PlayerTemplate {
  label: string;
  url: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName?: string | null;
  photoUrl?: string | null;
  bio?: string;
  role?: 'admin' | 'member';
}
