import React, { useEffect, useState } from 'react';
import { MediaItem, PersonItem } from '../types';
import { fetchPerson, getTitle, getYear, imgUrl, typeBg, typeLabel, AVPH, PH } from '../services/api';

interface PersonModalProps {
  personId: number | null;
  onClose: () => void;
  onSelectItem: (item: MediaItem) => void;
}

export const PersonModal: React.FC<PersonModalProps> = ({ personId, onClose, onSelectItem }) => {
  const [person, setPerson] = useState<PersonItem | null>(null);
  const [works, setWorks] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!personId) {
      setPerson(null);
      setWorks([]);
      return;
    }

    setLoading(true);
    fetchPerson(personId)
      .then(({ person: p, works: w }) => {
        setPerson(p);
        setWorks(w);
      })
      .finally(() => setLoading(false));
  }, [personId]);

  if (!personId) return null;

  return (
    <div id="person-view" className="open">
      <button className="person-close-btn" onClick={onClose} title="Close">
        ✕
      </button>

      {loading && (
        <div style={{ textAlign: 'center', padding: '100px 0', color: '#94a3b8' }}>
          Loading actor profile...
        </div>
      )}

      {person && (
        <>
          <div className="person-hero">
            <img
              src={person.profile_path ? imgUrl(person.profile_path, 'w185') : AVPH}
              alt={person.name}
              className="person-photo"
              onError={e => { (e.target as HTMLImageElement).src = AVPH; }}
            />
            <div>
              <div className="person-name">{person.name}</div>
              {person.known_for_department && (
                <span className="person-dept">{person.known_for_department}</span>
              )}
            </div>
          </div>

          {person.biography && <p className="person-bio">{person.biography}</p>}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 24px',
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>All Works</h3>
            <span style={{ fontSize: 12, color: '#64748b' }}>{works.length} titles</span>
          </div>

          <div className="person-works">
            {works.map((w, i) => (
              <div
                key={`${w.id}-${i}`}
                className="post-card"
                onClick={() => {
                  onClose();
                  onSelectItem(w);
                }}
              >
                <div className="thumb-wrap">
                  <img
                    src={imgUrl(w.poster_path, 'w342')}
                    alt={getTitle(w)}
                    loading="lazy"
                    onError={e => { (e.target as HTMLImageElement).src = PH; }}
                  />
                  <span
                    className="card-label"
                    style={{ background: typeBg(w.contentType) }}
                  >
                    {typeLabel(w.contentType)}
                  </span>
                  {w.vote_average ? (
                    <span className="card-rating-badge">★ {w.vote_average.toFixed(1)}</span>
                  ) : null}
                </div>
                <div className="card-body">
                  <div className="card-title">{getTitle(w)}</div>
                  <div className="card-meta">{getYear(w)}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
