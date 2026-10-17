import { PlayerTemplate } from '../types';

export const SITE_CONFIG = {
  siteName: 'FreeMovies',
  pageTitle: 'Free Movies - Watch Movies, TV Shows & Anime',
  logoText: 'Free Movies',
  primaryColor: '#FF0000',
};

export const API_CONFIG = {
  firebase: {
    apiKey: 'AIzaSyBcR8zJrTkstjda22JEdVTaJ3FROmREdLA',
    authDomain: 'cinemabazar-600b0.firebaseapp.com',
    projectId: 'cinemabazar-600b0',
    storageBucket: 'cinemabazar-600b0.firebasestorage.app',
    messagingSenderId: '62690080088',
    appId: '1:62690080088:web:f4e7042fb4ad8248cce12d',
  },
  tmdb: {
    apiKey: '9d0f10dd934f1c2a6e91954041550593',
    apiBaseUrl: 'https://api.themoviedb.org/3',
    imageBaseUrl: 'https://image.tmdb.org/t/p',
  },
  anilist: {
    apiUrl: 'https://graphql.anilist.co',
    animeId: 47880,
  },
  imgbb: {
    apiKey: '9cf974acba9d5d5d715bf14db07d697a',
    uploadUrl: 'https://api.imgbb.com/1/upload',
  },
};

export const ADMIN_CONFIG = {
  adminEmails: ['rizviyankhan@gmail.com', 'mursalinmatubbar1122@gmail.com'],
  profile: {
    name: 'Free Movies',
    imageUrl: '',
    about: 'GoToCinema administrator',
  },
};

export const SOCIAL_MEDIA_CONFIG = {
  facebook: 'https://www.facebook.com/',
  youtube: 'https://www.youtube.com/',
  telegram: 'https://web.telegram.org/',
  instagram: 'https://www.instagram.com/',
};

export const AD_CONFIG = {
  adsTimer: {
    name: 'Ads Timer',
    status: 'on',
    activeMinutes: 10,
    repeatEveryHours: 12,
  },
  directLink: {
    name: 'Direct link',
    status: 'on',
    duration: 'unlimited',
    url: 'https://www.effectivecpmnetwork.com/mt31bk6kgi?key=84312ad83e3a46232ecefedfb95bd705',
  },
  nativeBanner: {
    name: 'Native Banner',
    status: 'on',
    duration: 'unlimited',
    scriptSrc: 'https://pl30885733.effectivecpmnetwork.com/b3775426ad737420670c584a89ecce53/invoke.js',
    containerId: 'container-b3775426ad737420670c584a89ecce53',
  },
  popunder: {
    name: 'Popunder',
    status: 'on',
    duration: '#',
    scriptSrc: 'https://pl30885732.effectivecpmnetwork.com/25/67/6c/25676c4aa2ea8cc3aad3ebbe747b7fea.js',
  },
  socialBar: {
    name: 'Social Bar',
    status: 'on',
    duration: '#',
    scriptSrc: 'https://pl30885734.effectivecpmnetwork.com/49/e6/2a/49e62aa249254fb00f321008acda713e.js',
  },
  banner728x90: {
    name: 'Banner 728x90',
    status: 'on',
    duration: 'unlimited',
    key: '3c9dc0777afb301a335c35f834cc22a1',
    scriptSrc: 'https://www.highperformanceformat.com/3c9dc0777afb301a335c35f834cc22a1/invoke.js',
  },
};

export const DEFAULT_MOVIE_PLAYERS: PlayerTemplate[] = [
  { label: 'Player 1', url: 'https://cinemaos.in/movie/watch/{id}' },
  { label: 'Player 2', url: 'https://cinemaos.tech/player/{id}' },
  { label: 'Player 3', url: 'https://peachify.top/embed/movie/{id}' },
  { label: 'Player 4', url: 'https://boredflix.cc/movie/{id}' },
  { label: 'Player 5', url: 'https://vidbinge.to/movie/{id}' },
];

export const DEFAULT_TV_PLAYERS: PlayerTemplate[] = [
  { label: 'Player 1', url: 'https://cinemaos.in/tv/watch/{id}?s={s}&e={e}' },
  { label: 'Player 2', url: 'https://cinemaos.tech/player/{id}/{s}/{e}' },
  { label: 'Player 3', url: 'https://embed.streammafia.to/embed/tv/{id}/{s}/{e}' },
  { label: 'Player 4', url: 'https://vembed.click/play/{id}?s={s}&e={e}' },
  { label: 'Player 5', url: 'https://multiembed.mov/?video_id={id}&s={s}&e={e}' },
];

export const DEFAULT_ANIME_PLAYERS: PlayerTemplate[] = [
  { label: 'Player 1', url: 'https://cinemaos.live/animeplayer/watch/{id}/{e}' },
];

export const ALL_LANGUAGES = [
  { v: '', l: 'Any Language' },
  { v: 'en', l: 'English' },
  { v: 'es', l: 'Spanish' },
  { v: 'fr', l: 'French' },
  { v: 'ja', l: 'Japanese' },
  { v: 'ko', l: 'Korean' },
  { v: 'hi', l: 'Hindi' },
  { v: 'bn', l: 'Bengali' },
  { v: 'de', l: 'German' },
  { v: 'it', l: 'Italian' },
  { v: 'zh', l: 'Chinese' },
  { v: 'ru', l: 'Russian' },
  { v: 'pt', l: 'Portuguese' },
  { v: 'ar', l: 'Arabic' },
  { v: 'tr', l: 'Turkish' },
  { v: 'th', l: 'Thai' },
  { v: 'id', l: 'Indonesian' },
  { v: 'vi', l: 'Vietnamese' },
  { v: 'nl', l: 'Dutch' },
  { v: 'pl', l: 'Polish' },
  { v: 'sv', l: 'Swedish' },
  { v: 'da', l: 'Danish' },
  { v: 'fi', l: 'Finnish' },
  { v: 'no', l: 'Norwegian' },
  { v: 'el', l: 'Greek' },
  { v: 'he', l: 'Hebrew' },
  { v: 'fa', l: 'Persian' },
  { v: 'ur', l: 'Urdu' },
  { v: 'ta', l: 'Tamil' },
  { v: 'te', l: 'Telugu' },
  { v: 'ml', l: 'Malayalam' },
  { v: 'mr', l: 'Marathi' },
];

export const MOVIE_GENRES = [
  { v: '', l: 'Any Genre' },
  { v: '28', l: 'Action' },
  { v: '12', l: 'Adventure' },
  { v: '16', l: 'Animation' },
  { v: '35', l: 'Comedy' },
  { v: '80', l: 'Crime' },
  { v: '99', l: 'Documentary' },
  { v: '18', l: 'Drama' },
  { v: '14', l: 'Fantasy' },
  { v: '27', l: 'Horror' },
  { v: '10749', l: 'Romance' },
  { v: '878', l: 'Sci-Fi' },
  { v: '53', l: 'Thriller' },
];

export const TV_GENRES = [
  { v: '', l: 'Any Genre' },
  { v: '10759', l: 'Action & Adventure' },
  { v: '16', l: 'Animation' },
  { v: '35', l: 'Comedy' },
  { v: '80', l: 'Crime' },
  { v: '18', l: 'Drama' },
  { v: '14', l: 'Fantasy' },
  { v: '27', l: 'Horror' },
  { v: '10749', l: 'Romance' },
  { v: '10765', l: 'Sci-Fi & Fantasy' },
  { v: '9648', l: 'Mystery' },
];
