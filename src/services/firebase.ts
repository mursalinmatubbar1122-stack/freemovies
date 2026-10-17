import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteField,
} from 'firebase/firestore';
import { API_CONFIG, ADMIN_CONFIG, DEFAULT_MOVIE_PLAYERS, DEFAULT_TV_PLAYERS, DEFAULT_ANIME_PLAYERS } from '../config/siteConfig';
import { PlayerTemplate, UserProfile } from '../types';

const app = getApps().length === 0 ? initializeApp(API_CONFIG.firebase) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

export function isUserAdmin(user: User | null | undefined): boolean {
  if (!user || !user.email) return false;
  const adminEmails = (ADMIN_CONFIG.adminEmails || []).map(e => e.trim().toLowerCase());
  return adminEmails.includes(user.email.trim().toLowerCase());
}

export async function loadMediaUrls(contentType: string, id: number): Promise<{ downloadUrl: string; playerUrl: string }> {
  try {
    const snap = await getDoc(doc(db, 'media_urls', `${contentType}_${id}`));
    if (snap.exists()) {
      const data = snap.data();
      return {
        downloadUrl: data.downloadUrl || '',
        playerUrl: data.playerUrl || '',
      };
    }
  } catch (e) {
    console.warn('loadMediaUrls:', e);
  }
  return { downloadUrl: '', playerUrl: '' };
}

export async function saveMediaUrl(
  contentType: string,
  id: number,
  type: 'player' | 'download',
  value: string
) {
  const dRef = doc(db, 'media_urls', `${contentType}_${id}`);
  const key = type === 'player' ? 'playerUrl' : 'downloadUrl';
  if (value) {
    await setDoc(dRef, { [key]: value }, { merge: true });
  } else {
    await updateDoc(dRef, { [key]: deleteField() }).catch(() => {});
  }
}

export interface AdminSettingsData {
  iptv: string;
  fifa: string;
  movies: string;
  ltOrder: string[];
  moviePlayers: PlayerTemplate[];
  tvPlayers: PlayerTemplate[];
  animePlayers: PlayerTemplate[];
  dragEnabled?: boolean;
}

export async function loadAdminSettings(): Promise<AdminSettingsData> {
  const fallback: AdminSettingsData = {
    iptv: 'https://iptv-org.github.io/iptv/index.m3u',
    fifa: '#',
    movies: 'https://kwvdnm.movielinkbd.li/',
    ltOrder: ['movies', 'fifa', 'livetv'],
    moviePlayers: DEFAULT_MOVIE_PLAYERS,
    tvPlayers: DEFAULT_TV_PLAYERS,
    animePlayers: DEFAULT_ANIME_PLAYERS,
    dragEnabled: true,
  };

  try {
    const snap = await getDoc(doc(db, 'admin_settings', 'config'));
    if (snap.exists()) {
      const d = snap.data();
      return {
        iptv: d.iptv !== undefined ? d.iptv : fallback.iptv,
        fifa: d.fifa !== undefined ? d.fifa : fallback.fifa,
        movies: d.movies !== undefined ? d.movies : fallback.movies,
        ltOrder: d.ltOrder && d.ltOrder.length ? d.ltOrder : fallback.ltOrder,
        moviePlayers: d.moviePlayers && d.moviePlayers.length ? d.moviePlayers : fallback.moviePlayers,
        tvPlayers: d.tvPlayers && d.tvPlayers.length ? d.tvPlayers : fallback.tvPlayers,
        animePlayers: d.animePlayers && d.animePlayers.length ? d.animePlayers : fallback.animePlayers,
        dragEnabled: d.dragEnabled !== undefined ? d.dragEnabled : true,
      };
    }
  } catch (e) {
    console.warn('loadAdminSettings error:', e);
  }
  return fallback;
}

export async function saveAdminSettings(patch: Partial<AdminSettingsData>) {
  try {
    await setDoc(doc(db, 'admin_settings', 'config'), patch, { merge: true });
  } catch (e) {
    console.warn('saveAdminSettings error:', e);
  }
}

export async function loadUserProfile(uid: string): Promise<Partial<UserProfile>> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data() as Partial<UserProfile>;
    }
  } catch (e) {
    console.warn('loadUserProfile error:', e);
  }
  return {};
}

export async function saveUserProfile(uid: string, data: Partial<UserProfile>) {
  try {
    await setDoc(doc(db, 'users', uid), data, { merge: true });
  } catch (e) {
    console.warn('saveUserProfile error:', e);
  }
}

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
};
