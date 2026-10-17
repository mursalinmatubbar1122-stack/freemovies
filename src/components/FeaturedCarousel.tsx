import React, { useRef, useEffect } from 'react';
import { MediaItem } from '../types';
import { getTitle, getYear, imgUrl, typeBg, typeLabel, PH } from '../services/api';
import { AD_CONFIG } from '../config/siteConfig';

interface FeaturedCarouselProps {
  items: MediaItem[];
  onSelectItem: (item: MediaItem) => void;
}

export const FeaturedCarousel: React.FC<FeaturedCarouselProps> = ({ items, onSelectItem }) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const hasDragged = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const isPaused = useRef(false);

  const featuredList = items.slice(0, 15);

  useEffect(() => {
    const sc = scrollerRef.current;
    if (!sc || featuredList.length === 0) return;

    let rafId: number;
    let lastTs: number | null = null;
    const speed = window.innerWidth <= 720 ? 0.04 : 0.06;

    const tick = (ts: number) => {
      if (lastTs === null) lastTs = ts;
      const dt = ts - lastTs;
      lastTs = ts;

      if (!isPaused.current && !isDragging.current && sc) {
        sc.scrollLeft += speed * dt;
        const half = sc.scrollWidth / 2;
        if (sc.scrollLeft >= half) {
          sc.scrollLeft -= half;
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [featuredList.length]);

  if (!featuredList.length) return null;

  // Duplicate items for continuous looping
  const displayItems = [...featuredList, ...featuredList];

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    hasDragged.current = false;
    startX.current = e.pageX - (scrollerRef.current?.offsetLeft || 0);
    scrollLeft.current = scrollerRef.current?.scrollLeft || 0;
    if (scrollerRef.current) scrollerRef.current.classList.add('grabbing');
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollerRef.current) return;
    const x = e.pageX - scrollerRef.current.offsetLeft;
    const walk = x - startX.current;
    if (Math.abs(walk) > 4) hasDragged.current = true;
    scrollerRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    if (scrollerRef.current) scrollerRef.current.classList.remove('grabbing');
  };

  const handleClickItem = (item: MediaItem) => {
    if (hasDragged.current) return;
    if (AD_CONFIG.directLink.status === 'on' && AD_CONFIG.directLink.url) {
      window.open(AD_CONFIG.directLink.url, '_blank', 'noopener,noreferrer');
    }
    onSelectItem(item);
  };

  return (
    <div id="featured-wrapper">
      <div className="featured-post">
        <h2>Featured</h2>
        <div className="heading-underline"></div>
        <div
          className="featured-scroller"
          ref={scrollerRef}
          onMouseEnter={() => { isPaused.current = true; }}
          onMouseLeave={() => {
            isPaused.current = false;
            handleMouseUp();
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <div id="feat-track">
            {displayItems.map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                className="feat-card"
                onClick={() => handleClickItem(item)}
              >
                <div className="thumb-wrap">
                  <img
                    src={imgUrl(item.poster_path, 'w300')}
                    alt={getTitle(item)}
                    loading="lazy"
                    onError={e => { (e.target as HTMLImageElement).src = PH; }}
                  />
                  <span
                    className="card-label"
                    style={{ background: typeBg(item.contentType) }}
                  >
                    {typeLabel(item.contentType)}
                  </span>
                  {item.vote_average ? (
                    <span className="card-rating-badge">
                      ★ {item.vote_average.toFixed(1)}
                    </span>
                  ) : null}
                </div>
                <div className="card-body">
                  <div className="card-title">{getTitle(item)}</div>
                  <div className="card-meta">{getYear(item)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
