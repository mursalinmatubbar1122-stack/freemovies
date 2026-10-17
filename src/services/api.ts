import { API_CONFIG } from '../config/siteConfig';
import { CastMember, ContentType, IPTVChannel, MediaDetail, MediaItem, PersonItem } from '../types';

const TMDB_KEY = API_CONFIG.tmdb.apiKey;
const TMDB_BASE_URL = API_CONFIG.tmdb.apiBaseUrl;
const ANILIST_URL = API_CONFIG.anilist.apiUrl;
const IMG = API_CONFIG.tmdb.imageBaseUrl;

export const PH = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="300"%3E%3Crect width="200" height="300" fill="%231a1a2e"/%3E%3Ctext x="100" y="155" text-anchor="middle" fill="%23666" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E';
export const AVPH = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="185" height="278"%3E%3Crect width="185" height="278" fill="%231e293b"/%3E%3Ccircle cx="92" cy="90" r="38" fill="%23334155"/%3E%3Cellipse cx="92" cy="210" rx="60" ry="50" fill="%23334155"/%3E%3C/svg%3E';

export function getTitle(item: MediaItem | MediaDetail | null | undefined): string {
  if (!item) return 'Unknown';
  return item.title || item.name || 'Unknown';
}

export function getYear(item: MediaItem | MediaDetail | null | undefined): string {
  if (!item) return '';
  const d = item.release_date || item.first_air_date || '';
  return d ? d.slice(0, 4) : '';
}

export function imgUrl(path?: string | null, size = 'w342'): string {
  if (!path) return PH;
  if (path.startsWith('http')) return path;
  return `${IMG}/${size}${path}`;
}

export function typeBg(type: ContentType | string): string {
  if (type === 'tv') return '#1d4ed8';
  if (type === 'anime') return '#7c3aed';
  return '#b91c1c';
}

export function typeLabel(type: ContentType | string): string {
  if (type === 'tv') return 'TV';
  if (type === 'anime') return 'ANIME';
  return 'MOVIE';
}

export function normalizeEmbed(raw: string): string {
  const t = (raw || '').trim();
  if (!t) return '';
  if (/^[a-zA-Z0-9_-]{11}$/.test(t)) {
    return `https://www.youtube.com/embed/${t}?autoplay=1`;
  }
  const yt = t.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?autoplay=1`;
  if (/youtube\.com\/embed\//.test(t)) {
    return t.includes('autoplay') ? t : `${t}${t.includes('?') ? '&' : '?'}autoplay=1`;
  }
  const gd = t.match(/drive\.google\.com\/file\/d\/([^/?#]+)/);
  if (gd) return `https://drive.google.com/file/d/${gd[1]}/preview`;
  const ar = t.match(/archive\.org\/details\/([^/?#]+)/);
  if (ar) return `https://archive.org/embed/${ar[1]}`;
  return t;
}

export async function tmdb(ep: string, params: Record<string, string | number> = {}) {
  const u = new URL(`${TMDB_BASE_URL}${ep}`);
  u.searchParams.set('api_key', TMDB_KEY);
  Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, String(v)));
  const r = await fetch(u.toString());
  if (!r.ok) throw new Error(`TMDB error ${r.status}`);
  return r.json();
}

export async function fetchTrending(): Promise<MediaItem[]> {
  try {
    const data = await tmdb('/trending/all/day');
    return (data.results || []).map((r: any) => ({
      ...r,
      contentType: r.media_type === 'tv' ? 'tv' : 'movie',
    }));
  } catch {
    return [];
  }
}

const ANILIST_Q = `query($page:Int,$perPage:Int,$sort:[MediaSort]){Page(page:$page,perPage:$perPage){pageInfo{hasNextPage}media(type:ANIME,sort:$sort,isAdult:false){id idMal title{romaji english}coverImage{large}averageScore startDate{year month day}format description(asHtml:false)episodes}}}`;
const ANILIST_ID_Q = `query($id:Int){Media(id:$id,type:ANIME){id idMal title{romaji english}coverImage{large}averageScore startDate{year month day}format description(asHtml:false)episodes}}`;

export async function fetchAniList(variables: Record<string, any>) {
  const r = await fetch(ANILIST_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query: ANILIST_Q, variables }),
  });
  if (!r.ok) throw new Error(`AniList error ${r.status}`);
  const d = await r.json();
  return d.data?.Page?.media || [];
}

export async function fetchAniListById(id: number) {
  const r = await fetch(ANILIST_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query: ANILIST_ID_Q, variables: { id } }),
  });
  if (!r.ok) return null;
  const d = await r.json();
  return d.data?.Media || null;
}

export function anilistToItem(m: any): MediaItem {
  const isMovie = m.format === 'MOVIE';
  const title = m.title?.english || m.title?.romaji || 'Unknown';
  const sd = m.startDate || {};
  const date = sd.year
    ? `${sd.year}-${String(sd.month || 1).padStart(2, '0')}-${String(sd.day || 1).padStart(2, '0')}`
    : '';

  if (isMovie) {
    return {
      id: m.id,
      idMal: m.idMal || null,
      title,
      release_date: date,
      vote_average: m.averageScore ? +(m.averageScore / 10).toFixed(1) : 0,
      poster_path: m.coverImage?.large || null,
      overview: (m.description || '').replace(/<[^>]+>/g, '').replace(/&[a-z]+;/gi, ''),
      contentType: 'movie',
    };
  }
  return {
    id: m.id,
    idMal: m.idMal || null,
    name: title,
    first_air_date: date,
    vote_average: m.averageScore ? +(m.averageScore / 10).toFixed(1) : 0,
    poster_path: m.coverImage?.large || null,
    overview: (m.description || '').replace(/<[^>]+>/g, '').replace(/&[a-z]+;/gi, ''),
    contentType: 'anime',
  };
}

export async function fetchPage(type: 'movie' | 'tv' | 'anime', page: number): Promise<MediaItem[]> {
  if (type === 'movie') {
    const d = await tmdb('/movie/popular', { page });
    return (d.results || []).map((r: any) => ({ ...r, contentType: 'movie' }));
  }
  if (type === 'tv') {
    const d = await tmdb('/tv/popular', { page });
    return (d.results || []).map((r: any) => ({ ...r, contentType: 'tv' }));
  }
  // Anime
  const sortMap: Record<number, string[]> = {
    1: ['TRENDING_DESC'],
    2: ['START_DATE_DESC'],
    3: ['POPULARITY_DESC'],
  };
  const alSort = sortMap[page] || ['POPULARITY_DESC'];
  const alPage = page > 3 ? page - 2 : 1;
  const results = await fetchAniList({ page: alPage, perPage: 30, sort: alSort });
  const items = results.map(anilistToItem);
  if (page === 1 && API_CONFIG.anilist.animeId) {
    try {
      const feat = await fetchAniListById(API_CONFIG.anilist.animeId);
      if (feat) {
        const featItem = anilistToItem(feat);
        return [featItem, ...items.filter(i => i.id !== featItem.id)];
      }
    } catch {}
  }
  return items;
}

export async function searchMulti(query: string): Promise<{ people: PersonItem[]; media: MediaItem[] }> {
  const d = await tmdb('/search/multi', { query, page: 1 });
  const people = (d.results || [])
    .filter((r: any) => r.media_type === 'person')
    .map((p: any) => ({
      id: p.id,
      name: p.name,
      profile_path: p.profile_path,
      known_for_department: p.known_for_department || 'Person',
    }));
  const media = (d.results || [])
    .filter((r: any) => r.media_type === 'movie' || r.media_type === 'tv')
    .map((r: any) => ({
      ...r,
      contentType: r.media_type,
    }));
  return { people, media };
}

export async function discoverMedia(
  type: 'movie' | 'tv' | 'anime',
  filters: { lang?: string; genre?: string; year?: string; sort?: string },
  page = 1
): Promise<MediaItem[]> {
  const params: Record<string, string | number> = {
    sort_by: filters.sort || 'popularity.desc',
    page,
  };
  if (filters.genre) params.with_genres = filters.genre;
  if (filters.lang) params.with_original_language = filters.lang;
  if (filters.year) {
    if (type === 'movie') params.primary_release_year = filters.year;
    else params.first_air_date_year = filters.year;
  }
  if (type === 'anime') {
    params.with_genres = filters.genre || '16';
    params.with_origin_country = 'JP';
    delete params.with_original_language;
  }

  const ep = type === 'movie' ? '/discover/movie' : '/discover/tv';
  const ct = type === 'anime' ? 'anime' : type;
  const d = await tmdb(ep, params);
  return (d.results || []).map((r: any) => ({ ...r, contentType: ct }));
}

export async function fetchMediaDetail(item: MediaItem): Promise<MediaDetail> {
  const ct = item.contentType;
  if (ct === 'anime') {
    const aniQ = `query($id:Int){Media(id:$id,type:ANIME){id title{romaji english}coverImage{extraLarge large}episodes averageScore description(asHtml:false)startDate{year}genres studios{nodes{name}}trailer{id site}characters(role:MAIN,sort:ID,page:1,perPage:12){edges{node{id name{full}image{large}}role}}}}`;
    const res = await fetch(ANILIST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: aniQ, variables: { id: item.id } }),
    });
    const data = await res.json();
    const media = data?.data?.Media;
    if (media) {
      const tKey = media.trailer?.site === 'youtube' ? media.trailer.id : null;
      const epCount = media.episodes || 0;
      return {
        ...item,
        name: media.title?.english || media.title?.romaji || item.name,
        poster_path: media.coverImage?.extraLarge || media.coverImage?.large || item.poster_path,
        genres: (media.genres || []).map((g: string) => ({ name: g })),
        seasons: epCount ? [{ season_number: 1, episode_count: epCount, name: 'Season 1' }] : [],
        overview: (media.description || '').replace(/<[^>]+>/g, '').replace(/&[a-z]+;/gi, ''),
        runtime: 24,
        videos: { results: tKey ? [{ key: tKey, site: 'YouTube', type: 'Trailer' }] : [] },
        _anilistCast: (media.characters?.edges || []).map((e: any) => ({
          id: e.node.id,
          name: e.node.name?.full || '',
          character: 'Main Character',
          _aniprofile: e.node.image?.large,
        })),
      };
    }
  }

  // Movie or TV
  let tmdbId = item.id;
  if (item.idMal != null) {
    const sr = await tmdb('/search/movie', { query: item.title || '', page: 1 }).catch(() => ({ results: [] }));
    if (sr.results && sr.results[0]) tmdbId = sr.results[0].id;
  }

  const ep = ct === 'tv' ? `/tv/${tmdbId}` : `/movie/${tmdbId}`;
  const d = await tmdb(ep, { append_to_response: 'external_ids,videos' });
  return {
    ...item,
    ...d,
    contentType: ct,
  };
}

export async function fetchCast(item: MediaItem): Promise<CastMember[]> {
  if (item.contentType === 'anime') return [];
  const credId = item._tmdbId || item.id;
  const credEp = item.contentType === 'tv' ? `/tv/${credId}/credits` : `/movie/${credId}/credits`;
  try {
    const c = await tmdb(credEp);
    return (c.cast || []).slice(0, 20);
  } catch {
    return [];
  }
}

export async function fetchPerson(id: number): Promise<{ person: PersonItem; works: MediaItem[] }> {
  const [p, c] = await Promise.all([
    tmdb(`/person/${id}`),
    tmdb(`/person/${id}/combined_credits`),
  ]);
  const allWorks = (c.cast || [])
    .filter((w: any) => w.media_type === 'movie' || w.media_type === 'tv')
    .sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0))
    .filter((w: any) => w.poster_path)
    .map((w: any) => ({
      ...w,
      contentType: w.media_type,
    }));
  return { person: p, works: allWorks };
}

export async function imgbbUpload(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('image', file);
  const r = await fetch(`${API_CONFIG.imgbb.uploadUrl}?key=${API_CONFIG.imgbb.apiKey}`, {
    method: 'POST',
    body: fd,
  });
  if (!r.ok) throw new Error(`Upload failed (${r.status})`);
  const d = await r.json();
  if (!d.success) throw new Error(d.error?.message || 'Upload failed');
  return d.data.url;
}

export function parseM3U(m3uText: string): IPTVChannel[] {
  const lines = m3uText.split(/\r?\n/);
  const channels: IPTVChannel[] = [];
  let currentInfo: any = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('#EXTINF:')) {
      const nameMatch = line.match(/,(.+)$/);
      const groupMatch = line.match(/group-title="([^"]*)"/);
      const logoMatch = line.match(/tvg-logo="([^"]*)"/);
      const idMatch = line.match(/tvg-id="([^"]*)"/);

      currentInfo = {
        name: nameMatch ? nameMatch[1].trim() : 'Unknown Channel',
        group: groupMatch && groupMatch[1] ? groupMatch[1].trim() : 'General',
        logo: logoMatch ? logoMatch[1].trim() : '',
        id: idMatch ? idMatch[1].trim() : `ch-${channels.length}`,
      };
    } else if (line.startsWith('http://') || line.startsWith('https://')) {
      if (currentInfo) {
        channels.push({
          id: currentInfo.id || `ch-${channels.length}`,
          name: currentInfo.name,
          group: currentInfo.group,
          logo: currentInfo.logo,
          url: line,
        });
        currentInfo = null;
      }
    }
  }
  return channels;
}
