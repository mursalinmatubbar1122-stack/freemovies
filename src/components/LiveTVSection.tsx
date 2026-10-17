import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { IPTVChannel } from '../types';
import { parseM3U } from '../services/api';
import { AdminSettingsData } from '../services/firebase';

interface LiveTVSectionProps {
  adminSettings: AdminSettingsData;
}

export const LiveTVSection: React.FC<LiveTVSectionProps> = ({ adminSettings }) => {
  const [subTab, setSubTab] = useState<'livetv' | 'fifa' | 'movies'>('livetv');
  const [channels, setChannels] = useState<IPTVChannel[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<IPTVChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<IPTVChannel | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [streamError, setStreamError] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Tab ordering from admin settings
  const tabOrder = adminSettings.ltOrder && adminSettings.ltOrder.length === 3
    ? adminSettings.ltOrder
    : ['movies', 'fifa', 'livetv'];

  // Initial tab set from admin order
  useEffect(() => {
    if (tabOrder[0] && ['livetv', 'fifa', 'movies'].includes(tabOrder[0])) {
      setSubTab(tabOrder[0] as any);
    }
  }, [tabOrder]);

  // Load M3U playlist
  useEffect(() => {
    const fetchChannels = async () => {
      setIsLoading(true);
      const CACHE_KEY = 'gtc_iptv_cache_react';
      const CACHE_TTL = 6 * 3600 * 1000;

      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Date.now() - parsed.ts < CACHE_TTL && parsed.channels?.length) {
            setChannels(parsed.channels);
            setFilteredChannels(parsed.channels);
            setSelectedChannel(parsed.channels[0]);
            extractCategories(parsed.channels);
            setIsLoading(false);
            return;
          }
        }
      } catch {}

      try {
        const res = await fetch(adminSettings.iptv || 'https://iptv-org.github.io/iptv/index.m3u');
        if (res.ok) {
          const text = await res.text();
          const parsed = parseM3U(text);
          setChannels(parsed);
          setFilteredChannels(parsed);
          if (parsed.length > 0) {
            setSelectedChannel(parsed[0]);
          }
          extractCategories(parsed);
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ channels: parsed, ts: Date.now() })
          );
        }
      } catch (err) {
        console.warn('IPTV fetch error:', err);
      }
      setIsLoading(false);
    };

    fetchChannels();
  }, [adminSettings.iptv]);

  const extractCategories = (chList: IPTVChannel[]) => {
    const cats = Array.from(new Set(chList.map(c => c.group))).sort();
    setCategories(cats);
  };

  // Filter channels
  useEffect(() => {
    let list = channels;
    if (selectedCategory) {
      list = list.filter(c => c.group === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        c => c.name.toLowerCase().includes(q) || c.group.toLowerCase().includes(q)
      );
    }
    setFilteredChannels(list);
  }, [channels, selectedCategory, searchQuery]);

  // Play stream
  useEffect(() => {
    if (subTab !== 'livetv' || !selectedChannel || !videoRef.current) return;

    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    setStreamError(false);

    const video = videoRef.current;
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const url = selectedChannel.url;

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, manifestLoadingMaxRetry: 2 });
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          triggerStreamError();
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.play().catch(() => {});
      video.onerror = triggerStreamError;
    } else {
      video.src = url;
      video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [selectedChannel, subTab]);

  const triggerStreamError = () => {
    setStreamError(true);
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    retryTimerRef.current = setTimeout(() => {
      setStreamError(false);
      handlePlayNext();
    }, 3500);
  };

  const handlePlayNext = () => {
    if (!filteredChannels.length || !selectedChannel) return;
    const idx = filteredChannels.findIndex(c => c.id === selectedChannel.id);
    const next = filteredChannels[(idx + 1) % filteredChannels.length];
    if (next) setSelectedChannel(next);
  };

  const handlePlayPrev = () => {
    if (!filteredChannels.length || !selectedChannel) return;
    const idx = filteredChannels.findIndex(c => c.id === selectedChannel.id);
    const prev = filteredChannels[(idx - 1 + filteredChannels.length) % filteredChannels.length];
    if (prev) setSelectedChannel(prev);
  };

  const TAB_LABELS: Record<string, string> = {
    livetv: '📡 LIVE TV',
    fifa: '⚽ Sports / FIFA',
    movies: '🎬 Movies Stream',
  };

  return (
    <div className="livetv-container">
      <div className="livetv-tabs">
        {tabOrder.map(tabKey => (
          <button
            key={tabKey}
            className={`livetv-tab-btn ${subTab === tabKey ? 'active' : ''}`}
            onClick={() => setSubTab(tabKey as any)}
          >
            {TAB_LABELS[tabKey] || tabKey}
          </button>
        ))}
      </div>

      {subTab === 'fifa' && (
        <div style={{ flex: 1, minHeight: '80vh', background: '#000' }}>
          <iframe
            src={adminSettings.fifa && adminSettings.fifa !== '#' ? adminSettings.fifa : 'https://vidsrc.xyz'}
            style={{ width: '100%', height: '100%', minHeight: '80vh', border: 'none' }}
            title="Sports Viewer"
            allow="autoplay; fullscreen"
          />
        </div>
      )}

      {subTab === 'movies' && (
        <div style={{ flex: 1, minHeight: '80vh', background: '#000' }}>
          <iframe
            src={adminSettings.movies || 'https://kwvdnm.movielinkbd.li/'}
            style={{ width: '100%', height: '100%', minHeight: '80vh', border: 'none' }}
            title="Movies Viewer"
            allow="autoplay; fullscreen"
          />
        </div>
      )}

      {subTab === 'livetv' && (
        <div className="livetv-main-split">
          <div className="livetv-player-pane">
            <div className="livetv-video-wrap">
              <video ref={videoRef} controls autoPlay playsInline />

              {selectedChannel && (
                <div
                  style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'rgba(0,0,0,0.7)',
                    padding: '5px 12px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  <span style={{ color: '#22c55e' }}>●</span>
                  <span>{selectedChannel.name}</span>
                </div>
              )}

              {streamError && (
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid #ef4444',
                    padding: '16px 24px',
                    borderRadius: 12,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ color: '#f87171', fontWeight: 700, marginBottom: 8 }}>
                    Stream offline or buffering...
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    Auto-switching to next channel in 3s...
                  </div>
                  <button
                    onClick={handlePlayNext}
                    style={{
                      marginTop: 10,
                      padding: '5px 12px',
                      background: '#2563eb',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    Skip to Next Now
                  </button>
                </div>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 16px',
                background: '#060a12',
                borderTop: '1px solid #1e293b',
              }}
            >
              <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: 13 }}>
                {selectedChannel ? selectedChannel.name : 'Select a channel'}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handlePlayPrev}
                  style={{
                    padding: '6px 12px',
                    background: '#1e293b',
                    color: '#e2e8f0',
                    border: '1px solid #334155',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  ◄ Prev
                </button>
                <button
                  onClick={handlePlayNext}
                  style={{
                    padding: '6px 12px',
                    background: '#1e293b',
                    color: '#e2e8f0',
                    border: '1px solid #334155',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  Next ►
                </button>
              </div>
            </div>
          </div>

          <div className="livetv-channels-pane">
            <div className="livetv-channels-header">
              <input
                type="text"
                placeholder="Search channel..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  color: '#fff',
                  borderRadius: 6,
                  padding: '8px 10px',
                  fontSize: 12,
                  outline: 'none',
                }}
              />
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                style={{
                  width: '100%',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  color: '#fff',
                  borderRadius: 6,
                  padding: '8px 10px',
                  fontSize: 12,
                  outline: 'none',
                }}
              >
                <option value="">All Categories ({channels.length})</option>
                {categories.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="livetv-channels-list">
              {isLoading && (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748b' }}>
                  Loading playlist channels...
                </div>
              )}
              {!isLoading && filteredChannels.length === 0 && (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748b' }}>
                  No channels match your filter.
                </div>
              )}
              {filteredChannels.slice(0, 100).map(ch => (
                <div
                  key={ch.id}
                  className={`ch-item ${selectedChannel?.id === ch.id ? 'active' : ''}`}
                  onClick={() => setSelectedChannel(ch)}
                >
                  <div className="ch-logo">
                    {ch.logo ? (
                      <img
                        src={ch.logo}
                        alt=""
                        onError={e => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      ch.name.charAt(0)
                    )}
                  </div>
                  <div className="ch-info">
                    <div className="ch-name">{ch.name}</div>
                    <div className="ch-group">{ch.group}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
