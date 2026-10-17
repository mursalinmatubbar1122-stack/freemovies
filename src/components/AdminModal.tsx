import React, { useState } from 'react';
import { AdminSettingsData, saveAdminSettings, signOut, auth } from '../services/firebase';
import { ADMIN_CONFIG } from '../config/siteConfig';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AdminSettingsData;
  onUpdateSettings: (newSettings: AdminSettingsData) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [iptvUrl, setIptvUrl] = useState(settings.iptv);
  const [fifaUrl, setFifaUrl] = useState(settings.fifa);
  const [moviesUrl, setMoviesUrl] = useState(settings.movies);
  const [moviePlayers, setMoviePlayers] = useState(settings.moviePlayers);
  const [tvPlayers, setTvPlayers] = useState(settings.tvPlayers);
  const [animePlayers, setAnimePlayers] = useState(settings.animePlayers);
  const [ltOrder, setLtOrder] = useState<string[]>(settings.ltOrder || ['movies', 'fifa', 'livetv']);
  const [newMovieUrl, setNewMovieUrl] = useState('');
  const [newMovieLabel, setNewMovieLabel] = useState('');
  const [newTvUrl, setNewTvUrl] = useState('');
  const [newTvLabel, setNewTvLabel] = useState('');
  const [newAnimeUrl, setNewAnimeUrl] = useState('');
  const [newAnimeLabel, setNewAnimeLabel] = useState('');
  const [msg, setMsg] = useState('');

  if (!isOpen) return null;

  const showFeedback = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 3000);
  };

  const handleSaveLiveUrls = async () => {
    const patch = {
      iptv: iptvUrl.trim(),
      fifa: fifaUrl.trim(),
      movies: moviesUrl.trim(),
      ltOrder,
    };
    await saveAdminSettings(patch);
    onUpdateSettings({ ...settings, ...patch });
    showFeedback('✓ Live TV URLs saved!');
  };

  const handleSaveMoviePlayers = async (players = moviePlayers) => {
    await saveAdminSettings({ moviePlayers: players });
    onUpdateSettings({ ...settings, moviePlayers: players });
    showFeedback('✓ Movie players updated!');
  };

  const handleSaveTvPlayers = async (players = tvPlayers) => {
    await saveAdminSettings({ tvPlayers: players });
    onUpdateSettings({ ...settings, tvPlayers: players });
    showFeedback('✓ TV players updated!');
  };

  const handleSaveAnimePlayers = async (players = animePlayers) => {
    await saveAdminSettings({ animePlayers: players });
    onUpdateSettings({ ...settings, animePlayers: players });
    showFeedback('✓ Anime players updated!');
  };

  const handleAddMoviePlayer = () => {
    if (!newMovieUrl.trim()) return;
    const updated = [
      ...moviePlayers,
      { label: newMovieLabel.trim() || `Player ${moviePlayers.length + 1}`, url: newMovieUrl.trim() },
    ];
    setMoviePlayers(updated);
    setNewMovieUrl('');
    setNewMovieLabel('');
    handleSaveMoviePlayers(updated);
  };

  const handleAddTvPlayer = () => {
    if (!newTvUrl.trim()) return;
    const updated = [
      ...tvPlayers,
      { label: newTvLabel.trim() || `Player ${tvPlayers.length + 1}`, url: newTvUrl.trim() },
    ];
    setTvPlayers(updated);
    setNewTvUrl('');
    setNewTvLabel('');
    handleSaveTvPlayers(updated);
  };

  const handleAddAnimePlayer = () => {
    if (!newAnimeUrl.trim()) return;
    const updated = [
      ...animePlayers,
      { label: newAnimeLabel.trim() || `Player ${animePlayers.length + 1}`, url: newAnimeUrl.trim() },
    ];
    setAnimePlayers(updated);
    setNewAnimeUrl('');
    setNewAnimeLabel('');
    handleSaveAnimePlayers(updated);
  };

  const moveTab = (index: number, dir: number) => {
    const target = index + dir;
    if (target < 0 || target >= ltOrder.length) return;
    const clone = [...ltOrder];
    const temp = clone[index];
    clone[index] = clone[target];
    clone[target] = temp;
    setLtOrder(clone);
  };

  const TAB_LABELS: Record<string, string> = {
    livetv: '📡 Live TV',
    fifa: '⚽ Sports',
    movies: '🎬 Movies',
  };

  return (
    <div className="adm-overlay show" onClick={onClose}>
      <div className="adm-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 680, margin: '20px auto' }}>
        <div className="adm-hd">
          <div className="adm-hd-left">
            <div className="adm-hd-icon">⚙️</div>
            <div>
              <div className="adm-hd-title">Admin Panel</div>
              <div className="adm-hd-sub">Manage Players, Live Channels &amp; Settings</div>
            </div>
          </div>
          <button className="adm-hd-close" onClick={onClose}>✕</button>
        </div>

        {msg && (
          <div style={{ padding: '10px 24px', background: '#10b981', color: '#fff', fontSize: 12, fontWeight: 700 }}>
            {msg}
          </div>
        )}

        {/* ADMIN PROFILE */}
        <div className="adm-sec">
          <div className="adm-sec-ttl">👤 Admin Profile</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: '#1e293b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 20,
              }}
            >
              👑
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{ADMIN_CONFIG.profile.name}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{ADMIN_CONFIG.profile.about}</div>
            </div>
          </div>
        </div>

        {/* LIVE TV URLS */}
        <div className="adm-sec">
          <div className="adm-sec-ttl">📡 Live TV &amp; Streams</div>
          <div className="adm-row">
            <div className="adm-lbl">IPTV M3U Playlist URL</div>
            <div className="adm-field">
              <input
                className="adm-inp"
                value={iptvUrl}
                onChange={e => setIptvUrl(e.target.value)}
                placeholder="https://...m3u"
              />
            </div>
          </div>

          <div className="adm-row">
            <div className="adm-lbl">Sports / FIFA Stream Embed URL</div>
            <div className="adm-field">
              <input
                className="adm-inp"
                value={fifaUrl}
                onChange={e => setFifaUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="adm-row">
            <div className="adm-lbl">Movies Stream Embed URL</div>
            <div className="adm-field">
              <input
                className="adm-inp"
                value={moviesUrl}
                onChange={e => setMoviesUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="adm-row">
            <div className="adm-lbl">Live TV Tabs Order</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              {ltOrder.map((key, i) => (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    background: '#1e293b',
                    padding: '4px 8px',
                    borderRadius: 6,
                  }}
                >
                  <button
                    onClick={() => moveTab(i, -1)}
                    disabled={i === 0}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                  >
                    ◀
                  </button>
                  <span style={{ fontSize: 11, fontWeight: 700 }}>{TAB_LABELS[key] || key}</span>
                  <button
                    onClick={() => moveTab(i, 1)}
                    disabled={i === ltOrder.length - 1}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                  >
                    ▶
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button className="adm-sbtn" onClick={handleSaveLiveUrls} style={{ marginTop: 10 }}>
            Save Stream URLs
          </button>
        </div>

        {/* MOVIE PLAYERS */}
        <div className="adm-sec">
          <div className="adm-sec-ttl">🎬 Movie Players</div>
          <div className="adm-plist">
            {moviePlayers.map((p, idx) => (
              <div key={idx} className="adm-pitem">
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div className="adm-pnum">{idx + 1}</div>
                  <input
                    className="adm-inp adm-inp-sm"
                    value={p.label}
                    onChange={e => {
                      const updated = [...moviePlayers];
                      updated[idx].label = e.target.value;
                      setMoviePlayers(updated);
                    }}
                  />
                  <input
                    className="adm-inp"
                    value={p.url}
                    onChange={e => {
                      const updated = [...moviePlayers];
                      updated[idx].url = e.target.value;
                      setMoviePlayers(updated);
                    }}
                  />
                  <button
                    className="adm-delbtn"
                    onClick={() => {
                      const updated = moviePlayers.filter((_, i) => i !== idx);
                      setMoviePlayers(updated);
                      handleSaveMoviePlayers(updated);
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <input
              className="adm-inp adm-inp-sm"
              placeholder="Label (e.g. Player 6)"
              value={newMovieLabel}
              onChange={e => setNewMovieLabel(e.target.value)}
            />
            <input
              className="adm-inp"
              placeholder="Player URL template: use {id}"
              value={newMovieUrl}
              onChange={e => setNewMovieUrl(e.target.value)}
            />
            <button className="adm-sbtn" onClick={handleAddMoviePlayer}>
              + Add
            </button>
          </div>
          <button
            className="adm-sbtn"
            style={{ marginTop: 10, background: '#2563eb' }}
            onClick={() => handleSaveMoviePlayers()}
          >
            Save Movie Players
          </button>
        </div>

        {/* TV PLAYERS */}
        <div className="adm-sec">
          <div className="adm-sec-ttl">📺 TV Show Players</div>
          <div className="adm-plist">
            {tvPlayers.map((p, idx) => (
              <div key={idx} className="adm-pitem">
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div className="adm-pnum">{idx + 1}</div>
                  <input
                    className="adm-inp adm-inp-sm"
                    value={p.label}
                    onChange={e => {
                      const updated = [...tvPlayers];
                      updated[idx].label = e.target.value;
                      setTvPlayers(updated);
                    }}
                  />
                  <input
                    className="adm-inp"
                    value={p.url}
                    onChange={e => {
                      const updated = [...tvPlayers];
                      updated[idx].url = e.target.value;
                      setTvPlayers(updated);
                    }}
                  />
                  <button
                    className="adm-delbtn"
                    onClick={() => {
                      const updated = tvPlayers.filter((_, i) => i !== idx);
                      setTvPlayers(updated);
                      handleSaveTvPlayers(updated);
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <input
              className="adm-inp adm-inp-sm"
              placeholder="Label"
              value={newTvLabel}
              onChange={e => setNewTvLabel(e.target.value)}
            />
            <input
              className="adm-inp"
              placeholder="Player URL template: use {id} {s} {e}"
              value={newTvUrl}
              onChange={e => setNewTvUrl(e.target.value)}
            />
            <button className="adm-sbtn" onClick={handleAddTvPlayer}>
              + Add
            </button>
          </div>
          <button
            className="adm-sbtn"
            style={{ marginTop: 10, background: '#2563eb' }}
            onClick={() => handleSaveTvPlayers()}
          >
            Save TV Players
          </button>
        </div>

        {/* ANIME PLAYERS */}
        <div className="adm-sec">
          <div className="adm-sec-ttl">🎌 Anime Players</div>
          <div className="adm-plist">
            {animePlayers.map((p, idx) => (
              <div key={idx} className="adm-pitem">
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div className="adm-pnum">{idx + 1}</div>
                  <input
                    className="adm-inp adm-inp-sm"
                    value={p.label}
                    onChange={e => {
                      const updated = [...animePlayers];
                      updated[idx].label = e.target.value;
                      setAnimePlayers(updated);
                    }}
                  />
                  <input
                    className="adm-inp"
                    value={p.url}
                    onChange={e => {
                      const updated = [...animePlayers];
                      updated[idx].url = e.target.value;
                      setAnimePlayers(updated);
                    }}
                  />
                  <button
                    className="adm-delbtn"
                    onClick={() => {
                      const updated = animePlayers.filter((_, i) => i !== idx);
                      setAnimePlayers(updated);
                      handleSaveAnimePlayers(updated);
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <input
              className="adm-inp adm-inp-sm"
              placeholder="Label"
              value={newAnimeLabel}
              onChange={e => setNewAnimeLabel(e.target.value)}
            />
            <input
              className="adm-inp"
              placeholder="Player URL: use {id} {e}"
              value={newAnimeUrl}
              onChange={e => setNewAnimeUrl(e.target.value)}
            />
            <button className="adm-sbtn" onClick={handleAddAnimePlayer}>
              + Add
            </button>
          </div>
          <button
            className="adm-sbtn"
            style={{ marginTop: 10, background: '#2563eb' }}
            onClick={() => handleSaveAnimePlayers()}
          >
            Save Anime Players
          </button>
        </div>

        {/* SIGN OUT */}
        <div className="adm-sec">
          <button
            className="adm-signout-btn"
            onClick={async () => {
              await signOut(auth);
              onClose();
            }}
          >
            Sign Out of Admin
          </button>
        </div>
      </div>
    </div>
  );
};
