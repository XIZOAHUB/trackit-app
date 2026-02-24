# Contributing to TrackIt!

Thank you for your interest in contributing! 🎉  
TrackIt! is a **zero-dependency, vanilla JS** app — contributions are straightforward.

---

## 🧭 Before You Start

- Check existing [Issues](../../issues) and [Pull Requests](../../pulls) to avoid duplicates
- For large features, **open an Issue first** to discuss before coding
- Keep the spirit: **no frameworks, no build tools, no dependencies**

---

## 🔧 Development Setup

```bash
git clone https://github.com/YOUR_USERNAME/trackit.git
cd trackit

# Serve locally (Service Worker needs localhost or HTTPS)
npx serve .
# OR
python3 -m http.server 3000
```

Open `http://localhost:3000` in your browser.

> ⚠️ Never open via `file://` — the Service Worker won't register.

---

## 📋 Contribution Types

### 🐛 Bug Fix
1. Fork → branch: `fix/description-of-bug`
2. Fix the bug
3. Test on both **dark and light** themes
4. Test on **mobile viewport** (Chrome DevTools → 375px width)
5. Open PR with a clear description

### ✨ New Feature
1. Open an Issue first to discuss
2. Fork → branch: `feat/feature-name`
3. Keep code in the existing style (vanilla JS, no classes, no modules)
4. Test thoroughly
5. Update `README.md` if needed
6. Open PR

### 📝 Documentation
- Fix typos, improve clarity, add examples
- Branch: `docs/what-you-changed`

### 🎨 Design / CSS
- Improvements should work in **both themes**
- Should be **mobile-first responsive**
- Avoid adding new external fonts or libraries

---

## ✅ PR Checklist

Before submitting a Pull Request:

- [ ] Tested in Chrome (latest)
- [ ] Tested in Firefox (latest)
- [ ] Tested on mobile viewport (375px)
- [ ] Works in both dark and light themes
- [ ] No new external dependencies added
- [ ] No `console.log` left in production code
- [ ] `escHtml()` used for all user input rendered to DOM
- [ ] PR description clearly explains what & why

---

## 🗂️ Code Style

```js
// ✅ Good — clear, short functions
function saveHabit() {
  const name = $('inputHabitName').value.trim();
  if (!name) { showToast('Name required', 'danger'); return; }
  // ...
}

// ✅ Good — use existing $ helper
const el = $('elementId'); // same as document.getElementById

// ❌ Bad — no external libraries
import _ from 'lodash'; // not allowed

// ❌ Bad — never raw innerHTML with user content
el.innerHTML = userInput; // XSS risk! always use escHtml()
el.innerHTML = escHtml(userInput); // ✅ correct
```

**Formatting:**
- 2-space indentation
- Single quotes for strings
- Semicolons optional but be consistent
- Keep functions short and focused

---

## 🏷️ Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add weekly progress report
fix: streak calculation off by one day
docs: update README deployment section
style: fix mobile calendar padding
refactor: extract renderStats() helper
chore: update sw.js cache version
```

---

## 🙏 Code of Conduct

- Be respectful and constructive
- Welcome beginners — everyone starts somewhere
- Focus on the code, not the person
- No harassment, discrimination, or toxic behavior

---

## 📄 License

By contributing, you agree your contributions will be licensed under the [MIT License](LICENSE).
