import React, { useState } from 'react';
import { ALL_LANGUAGES, MOVIE_GENRES, TV_GENRES } from '../config/siteConfig';

interface AdvancedFilterProps {
  isOpen: boolean;
  onDiscover: (filters: {
    type: 'movie' | 'tv' | 'anime';
    lang: string;
    genre: string;
    year: string;
    sort: string;
  }) => void;
}

export const AdvancedFilter: React.FC<AdvancedFilterProps> = ({ isOpen, onDiscover }) => {
  const [type, setType] = useState<'movie' | 'tv' | 'anime'>('movie');
  const [langVal, setLangVal] = useState('');
  const [langSearch, setLangSearch] = useState('');
  const [isLangListOpen, setIsLangListOpen] = useState(false);
  const [genre, setGenre] = useState('');
  const [year, setYear] = useState('');
  const [sort, setSort] = useState('popularity.desc');

  const genres = type === 'movie' ? MOVIE_GENRES : TV_GENRES;

  const filteredLangs = ALL_LANGUAGES.filter(l =>
    l.l.toLowerCase().includes(langSearch.toLowerCase())
  );

  const selectedLangLabel = ALL_LANGUAGES.find(l => l.v === langVal)?.l || 'Any Language';

  const handleDiscover = () => {
    onDiscover({
      type,
      lang: langVal,
      genre,
      year: year.trim(),
      sort,
    });
  };

  return (
    <div id="adv-bar" className={isOpen ? 'open' : ''}>
      <div id="adv-inner">
        <div className="adv-row">
          <select
            id="adv-type"
            value={type}
            onChange={e => {
              setType(e.target.value as any);
              setGenre('');
            }}
          >
            <option value="movie">Movie</option>
            <option value="tv">TV Show</option>
            <option value="anime">Anime</option>
          </select>

          <div className="lang-wrap">
            <input
              type="text"
              className="lang-search"
              placeholder={selectedLangLabel}
              value={langSearch}
              onChange={e => setLangSearch(e.target.value)}
              onFocus={() => setIsLangListOpen(true)}
              onBlur={() => setTimeout(() => setIsLangListOpen(false), 200)}
            />
            {isLangListOpen && (
              <div className="lang-list open">
                {filteredLangs.map(l => (
                  <div
                    key={l.v}
                    className={`lang-opt ${langVal === l.v ? 'selected' : ''}`}
                    onMouseDown={() => {
                      setLangVal(l.v);
                      setLangSearch('');
                      setIsLangListOpen(false);
                    }}
                  >
                    {l.l}
                  </div>
                ))}
              </div>
            )}
          </div>

          <select
            id="adv-genre"
            value={genre}
            onChange={e => setGenre(e.target.value)}
          >
            {genres.map(g => (
              <option key={g.v} value={g.v}>
                {g.l}
              </option>
            ))}
          </select>

          <input
            type="number"
            className="adv-year"
            placeholder="Year (e.g. 2024)"
            min="1900"
            max="2099"
            value={year}
            onChange={e => setYear(e.target.value)}
          />

          <select
            id="adv-sort"
            value={sort}
            onChange={e => setSort(e.target.value)}
          >
            <option value="popularity.desc">Most Popular</option>
            <option value="vote_average.desc">Highest Rated</option>
            <option value="primary_release_date.desc">Newest First</option>
            <option value="primary_release_date.asc">Oldest First</option>
          </select>

          <button id="adv-discover" onClick={handleDiscover}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" x2="16.65" y1="21" y2="16.65" />
            </svg>
            Discover
          </button>
        </div>
      </div>
    </div>
  );
};
