import React, { useState, useEffect, useRef } from 'react';
import { ContentType, MediaItem, PersonItem } from '../types';
import { searchMulti, getTitle, getYear, imgUrl, typeBg, typeLabel, AVPH, PH } from '../services/api';
import { SITE_CONFIG } from '../config/siteConfig';

interface HeaderProps {
  currentTab: ContentType;
  onSelectTab: (tab: ContentType) => void;
  onSearchSubmit: (query: string) => void;
  onSelectItem: (item: MediaItem) => void;
  onSelectPerson: (id: number) => void;
  isAdvOpen: boolean;
  onToggleAdv: () => void;
}

const ICONS = [
  // Icon 1 - Cinema ticket / reel
  <svg key="1" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M19.993 9.108c.383 .4 .687 .863 .893 1.368a4.195 4.195 0 0 1 .006 3.166a4.37 4.37 0 0 1 -.887 1.372a20.233 20.233 0 0 1 -2.208 2a20.615 20.615 0 0 1 -2.495 1.669a21.322 21.322 0 0 1 -5.622 2.202a4.213 4.213 0 0 1 -3.002 -.404a3.98 3.98 0 0 1 -1.163 -.967a3.796 3.796 0 0 1 -.695 -1.312c-1.199 -3.902 -1.022 -8.312 .134 -12.23c.609 -2.057 2.643 -3.349 4.737 -2.874c3.88 .88 7.52 3.147 10.302 6.01"></path><path d="M14.044 13.034c.67 -.505 .67 -1.489 0 -2.01a14.824 14.824 0 0 0 -1.498 -1.044a15.783 15.783 0 0 0 -1.62 -.865c-.77 -.35 -1.63 .139 -1.753 .973a15.385 15.385 0 0 0 -.1 3.786a1.232 1.232 0 0 0 1.715 1.027a14.783 14.783 0 0 0 1.694 -.827a14.46 14.46 0 0 0 1.562 -1.035v-.005"></path></svg>,
  // Icon 2 - TV display
  <svg key="2" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18.3636 3.5H5.63636C4.67194 3.5 3.74702 3.87707 3.06507 4.54825C2.38312 5.21943 2 6.12975 2 7.07895V14.2368C2 15.186 2.38312 16.0964 3.06507 16.7675C3.74702 17.4387 4.67194 17.8158 5.63636 17.8158H18.3636C19.3281 17.8158 20.253 17.4387 20.9349 16.7675C21.6169 16.0964 22 15.186 22 14.2368V7.07895C22 6.12975 21.6169 5.21943 20.9349 4.54825C20.253 3.87707 19.3281 3.5 18.3636 3.5Z" fill="currentColor"/><path d="M6.5419 19.6053C6.5419 19.1111 6.94892 18.7105 7.45099 18.7105H16.5419C17.044 18.7105 17.451 19.1111 17.451 19.6053C17.451 20.0994 17.044 20.5 16.5419 20.5H7.45099C6.94892 20.5 6.5419 20.0994 6.5419 19.6053Z" fill="currentColor"/></svg>,
  // Icon 3 - Anime / Spark
  <svg key="3" xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 256 256"><path d="M212,80a28,28,0,1,0,28,28A28,28,0,0,0,212,80Zm0,40a12,12,0,1,1,12-12A12,12,0,0,1,212,120ZM72,108a28,28,0,1,0-28,28A28,28,0,0,0,72,108ZM44,120a12,12,0,1,1,12-12A12,12,0,0,1,44,120ZM92,88A28,28,0,1,0,64,60,28,28,0,0,0,92,88Zm0-40A12,12,0,1,1,80,60,12,12,0,0,1,92,48Zm72,40a28,28,0,1,0-28-28A28,28,0,0,0,164,88Zm0-40a12,12,0,1,1-12,12A12,12,0,0,1,164,48Zm23.12,100.86a35.3,35.3,0,0,1-16.87-21.14,44,44,0,0,0-84.5,0A35.25,35.25,0,0,1,69,148.82,40,40,0,0,0,88,224a39.48,39.48,0,0,0,15.52-3.13,64.09,64.09,0,0,1,48.87,0,40,40,0,0,0,34.73-72Z"></path></svg>,
];

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onSearchSubmit,
  onSelectItem,
  onSelectPerson,
  isAdvOpen,
  onToggleAdv,
}) => {
  const [logoIconIdx, setLogoIconIdx] = useState(0);
  const [query, setQuery] = useState('');
  const [suggestPeople, setSuggestPeople] = useState<PersonItem[]>([]);
  const [suggestMedia, setSuggestMedia] = useState<MediaItem[]>([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const suggestTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setLogoIconIdx(prev => (prev + 1) % ICONS.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    if (suggestTimerRef.current) clearTimeout(suggestTimerRef.current);

    if (!val.trim()) {
      setShowSuggest(false);
      return;
    }

    suggestTimerRef.current = setTimeout(async () => {
      try {
        const { people, media } = await searchMulti(val.trim());
        setSuggestPeople(people.slice(0, 3));
        setSuggestMedia(media.slice(0, 7));
        setShowSuggest(people.length > 0 || media.length > 0);
      } catch {
        setShowSuggest(false);
      }
    }, 280);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setShowSuggest(false);
      if (query.trim()) {
        onSearchSubmit(query.trim());
      }
    } else if (e.key === 'Escape') {
      setShowSuggest(false);
    }
  };

  const startVoiceSearch = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    try {
      const rec = new SR();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => setIsListening(true);
      rec.onresult = (e: any) => {
        const text = e.results[0][0].transcript;
        setQuery(text);
        setIsListening(false);
        onSearchSubmit(text);
      };
      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);

      rec.start();
    } catch {
      setIsListening(false);
    }
  };

  return (
    <div id="main-header">
      <div className="header-wrapper">
        <button
          className="logo-btn"
          id="logoBtn"
          onClick={() => {
            onSelectTab('movie');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          title={SITE_CONFIG.siteName}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
            <span>G</span>
            <img
              src="/logo-icon.png"
              alt="O"
              style={{
                height: '0.82em',
                width: '0.82em',
                objectFit: 'contain',
                margin: '0 1px',
              }}
              onError={(e) => {
                // fallback if missing
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <span>TO</span>
            <span className="cinema-text">CINEMA</span>
          </span>

          <div className="icon-container">
            <div className="licon lactive">
              {ICONS[logoIconIdx]}
            </div>
          </div>
        </button>

        <nav>
          <ul className="menu-nav" id="menu-nav">
            <li>
              <button
                className={currentTab === 'movie' ? 'active' : ''}
                onClick={() => {
                  onSelectTab('movie');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Movies
              </button>
            </li>
            <li>
              <button
                className={currentTab === 'tv' ? 'active' : ''}
                onClick={() => {
                  onSelectTab('tv');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Shows
              </button>
            </li>
            <li>
              <button
                className={currentTab === 'anime' ? 'active' : ''}
                onClick={() => {
                  onSelectTab('anime');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Anime
              </button>
            </li>
            <li>
              <button
                className={currentTab === 'livetv' ? 'active' : ''}
                onClick={() => {
                  onSelectTab('livetv');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <span style={{ color: '#f00', marginRight: 4 }}>●</span> Live
              </button>
            </li>
          </ul>
        </nav>

        <div id="header-search">
          <div className="search-box">
            <input
              className="search-input"
              id="search-input"
              placeholder="Search movies, shows, anime..."
              type="text"
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (query.trim() && (suggestPeople.length > 0 || suggestMedia.length > 0)) {
                  setShowSuggest(true);
                }
              }}
            />

            <div className="search-actions">
              <button
                className="search-btn"
                id="search-btn"
                title="Search"
                onClick={() => {
                  setShowSuggest(false);
                  if (query.trim()) onSearchSubmit(query.trim());
                }}
              >
                <svg
                  fill="none"
                  height="16"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                  width="16"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" x2="16.65" y1="21" y2="16.65" />
                </svg>
              </button>

              <button
                className={`voice-search-btn ${isListening ? 'listening' : ''}`}
                id="voice-search-btn"
                title="Voice Search"
                onClick={startVoiceSearch}
              >
                <svg
                  fill="none"
                  height="14"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="14"
                >
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" x2="12" y1="19" y2="23" />
                  <line x1="8" x2="16" y1="23" y2="23" />
                </svg>
              </button>

              <button
                className={`adv-toggle-btn ${isAdvOpen ? 'open' : ''}`}
                id="adv-toggle-btn"
                title="Advanced Filter"
                onClick={onToggleAdv}
              >
                <svg
                  fill="none"
                  height="14"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.2"
                  viewBox="0 0 24 24"
                  width="14"
                >
                  <line x1="4" x2="20" y1="6" y2="6" />
                  <line x1="8" x2="16" y1="12" y2="12" />
                  <line x1="11" x2="13" y1="18" y2="18" />
                </svg>
              </button>
            </div>

            {showSuggest && (
              <div
                className="search-suggest"
                id="search-suggest"
                onMouseDown={e => e.stopPropagation()}
              >
                {suggestPeople.length > 0 && (
                  <>
                    <div className="sug-divider">People</div>
                    {suggestPeople.map(p => (
                      <div
                        key={p.id}
                        className="sug-item"
                        onClick={() => {
                          setShowSuggest(false);
                          setQuery('');
                          onSelectPerson(p.id);
                        }}
                      >
                        <img
                          className="sug-photo"
                          src={p.profile_path ? imgUrl(p.profile_path, 'w92') : AVPH}
                          alt=""
                          onError={e => { (e.target as HTMLImageElement).src = AVPH; }}
                        />
                        <div className="sug-info">
                          <div className="sug-title">{p.name}</div>
                          <div className="sug-meta">{p.known_for_department}</div>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {suggestMedia.length > 0 && (
                  <>
                    <div className="sug-divider">Movies &amp; Shows</div>
                    {suggestMedia.map(m => (
                      <div
                        key={`${m.contentType}-${m.id}`}
                        className="sug-item"
                        onClick={() => {
                          setShowSuggest(false);
                          setQuery('');
                          onSelectItem(m);
                        }}
                      >
                        <img
                          className="sug-poster"
                          src={imgUrl(m.poster_path, 'w92')}
                          alt=""
                          onError={e => { (e.target as HTMLImageElement).src = PH; }}
                        />
                        <div className="sug-info">
                          <div className="sug-title">{getTitle(m)}</div>
                          <div className="sug-meta">
                            <span
                              className="sug-type"
                              style={{ background: typeBg(m.contentType) }}
                            >
                              {typeLabel(m.contentType)}
                            </span>
                            {getYear(m) && <span>{getYear(m)}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
