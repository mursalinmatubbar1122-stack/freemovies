import React, { useEffect, useRef } from 'react';
import { MediaItem } from '../types';
import { getTitle, getYear, imgUrl, typeBg, typeLabel, PH } from '../services/api';
import { AD_CONFIG } from '../config/siteConfig';

interface MediaGridProps {
  items: MediaItem[];
  title: string;
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onSelectItem: (item: MediaItem) => void;
}

export const MediaGrid: React.FC<MediaGridProps> = ({
  items,
  title,
  loading,
  hasMore,
  onLoadMore,
  onSelectItem,
}) => {
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          onLoadMore();
        }
      },
      { rootMargin: '400px' }
    );

    if (triggerRef.current) {
      observer.observe(triggerRef.current);
    }
    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  const handleClickItem = (item: MediaItem) => {
    if (AD_CONFIG.directLink.status === 'on' && AD_CONFIG.directLink.url) {
      window.open(AD_CONFIG.directLink.url, '_blank', 'noopener,noreferrer');
    }
    onSelectItem(item);
  };

  return (
    <div id="outer-wrapper">
      <div className="section-heading">{title}</div>

      <div className="posts-grid">
        {items.map(item => {
          const rating = item.vote_average ? item.vote_average.toFixed(1) : '';
          const year = getYear(item);
          return (
            <div
              key={`${item.contentType}-${item.id}`}
              className="post-card"
              onClick={() => handleClickItem(item)}
            >
              <div className="thumb-wrap">
                <img
                  src={imgUrl(item.poster_path)}
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
                {rating ? (
                  <span className="card-rating-badge">★ {rating}</span>
                ) : null}
              </div>
              <div className="card-body">
                <div className="card-title">{getTitle(item)}</div>
                <div className="card-meta">
                  {year && <span>{year}</span>}
                  {rating && <span className="card-rating">★ {rating}</span>}
                </div>
              </div>
            </div>
          );
        })}

        {loading &&
          Array(12)
            .fill(0)
            .map((_, i) => (
              <div key={`skel-${i}`} className="skeleton-card">
                <div className="skel-thumb skeleton" />
                <div className="skel-body">
                  <div className="skel-line skeleton" />
                  <div className="skel-line short skeleton" />
                </div>
              </div>
            ))}
      </div>

      {!loading && items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#888' }}>
          No titles found.
        </div>
      )}

      {hasMore && (
        <div
          ref={triggerRef}
          style={{ height: '30px', margin: '20px 0', textAlign: 'center', color: '#888' }}
        >
          {loading ? '⏳ Loading more...' : ''}
        </div>
      )}
    </div>
  );
};
