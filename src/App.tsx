import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { ContentType, MediaItem } from './types';
import {
  fetchPage,
  discoverMedia,
  searchMulti,
  tmdb,
  fetchAniListById,
  anilistToItem,
} from './services/api';
import {
  auth,
  onAuthStateChanged,
  isUserAdmin,
  loadAdminSettings,
  AdminSettingsData,
} from './services/firebase';
import { TopBar } from './components/TopBar';
import { Header } from './components/Header';
import { AdvancedFilter } from './components/AdvancedFilter';
import { FeaturedCarousel } from './components/FeaturedCarousel';
import { MediaGrid } from './components/MediaGrid';
import { LiveTVSection } from './components/LiveTVSection';
import { DetailModal } from './components/DetailModal';
import { PersonModal } from './components/PersonModal';
import { AuthModal } from './components/AuthModal';
import { AdminModal } from './components/AdminModal';
import { FloatingControls } from './components/FloatingControls';
import { DEFAULT_MOVIE_PLAYERS, DEFAULT_TV_PLAYERS, DEFAULT_ANIME_PLAYERS } from './config/siteConfig';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<ContentType>('movie');
  const [items, setItems] = useState<MediaItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isAdvOpen, setIsAdvOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sectionTitle, setSectionTitle] = useState('Movies');
  const [isDiscoverMode, setIsDiscoverMode] = useState(false);
  const [discoverFilters, setDiscoverFilters] = useState<any>(null);
  const [isDragEnabled, setIsDragEnabled] = useState(true);

  const [adminSettings, setAdminSettings] = useState<AdminSettingsData>({
    iptv: 'https://iptv-org.github.io/iptv/index.m3u',
    fifa: '#',
    movies: 'https://kwvdnm.movielinkbd.li/',
    ltOrder: ['movies', 'fifa', 'livetv'],
    moviePlayers: DEFAULT_MOVIE_PLAYERS,
    tvPlayers: DEFAULT_TV_PLAYERS,
    animePlayers: DEFAULT_ANIME_PLAYERS,
    dragEnabled: true,
  });

  // Track Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      setIsAdmin(isUserAdmin(user));
    });
    return () => unsub();
  }, []);

  // Load Admin Settings
  useEffect(() => {
    loadAdminSettings().then(s => {
      setAdminSettings(s);
    });
  }, []);

  // Check Hash for Deep-Linking
  useEffect(() => {
    const openFromHash = async () => {
      const hash = window.location.hash;
      if (!hash || !hash.startsWith('#/')) return;
      const parts = hash.slice(2).split('/');
      if (parts.length < 3) return;
      const type = parts[0] as 'movie' | 'tv' | 'anime';
      const id = parseInt(parts[parts.length - 1], 10);
      if (!id) return;

      try {
        if (type === 'anime') {
          const m = await fetchAniListById(id);
          if (m) setSelectedItem(anilistToItem(m));
        } else {
          const d = await tmdb(`/${type}/${id}`);
          if (d && d.id) {
            setSelectedItem({ ...d, contentType: type });
          }
        }
      } catch {}
    };

    openFromHash();
  }, []);

  // Load initial content on Tab change
  const loadTabContent = useCallback(async (tab: ContentType) => {
    if (tab === 'livetv') return;
    setLoading(true);
    setPage(1);
    setIsDiscoverMode(false);
    setDiscoverFilters(null);

    const titleMap: Record<string, string> = {
      movie: 'Movies',
      tv: 'TV Shows',
      anime: 'Anime',
    };
    setSectionTitle(titleMap[tab] || 'Movies');

    try {
      const initialItems = await fetchPage(tab as any, 1);
      setItems(initialItems);
      setHasMore(initialItems.length > 0);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTabContent(currentTab);
  }, [currentTab, loadTabContent]);

  // Load More / Pagination
  const handleLoadMore = async () => {
    if (loading || !hasMore || currentTab === 'livetv') return;
    setLoading(true);
    const nextPage = page + 1;

    try {
      if (isDiscoverMode && discoverFilters) {
        const nextItems = await discoverMedia(discoverFilters.type, discoverFilters, nextPage);
        if (nextItems.length === 0) {
          setHasMore(false);
        } else {
          setItems(prev => {
            const existingIds = new Set(prev.map(i => `${i.contentType}-${i.id}`));
            const unique = nextItems.filter(i => !existingIds.has(`${i.contentType}-${i.id}`));
            return [...prev, ...unique];
          });
          setPage(nextPage);
        }
      } else {
        const nextItems = await fetchPage(currentTab as any, nextPage);
        if (nextItems.length === 0 || page >= 15) {
          setHasMore(false);
        } else {
          setItems(prev => {
            const existingIds = new Set(prev.map(i => `${i.contentType}-${i.id}`));
            const unique = nextItems.filter(i => !existingIds.has(`${i.contentType}-${i.id}`));
            return [...prev, ...unique];
          });
          setPage(nextPage);
        }
      }
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  // Search handler
  const handleSearchSubmit = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setSectionTitle(`Search Results: "${q}"`);
    setIsDiscoverMode(false);

    try {
      const { media } = await searchMulti(q);
      setItems(media);
      setHasMore(false);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Discover handler
  const handleDiscover = async (filters: any) => {
    setLoading(true);
    setIsDiscoverMode(true);
    setDiscoverFilters(filters);
    setPage(1);

    const typeNames: Record<string, string> = { movie: 'Movies', tv: 'TV Shows', anime: 'Anime' };
    setSectionTitle(`Discovered ${typeNames[filters.type] || 'Titles'}`);

    try {
      const discItems = await discoverMedia(filters.type, filters, 1);
      setItems(discItems);
      setHasMore(discItems.length > 0);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setIsAdvOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="app-container">
      {/* TOPBAR */}
      <TopBar onSelectItem={item => setSelectedItem(item)} />

      {/* HEADER */}
      <Header
        currentTab={currentTab}
        onSelectTab={tab => {
          setCurrentTab(tab);
        }}
        onSearchSubmit={handleSearchSubmit}
        onSelectItem={item => setSelectedItem(item)}
        onSelectPerson={id => setSelectedPersonId(id)}
        isAdvOpen={isAdvOpen}
        onToggleAdv={() => setIsAdvOpen(prev => !prev)}
      />

      {/* ADVANCED FILTER */}
      <AdvancedFilter
        isOpen={isAdvOpen}
        onDiscover={handleDiscover}
      />

      {/* MAIN VIEW CONTENT */}
      {currentTab === 'livetv' ? (
        <LiveTVSection adminSettings={adminSettings} />
      ) : (
        <>
          {/* FEATURED CAROUSEL */}
          {!isDiscoverMode && items.length > 0 && (
            <FeaturedCarousel
              items={items}
              onSelectItem={item => setSelectedItem(item)}
            />
          )}

          {/* MEDIA GRID */}
          <MediaGrid
            items={items}
            title={sectionTitle}
            loading={loading}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
            onSelectItem={item => setSelectedItem(item)}
          />
        </>
      )}

      {/* MEDIA DETAIL MODAL */}
      <DetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onSelectPerson={id => setSelectedPersonId(id)}
        isAdmin={isAdmin}
        adminSettings={adminSettings}
      />

      {/* PERSON MODAL */}
      <PersonModal
        personId={selectedPersonId}
        onClose={() => setSelectedPersonId(null)}
        onSelectItem={item => setSelectedItem(item)}
      />

      {/* AUTH MODAL */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        isAdmin={isAdmin}
        isDragEnabled={isDragEnabled}
        onToggleDrag={() => setIsDragEnabled(prev => !prev)}
      />

      {/* ADMIN MODAL */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        settings={adminSettings}
        onUpdateSettings={setAdminSettings}
      />

      {/* FLOATING CONTROLS */}
      <FloatingControls
        currentUser={currentUser}
        isAdmin={isAdmin}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />
    </div>
  );
};
