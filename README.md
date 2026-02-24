# TrackIt! — Daily Habit & Challenge Tracker

<div align="center">

![TrackIt! Logo](icon-192.png)

**Build streaks. Show up daily. No accounts. No cloud.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-trackit.xizoa.com-6c63ff?style=for-the-badge&logo=vercel)](https://trackit.xizoa.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-blue?style=for-the-badge&logo=pwa)](https://trackit.xizoa.com)
[![Version](https://img.shields.io/badge/Version-2.2.0-orange?style=for-the-badge)](CHANGELOG.md)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎯 **Habit Tracking** | 21, 30, 60, 90, 100, 150-day challenges |
| 🔥 **Streaks** | Current & best streak tracking |
| 📅 **Calendar View** | Monthly calendar with habit heatmap |
| 📝 **Daily Agenda** | Add plans and events to any date |
| 🎨 **Custom Colors** | 8 color options per habit |
| 🔔 **Offline Alerts** | Daily reminders via Web Notifications API |
| 📤 **Export Data** | Backup your data as JSON |
| 🌙 **Dark / Light Mode** | Theme toggle with persistence |
| 📱 **Installable PWA** | Install on Android, iOS, Desktop |
| 🔒 **100% Private** | All data stays in your browser — no server, no account |

---

## 🚀 Live Demo

> **[https://trackit.xizoa.com](https://trackit.xizoa.com)**

---

## 📸 Screenshots

<!-- Add screenshots here after deployment -->
> _Screenshots coming soon_

---

## 🛠️ Tech Stack

- **Vanilla HTML / CSS / JavaScript** — zero dependencies, zero frameworks
- **LocalStorage** — all data stored locally in browser
- **Service Worker** — full offline support
- **Web App Manifest** — installable as PWA
- **Web Notifications API** — daily habit reminders
- **Google Fonts** — Instrument Serif, DM Mono, Manrope

---

## 📁 Project Structure

```
trackit/
├── index.html        # Main app shell & all views
├── style.css         # Complete stylesheet with dark/light themes
├── script.js         # All app logic (habits, calendar, agenda, PWA)
├── sw.js             # Service Worker for offline support
├── manifest.json     # PWA manifest
├── icon-192.png      # App icon (192×192)
├── icon-512.png      # App icon (512×512)
├── robots.txt        # SEO crawler rules
├── sitemap.xml       # SEO sitemap
└── .github/
    ├── workflows/
    │   └── deploy.yml        # Auto-deploy to GitHub Pages
    ├── ISSUE_TEMPLATE/
    │   ├── bug_report.md
    │   └── feature_request.md
    └── pull_request_template.md
```

---

## ⚡ Getting Started (Local Development)

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/trackit.git
cd trackit

# 2. Serve locally (Service Worker needs HTTPS or localhost)
npx serve .
# OR
python3 -m http.server 3000

# 3. Open in browser
# http://localhost:3000
```

> ⚠️ **Do NOT open `index.html` directly** (file:// protocol). Use a local server — the Service Worker requires `localhost` or HTTPS.

---

## 🌐 Deployment

### GitHub Pages (Automatic via Actions)

1. Fork/clone this repo
2. Go to **Settings → Pages → Source**: select `gh-pages` branch
3. Push to `main` — GitHub Action auto-deploys

### Manual Deployment

Upload all files to any static host:
- [Vercel](https://vercel.com) — drag & drop
- [Netlify](https://netlify.com) — drag & drop
- [Cloudflare Pages](https://pages.cloudflare.com)
- Any shared hosting with file access

---

## 🔒 Privacy & Security

- **No server** — your data never leaves your device
- **No analytics** — no tracking, no third-party scripts (only Google Fonts)
- **No accounts** — no email, no password, no sign-up
- **LocalStorage only** — data is in your browser's storage
- **Open source** — audit every line of code yourself

See [SECURITY.md](SECURITY.md) for responsible disclosure policy.

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

1. Fork the repository
2. Create your feature branch: `git checkout -b feat/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feat/amazing-feature`
5. Open a Pull Request

---

## 📝 Changelog

### v2.2.0 (Latest)
- ✅ Full PWA install support (Android, iOS, Desktop)
- ✅ Calendar with habit heatmap and daily agenda
- ✅ Color picker per habit (8 colors)
- ✅ Best streak tracking
- ✅ Data export (JSON backup)
- ✅ Daily push notifications (8 PM reminder)
- ✅ Fully offline — Service Worker caches app shell

### v2.1.0
- ✅ Calendar & Agenda view added
- ✅ Offline notifications via Web Notifications API

### v2.0.0
- ✅ Initial release with streak tracking, dark mode, day grid

---

## 📄 License

MIT © [Your Name](https://github.com/YOUR_USERNAME) — see [LICENSE](LICENSE) for details.

---

<div align="center">
Made with ❤️ · <a href="https://trackit.xizoa.com">trackit.xizoa.com</a>
</div>
