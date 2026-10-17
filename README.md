# FreeMovies (GoToCinema) - React Application

A modern, responsive React + TypeScript + Vite web application for streaming and discovering movies, TV shows, anime, and live TV channels.

Rewritten as a clean React single-page application from the original Dynamic codebase, preserving 100% of the core functionality, business logic, visual identity, and features.

---

## 🚀 Features

- **Movies, TV Shows & Anime:**
  - Integrated with The Movie Database (TMDB) API for real-time popular, trending, and top-rated movies and TV series.
  - AniList GraphQL API integration for trending and featured anime titles, episode counts, and character rosters.
  - Dynamic multi-server player embed switcher with support for custom streaming embeds (YouTube, Google Drive, Archive.org, direct URLs).
  - TV Show season & episode controls with season length metadata, arrow incrementers, and episode navigation.
  - Anime episode navigation with prev/next buttons.
  - Official trailer integration with instant modal preview and seamless player return.
  - Cast cards with character descriptions and actor portrait profiles.
  - Actor/Person modal with biographical details and their full credited filmography.

- **Live TV & Sports Streaming:**
  - HLS (`hls.js`) video streaming player for live IPTV channels.
  - Real-time M3U playlist parsing with automated category grouping, search filtering, and local caching.
  - Stream error detection with automated 3-second recovery and next-channel switching.
  - Multi-tab support for Live IPTV, FIFA / Sports viewer, and external movie stream views with reorderable tab layouts.

- **Discovery & Search:**
  - Real-time live search with instant suggestion previews categorized by People and Movies/Shows.
  - Speech Recognition voice search via the Web Speech API.
  - Advanced Discovery drawer with multi-criteria filtering: media type (Movie, TV, Anime), 30+ spoken languages, genre categorization, release year, and sorting algorithms.
  - Auto-scrolling Featured Carousel with touch/mouse drag scrub and hover pause.
  - Real-time trending ticker in the top bar rotating top titles daily.

- **User Accounts & Admin Control:**
  - Firebase Authentication (email/password sign in and sign up).
  - User profiles with display name, bio, and ImgBB avatar image uploads.
  - Role-based Admin panel for designated admin emails (`ADMIN_CONFIG.adminEmails`):
    - Configure IPTV M3U playlist URL, Sports URL, and Movies URL.
    - Custom tab ordering for Live TV streams.
    - Full CRUD management for Movie player templates (`{id}`), TV player templates (`{id}`, `{s}`, `{e}`), and Anime player templates (`{id}`, `{e}`).
    - Direct download link editor and custom player override for any specific title.

---

## 🛠️ Tech Stack

- **Framework:** React 18, TypeScript, Vite
- **Streaming:** `hls.js` (HTTP Live Streaming)
- **Backend / Auth:** Firebase Auth & Cloud Firestore
- **External APIs:** TMDB v3 API, AniList GraphQL API, ImgBB Upload API
- **Icons & Styling:** SVG icons, Poppins & Montserrat typography, CSS3 gradients & animations

---

## 📦 Getting Started

### Development
```bash
npm install
npm run dev
```
The development server starts on port `3000` (`http://localhost:3000`).

### Production Build
```bash
npm run build
npm run preview
```
