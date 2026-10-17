import React, { useEffect, useState } from 'react';
import { fetchTrending, getTitle } from '../services/api';
import { MediaItem } from '../types';
import { SOCIAL_MEDIA_CONFIG, AD_CONFIG } from '../config/siteConfig';

interface TopBarProps {
  onSelectItem: (item: MediaItem) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onSelectItem }) => {
  const [trending, setTrending] = useState<MediaItem[]>([]);
  const [index, setIndex] = useState(0);
  const [timerText, setTimerText] = useState('');

  useEffect(() => {
    fetchTrending().then(items => {
      if (items && items.length) {
        setTrending(items);
      }
    });
  }, []);

  useEffect(() => {
    if (!trending.length) return;
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % trending.length);
    }, 4200);
    return () => clearInterval(interval);
  }, [trending]);

  // Ads timer state
  useEffect(() => {
    const updateTimer = () => {
      const activeMinutes = AD_CONFIG.adsTimer.activeMinutes || 10;
      const repeatEveryHours = AD_CONFIG.adsTimer.repeatEveryHours || 12;
      const activeMs = activeMinutes * 60 * 1000;
      const repeatMs = Math.max(activeMs, repeatEveryHours * 60 * 60 * 1000);

      let start = Number(localStorage.getItem('gtc_ads_timer_started_at_v1')) || 0;
      if (!start) {
        start = Date.now();
        localStorage.setItem('gtc_ads_timer_started_at_v1', String(start));
      }
      let elapsed = (Date.now() - start) % repeatMs;
      if (elapsed < 0) elapsed += repeatMs;

      if (AD_CONFIG.adsTimer.status === 'on' && elapsed < activeMs) {
        const remainingSec = Math.max(0, Math.ceil((activeMs - elapsed) / 1000));
        const mins = Math.floor(remainingSec / 60);
        const secs = remainingSec % 60;
        setTimerText(`ADS ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
      } else {
        setTimerText('');
      }
    };

    updateTimer();
    const tInterval = setInterval(updateTimer, 1000);
    return () => clearInterval(tInterval);
  }, []);

  const currentTrending = trending[index];

  return (
    <div className="topbar-wrapper">
      <div className="top-inner">
        <div className="breakhead">
          <span>⚡</span>
          <span style={{ fontWeight: 700 }}>TRENDING</span>
          {timerText && <span className="ads-timer-badge">{timerText}</span>}
        </div>

        <div className="ticker-wrap">
          {currentTrending && (
            <div
              className="ticker-item"
              onClick={() => onSelectItem(currentTrending)}
              title="Click to watch"
            >
              <span className="ticker-rank">#{index + 1}</span>
              <span className="ticker-title">{getTitle(currentTrending)}</span>
            </div>
          )}
        </div>

        <div className="social-icons">
          <a
            href={SOCIAL_MEDIA_CONFIG.facebook}
            title="Facebook"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg fill="currentColor" height="13" viewBox="0 0 24 24" width="13">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
          </a>
          <a
            href={SOCIAL_MEDIA_CONFIG.youtube}
            title="YouTube"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg fill="currentColor" height="14" viewBox="0 0 24 24" width="14">
              <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
            </svg>
          </a>
          <a
            href={SOCIAL_MEDIA_CONFIG.telegram}
            title="Telegram"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg fill="currentColor" height="13" viewBox="0 0 24 24" width="13">
              <path d="M21.8 2.15a1 1 0 0 0-1.08-.15L2.27 9.6a1 1 0 0 0 .08 1.86l4.07 1.36 1.86 5.58a1 1 0 0 0 1.7.38l2.34-2.34 4.15 3.05a1 1 0 0 0 1.55-.63l3-15a1 1 0 0 0-.22-.71z" />
            </svg>
          </a>
          <a
            href={SOCIAL_MEDIA_CONFIG.instagram}
            title="Instagram"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg
              fill="none"
              height="13"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="13"
            >
              <rect height="20" rx="5" ry="5" width="20" x="2" y="2" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
};
