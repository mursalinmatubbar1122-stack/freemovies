import React, { useState, useEffect, useRef } from 'react';
import { MediaDetail, MediaItem } from '../types';
import {
  fetchMediaDetail,
  fetchCast,
  getTitle,
  getYear,
  imgUrl,
  normalizeEmbed,
  PH,
  AVPH,
} from '../services/api';
import {
  loadMediaUrls,
  saveMediaUrl,
  AdminSettingsData,
} from '../services/firebase';
import { AD_CONFIG } from '../config/siteConfig';

interface DetailModalProps {
  item: MediaItem | null;
  onClose: () => void;
  onSelectPerson: (id: number) => void;
  isAdmin: boolean;
  adminSettings: AdminSettingsData;
}

export const DetailModal: React.FC<DetailModalProps> = ({
  item,
  onClose,
  onSelectPerson,
  isAdmin,
  adminSettings,
}) => {
  const [detail, setDetail] = useState<MediaDetail | null>(null);
  const [cast, setCast] = useState<any[]>([]);
  const [activeServer, setActiveServer] = useState<number | 'custom'>(0);
  const [currentSeason, setCurrentSeason] = useState(1);
  const [currentEp, setCurrentEp] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerSrc, setPlayerSrc] = useState('');
  const [isTrailerPlaying, setIsTrailerPlaying] = useState(false);
  const [customPlayerUrl, setCustomPlayerUrl] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [showUrlEditor, setShowUrlEditor] = useState<'player' | 'download' | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const wasOpenedRef = useRef(false);

  // Sync clean URL without '#' and lock body scroll
  useEffect(() => {
    if (item) {
      wasOpenedRef.current = true;
      document.body.style.overflow = 'hidden';
      const slug = (getTitle(item) || '')
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, '')
        .trim()
        .replace(/ +/g, '-')
        .substring(0, 60) || 'watch';
      const cleanPath = `/${item.contentType}/${slug}/${item.id}`;
      // Clean HTML5 push/replace without ugly '#'
      if (window.location.pathname !== cleanPath || window.location.hash) {
        window.history.replaceState({ mediaId: item.id, type: item.contentType }, '', cleanPath);
      }
    } else {
      document.body.style.overflow = '';
      // ONLY clean up URL if modal was previously open
      if (wasOpenedRef.current) {
        wasOpenedRef.current = false;
        if (window.location.pathname !== '/' || window.location.hash) {
          window.history.replaceState(null, '', '/');
        }
      }
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [item]);

  // Load detail and custom URLs
  useEffect(() => {
    if (!item) {
      setDetail(null);
      setIsPlaying(false);
      setPlayerSrc('');
      setIsTrailerPlaying(false);
      return;
    }

    setCurrentSeason(1);
    setCurrentEp(1);
    setIsPlaying(false);
    setPlayerSrc('');
    setIsTrailerPlaying(false);
    setActiveServer(item.contentType === 'tv' ? 1 : 0);

    fetchMediaDetail(item).then(d => {
      setDetail(d);
      if (d._anilistCast && d._anilistCast.length > 0) {
        setCast(d._anilistCast);
      } else {
        fetchCast(item).then(c => setCast(c));
      }
    });

    loadMediaUrls(item.contentType, item.id).then(urls => {
      setDownloadUrl(urls.downloadUrl);
      setCustomPlayerUrl(urls.playerUrl);
    });
  }, [item]);

  if (!item) return null;

  const currentItem = detail || item;
  const contentType = currentItem.contentType;
  const isTv = contentType === 'tv';
  const isAnime = contentType === 'anime';

  // Server templates
  const movieServers = adminSettings.moviePlayers;
  const tvServers = adminSettings.tvPlayers;
  const animeServers = adminSettings.animePlayers;
  const activeServers = isTv ? tvServers : isAnime ? animeServers : movieServers;

  const totalSeasons = detail?.seasons?.length || (detail?.number_of_seasons || 1);
  const currentSeasonData = detail?.seasons?.find(s => s.season_number === currentSeason);
  const totalEpsInSeason = currentSeasonData?.episode_count || 24;

  const getPlayerUrl = (srvIdx: number | 'custom', s: number, e: number) => {
    if (srvIdx === 'custom') {
      return customPlayerUrl;
    }
    const srv = activeServers[srvIdx] || activeServers[0];
    if (!srv) return '';

    return srv.url
      .replace(/\{id\}/g, String(currentItem.id))
      .replace(/\{s\}/g, String(s))
      .replace(/\{e\}/g, String(e))
      .replace(/\{ep\}/g, String(e));
  };

  const handleStartPlaying = (srvIdx = activeServer, s = currentSeason, e = currentEp) => {
    const url = getPlayerUrl(srvIdx, s, e);
    setPlayerSrc(url);
    setIsPlaying(true);
    setIsTrailerPlaying(false);
  };

  const handleToggleTrailer = () => {
    if (isTrailerPlaying) {
      setIsTrailerPlaying(false);
      if (playerSrc) {
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
      }
    } else {
      const vids = detail?.videos?.results || [];
      const tr = vids.find(v => v.type === 'Trailer' && v.site === 'YouTube') || vids.find(v => v.site === 'YouTube');
      if (tr && tr.key) {
        setIsTrailerPlaying(true);
        setIsPlaying(true);
        setPlayerSrc(`https://www.youtube.com/embed/${tr.key}?autoplay=1`);
      }
    }
  };

  const handleSaveUrl = async () => {
    if (!showUrlEditor) return;
    const norm = showUrlEditor === 'player' ? normalizeEmbed(urlInput) : urlInput.trim();
    await saveMediaUrl(contentType, currentItem.id, showUrlEditor, norm);
    if (showUrlEditor === 'player') {
      setCustomPlayerUrl(norm);
    } else {
      setDownloadUrl(norm);
    }
    setShowUrlEditor(null);
  };

  const handleClearUrl = async () => {
    if (!showUrlEditor) return;
    await saveMediaUrl(contentType, currentItem.id, showUrlEditor, '');
    if (showUrlEditor === 'player') {
      setCustomPlayerUrl('');
    } else {
      setDownloadUrl('');
    }
    setShowUrlEditor(null);
  };

  const hasTrailer = !!(detail?.videos?.results?.some(v => v.site === 'YouTube'));

  return (
    <div id="detail-view">
      {/* TOP BAR */}
      <div className="dv-top-bar">
        <span className="dv-top-title">{getTitle(currentItem)}</span>
        <button className="dv-close-btn" onClick={onClose} title="Close">
          ✕
        </button>
      </div>

      {/* PLAYER SECTION */}
      <div id="dv-player-section">
        {!isPlaying ? (
          <div
            id="dv-player-placeholder"
            onClick={() => handleStartPlaying()}
            title="Click to play"
          >
            {detail?.backdrop_path && (
              <img
                src={imgUrl(detail.backdrop_path, 'w1280')}
                alt=""
                className="dv-placeholder-backdrop"
              />
            )}
            <div className="dv-placeholder-inner">
              <div className="dv-play-circle">
                <svg fill="#ff6666" height="26" viewBox="0 0 24 24" width="26">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
              <div className="pt">Click Watch Now to start streaming</div>
              <div className="ps">{getTitle(currentItem)}</div>
            </div>
          </div>
        ) : (
          <div id="dv-player-wrap" style={{ display: 'flex' }}>
            <iframe
              src={playerSrc}
              title="Video Player"
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}
      </div>

      {/* 728x90 BANNER AD SLOT */}
      {AD_CONFIG.banner728x90.status === 'on' && (
        <div className="gtc-ad-slot gtc-banner-slot" style={{ minHeight: 90 }}>
          <div style={{ color: '#4b5563', fontSize: 11, letterSpacing: 1 }}>
            ADVERTISEMENT · 728x90
          </div>
        </div>
      )}

      {/* TV SEASON & EPISODE CONTROLS */}
      {(isTv || isAnime) && (
        <>
          <div className="tv-se-bar">
            <div className="se-inner">
              {isTv && (
                <>
                  <div className="se-lbl">S</div>
                  <div className="se-total">{totalSeasons}</div>
                  <input
                    type="text"
                    className="se-num"
                    value={currentSeason}
                    onChange={e => {
                      const v = parseInt(e.target.value) || 1;
                      setCurrentSeason(Math.max(1, Math.min(v, totalSeasons)));
                    }}
                  />
                  <div className="se-arrows">
                    <button
                      className="se-arrow"
                      onClick={() => setCurrentSeason(prev => Math.min(prev + 1, totalSeasons))}
                    >
                      ▲
                    </button>
                    <button
                      className="se-arrow"
                      onClick={() => setCurrentSeason(prev => Math.max(prev - 1, 1))}
                    >
                      ▼
                    </button>
                  </div>
                  <div className="se-divider" />
                </>
              )}

              <div className="se-lbl">E</div>
              <div className="se-total">{totalEpsInSeason}</div>
              <input
                type="text"
                className="se-num"
                value={currentEp}
                onChange={e => {
                  const v = parseInt(e.target.value) || 1;
                  setCurrentEp(Math.max(1, Math.min(v, totalEpsInSeason)));
                }}
              />
              <div className="se-arrows">
                <button
                  className="se-arrow"
                  onClick={() => setCurrentEp(prev => Math.min(prev + 1, totalEpsInSeason))}
                >
                  ▲
                </button>
                <button
                  className="se-arrow"
                  onClick={() => setCurrentEp(prev => Math.max(prev - 1, 1))}
                >
                  ▼
                </button>
              </div>

              <button
                className="se-play-btn"
                onClick={() => handleStartPlaying(activeServer, currentSeason, currentEp)}
              >
                ► Play
              </button>
            </div>
          </div>

          <div className="ep-nav-bar">
            <button
              className="ep-nav-btn"
              disabled={currentEp <= 1}
              onClick={() => {
                const nextE = Math.max(1, currentEp - 1);
                setCurrentEp(nextE);
                handleStartPlaying(activeServer, currentSeason, nextE);
              }}
            >
              ◄ Prev Ep
            </button>
            <span className="ep-nav-now">
              {isTv ? `S${currentSeason} : E${currentEp}` : `Episode ${currentEp}`}
            </span>
            <button
              className="ep-nav-btn"
              disabled={currentEp >= totalEpsInSeason}
              onClick={() => {
                const nextE = Math.min(currentEp + 1, totalEpsInSeason);
                setCurrentEp(nextE);
                handleStartPlaying(activeServer, currentSeason, nextE);
              }}
            >
              Next Ep ►
            </button>
          </div>
        </>
      )}

      {/* PLAYER SOURCE SWITCHER */}
      <div className="player-sources">
        {activeServers.map((srv, idx) => (
          <div
            key={srv.label + idx}
            className={`source-icon ${activeServer === idx ? 'active' : ''}`}
            onClick={() => {
              setActiveServer(idx);
              handleStartPlaying(idx, currentSeason, currentEp);
            }}
            title={srv.label}
          >
            {idx + 1}
          </div>
        ))}

        {/* Custom Server */}
        {(customPlayerUrl || isAdmin) && (
          <div className="custom-src-wrap">
            <div
              className={`source-icon custom-src ${activeServer === 'custom' ? 'active' : ''}`}
              title={customPlayerUrl ? 'Custom Player' : 'Set Custom Player'}
              onClick={() => {
                if (customPlayerUrl) {
                  setActiveServer('custom');
                  handleStartPlaying('custom');
                } else if (isAdmin) {
                  setUrlInput('');
                  setShowUrlEditor('player');
                }
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </div>
            {isAdmin && (
              <button
                className="custom-src-edit-btn"
                title="Edit Custom Player URL"
                onClick={e => {
                  e.stopPropagation();
                  setUrlInput(customPlayerUrl);
                  setShowUrlEditor('player');
                }}
              >
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* INFO SECTION */}
      <div id="dv-info-section">
        <div className="dv-poster-wrap">
          <img
            src={imgUrl(currentItem.poster_path, 'w300')}
            alt=""
            onError={e => { (e.target as HTMLImageElement).src = PH; }}
          />
        </div>

        <div id="dv-info-right">
          <div className="dv-title">{getTitle(currentItem)}</div>
          <div className="dv-meta-row">
            {detail?.genres && detail.genres.length > 0 && (
              <span className="dv-genre">
                {detail.genres.map(g => g.name).join(', ')}
              </span>
            )}
            {getYear(currentItem) && (
              <>
                <span className="dv-dot">·</span>
                <span className="dv-meta">{getYear(currentItem)}</span>
              </>
            )}
            {detail?.number_of_seasons && (
              <>
                <span className="dv-dot">·</span>
                <span className="dv-meta">
                  {detail.number_of_seasons} Season{detail.number_of_seasons > 1 ? 's' : ''}
                </span>
              </>
            )}
            {detail?.runtime ? (
              <>
                <span className="dv-dot">·</span>
                <span className="dv-meta">{detail.runtime}m</span>
              </>
            ) : null}
            {currentItem.vote_average ? (
              <>
                <span className="dv-dot">·</span>
                <span className="dv-imdb">★ {currentItem.vote_average.toFixed(1)}</span>
              </>
            ) : null}
            {detail?.external_ids?.imdb_id && (
              <>
                <span className="dv-dot">·</span>
                <a
                  href={`https://www.imdb.com/title/${detail.external_ids.imdb_id}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#fbbf24', fontWeight: 700 }}
                >
                  IMDb
                </a>
              </>
            )}
          </div>

          <div className="dv-action-row">
            {hasTrailer && (
              <button
                className="dv-btn btn-trailer"
                onClick={handleToggleTrailer}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <span>{isTrailerPlaying ? 'Back to Player' : 'Trailer'}</span>
              </button>
            )}

            <button
              className="dv-btn btn-download"
              disabled={!downloadUrl}
              onClick={() => {
                if (downloadUrl) window.open(downloadUrl, '_blank');
              }}
              title={downloadUrl ? 'Download file' : 'No download link available'}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download
            </button>

            {isAdmin && (
              <button
                className="adm-edit-btn"
                onClick={() => {
                  setUrlInput(downloadUrl);
                  setShowUrlEditor('download');
                }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                DL Link
              </button>
            )}

            <button
              className="dv-btn btn-share"
              title="Share Link"
              onClick={() => {
                const cleanHref = window.location.href.replace('/#/', '/');
                navigator.clipboard.writeText(cleanHref);
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2200);
              }}
            >
              {isCopied ? (
                <span style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', padding: '0 4px' }}>Copied!</span>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="dv-divider" />

      {/* PLOT */}
      <p className="dv-plot">{detail?.overview || currentItem.overview || 'No synopsis available.'}</p>

      {/* CAST GRID */}
      {cast && cast.length > 0 && (
        <div id="dv-cast-section">
          <h2>Cast</h2>
          <div className="cast-grid">
            {cast.slice(0, 14).map((c: any) => {
              const photo = c.profile_path
                ? imgUrl(c.profile_path, 'w185')
                : c._aniprofile || AVPH;
              return (
                <div
                  key={c.id}
                  className="cast-card"
                  onClick={() => onSelectPerson(c.id)}
                >
                  <div className="cast-img-wrap">
                    <img
                      src={photo}
                      alt={c.name}
                      onError={e => { (e.target as HTMLImageElement).src = AVPH; }}
                    />
                  </div>
                  <div className="cast-name">{c.name}</div>
                  <div className="cast-role">{c.character}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* POPUP FOR ADMIN TO EDIT URL */}
      {showUrlEditor && (
        <div
          className="aurl-overlay show"
          onClick={() => setShowUrlEditor(null)}
        >
          <div className="aurl-box" onClick={e => e.stopPropagation()}>
            <button className="aurl-close" onClick={() => setShowUrlEditor(null)}>
              ✕
            </button>
            <div className="aurl-title">
              {showUrlEditor === 'player' ? 'Edit Custom Player URL' : 'Edit Direct Download URL'}
            </div>
            <div className="aurl-hint">
              {showUrlEditor === 'player'
                ? 'Supports YouTube, Google Drive, Archive.org, or any embed URL:'
                : 'Enter direct download link for this title:'}
            </div>
            <input
              type="text"
              className="aurl-input"
              placeholder="https://..."
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
            />
            <div className="aurl-actions">
              <button className="aurl-save" onClick={handleSaveUrl}>
                ✓ Save
              </button>
              <button className="aurl-clear" onClick={handleClearUrl}>
                🗑 Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
