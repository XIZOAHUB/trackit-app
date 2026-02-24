# Security Policy

## 🔒 Project Security Model

TrackIt! is a **fully client-side application**. There is:
- No backend server
- No database
- No user accounts
- No API keys in this repository
- No sensitive data transmitted over the network

All user data is stored exclusively in the browser's `localStorage`.

---

## Supported Versions

| Version | Supported |
|---------|-----------|
| 2.2.x   | ✅ Active support |
| 2.1.x   | ⚠️ Security fixes only |
| < 2.1   | ❌ No longer supported |

---

## 🐛 Reporting a Vulnerability

Although this is a static app, we take security seriously. Potential issues include:

- **XSS (Cross-Site Scripting)** — malicious input rendering
- **Data leakage** — unintended exposure of localStorage data
- **CSP issues** — Content Security Policy gaps
- **Malicious Service Worker** — SW exploits
- **Third-party dependency issues** — e.g., Google Fonts

### How to Report

**Please do NOT open a public GitHub Issue for security vulnerabilities.**

Instead:

1. **Email**: `security@xizoa.com` _(replace with your actual email)_
2. **Subject line**: `[SECURITY] TrackIt! – Brief description`
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (optional)

### What to Expect

| Timeline | Action |
|---|---|
| **24–48 hours** | Acknowledgement of your report |
| **7 days** | Initial assessment & severity rating |
| **30 days** | Fix released (for confirmed vulnerabilities) |
| **After fix** | Public disclosure + credit to reporter (if desired) |

---

## ✅ Security Best Practices Used

- All user-input strings are **HTML-escaped** before rendering (`escHtml()`)
- No use of `innerHTML` with raw user data (always escaped)
- No `eval()` or `new Function()` anywhere
- Service Worker uses **cache versioning** (stale caches deleted on activate)
- No external scripts loaded at runtime (only Google Fonts CSS)
- No cookies, no sessions, no server communication

---

## 🙏 Hall of Fame

_Responsible disclosure reporters will be credited here._

---

## 📄 License

See [LICENSE](LICENSE).
