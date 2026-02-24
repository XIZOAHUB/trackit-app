# Changelog

All notable changes to TrackIt! are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [2.2.0] — 2026-02-24

### Added
- Color picker for habits (8 colors)
- Best streak stat card in habit detail
- Archive button directly in habit detail view
- Export data as JSON backup
- Calendar shows habit completion dots (green dot on completed days)
- Calendar habit pills — see which habit falls on selected date
- Daily push notifications at 8 PM (Web Notifications API)
- `sw.js` Service Worker — full offline support
- `manifest.json` — proper PWA manifest
- Install App button appears when browser install prompt fires

### Fixed
- Calendar was a fragile addon script — now fully integrated into `script.js`
- `deleteAgendaEvent` was a dangerous global `window` function — replaced with event listeners
- `showView` override pattern that could silently fail
- Service Worker not registering on first load
- Mobile sidebar z-index issues

### Changed
- All views unified into single JS file — no separate addon scripts needed
- Improved mobile responsiveness of stats strip and day grid

---

## [2.1.0] — 2026-02-01

### Added
- Calendar view with monthly grid
- Daily Agenda — add events to any date
- Offline notifications via Web Notifications API
- "Enable Alerts" sidebar button

---

## [2.0.0] — 2026-01-15

### Added
- Initial release
- Habit creation with 21/30/60/90/100/150-day durations
- Day grid tracker with click-to-mark
- Day notes modal
- Current streak tracking
- Progress bar
- Dark / Light theme toggle
- Archive view for completed habits
- localStorage persistence
- Confetti animation on 100% completion
- Mobile responsive layout
- Keyboard shortcuts (N = new habit, T = toggle theme, Esc = close)
