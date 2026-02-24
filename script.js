/* ============================================================
   TRACKIT! v2.2 — COMPLETE INTEGRATED SCRIPT
   ============================================================ */

/* ── Utilities ── */
const $ = id => document.getElementById(id);
const todayISO = () => new Date().toISOString().split('T')[0];
const escHtml = s => s.replace(/[&<>"']/g, c =>
  ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return new Date(+y, +m - 1, +d).toLocaleDateString('en-US',
    { month: 'long', day: 'numeric', year: 'numeric' });
}
function isoToday() { return todayISO(); }
function addDays(iso, n) {
  const d = new Date(iso); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0];
}
function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

/* ── Storage ── */
const STORE_HABITS  = 'trackit_v2_habits';
const STORE_AGENDA  = 'trackit_v2_agenda';
const STORE_THEME   = 'trackit_v2_theme';

function loadHabits()  { try { return JSON.parse(localStorage.getItem(STORE_HABITS))  || []; } catch { return []; } }
function saveHabits()  { localStorage.setItem(STORE_HABITS, JSON.stringify(habits)); }
function loadAgenda()  { try { return JSON.parse(localStorage.getItem(STORE_AGENDA)) || {}; } catch { return {}; } }
function saveAgenda()  { localStorage.setItem(STORE_AGENDA, JSON.stringify(agenda)); }

/* ── App State ── */
let habits = loadHabits();
let agenda = loadAgenda();
let activeHabitId = null;
let editingHabitId = null;
let selectedDuration = 21;
let selectedColor = '#6c63ff';
let noteTargetDay = null;
let currentView = 'empty'; // 'empty' | 'detail' | 'calendar' | 'archive'
let selectedCalDate = todayISO();
let currentCalMonth = new Date();

/* ── View management ── */
const VIEWS = { empty: $('viewEmpty'), detail: $('viewDetail'), calendar: $('viewCalendar'), archive: $('viewArchive') };
function showView(name) {
  currentView = name;
  Object.entries(VIEWS).forEach(([k, el]) => el.classList.toggle('hidden', k !== name));
  $('topbarTitle').textContent = name === 'detail' && activeHabitId
    ? (habits.find(h => h.id === activeHabitId)?.name || 'TrackIt!')
    : 'TrackIt!';
}

/* ── Generate ID ── */
const genId = () => Math.random().toString(36).slice(2, 10);

/* ── Toast ── */
function showToast(msg, type = '') {
  const t = document.createElement('div');
  t.className = 'toast' + (type ? ' ' + type : '');
  t.textContent = msg;
  $('toastContainer').appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

/* ── Confetti ── */
function launchConfetti() {
  const canvas = $('confettiCanvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#6c63ff','#f59e0b','#10b981','#ef4444','#3b82f6','#ec4899'];
  const particles = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    r: Math.random() * 5 + 3,
    d: Math.random() * 120 + 60,
    color: colors[Math.floor(Math.random() * colors.length)],
    tilt: Math.random() * 10 - 5,
    tiltAngle: 0,
    tiltSpeed: Math.random() * .1 + .05
  }));

  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.tiltAngle += p.tiltSpeed;
      p.y += (Math.cos(frame / 80 + p.d) + 3 + p.r / 2) * 0.9;
      p.tilt = Math.sin(p.tiltAngle) * 12;
      ctx.beginPath();
      ctx.lineWidth = p.r / 2;
      ctx.strokeStyle = p.color;
      ctx.moveTo(p.x + p.tilt + p.r / 4, p.y);
      ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 4);
      ctx.stroke();
    });
    frame++;
    if (frame < 200) requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  draw();
}

/* ═══════════════════════════════════════════════
   HABIT CRUD
═══════════════════════════════════════════════ */
function createHabit(name, days, startDate, color) {
  return {
    id: genId(),
    name,
    days,
    startDate,
    color: color || '#6c63ff',
    createdAt: new Date().toISOString(),
    archived: false,
    log: {} // { 'YYYY-MM-DD': { done: bool, note: string } }
  };
}

function openHabitModal(editId = null) {
  editingHabitId = editId;
  $('modalHabitTitle').textContent = editId ? 'Edit habit' : 'New habit';
  $('btnSaveHabit').textContent = editId ? 'Save changes →' : 'Create habit →';

  if (editId) {
    const h = habits.find(h => h.id === editId);
    $('inputHabitName').value = h.name;
    $('inputStartDate').value = h.startDate;
    selectedDuration = h.days;
    selectedColor = h.color || '#6c63ff';
    document.querySelectorAll('.dur-btn').forEach(b => b.classList.toggle('active', +b.dataset.days === selectedDuration));
    document.querySelectorAll('.color-swatch').forEach(b => b.classList.toggle('active', b.dataset.color === selectedColor));
  } else {
    $('inputHabitName').value = '';
    $('inputStartDate').value = todayISO();
    selectedDuration = 21;
    selectedColor = '#6c63ff';
    document.querySelectorAll('.dur-btn').forEach(b => b.classList.toggle('active', b.dataset.days === '21'));
    document.querySelectorAll('.color-swatch').forEach(b => b.classList.toggle('active', b.dataset.color === '#6c63ff'));
  }
  $('modalHabit').classList.remove('hidden');
  setTimeout(() => $('inputHabitName').focus(), 50);
}

function closeHabitModal() { $('modalHabit').classList.add('hidden'); editingHabitId = null; }

function saveHabit() {
  const name = $('inputHabitName').value.trim();
  const startDate = $('inputStartDate').value || todayISO();
  if (!name) { showToast('Please enter a habit name', 'danger'); $('inputHabitName').focus(); return; }

  if (editingHabitId) {
    const h = habits.find(h => h.id === editingHabitId);
    h.name = name; h.days = selectedDuration; h.startDate = startDate; h.color = selectedColor;
    showToast('Habit updated!', 'success');
  } else {
    const h = createHabit(name, selectedDuration, startDate, selectedColor);
    habits.push(h);
    activeHabitId = h.id;
    showToast('Habit created!', 'success');
  }
  saveHabits();
  closeHabitModal();
  renderSidebar();
  if (activeHabitId) openDetail(activeHabitId);
}

function deleteHabit(id) {
  if (!confirm('Delete this habit? This cannot be undone.')) return;
  habits = habits.filter(h => h.id !== id);
  if (activeHabitId === id) activeHabitId = null;
  saveHabits();
  renderSidebar();
  showView(habits.filter(h => !h.archived).length ? 'empty' : 'empty');
  showToast('Habit deleted');
}

function archiveHabit(id) {
  const h = habits.find(h => h.id === id);
  if (!h) return;
  h.archived = true;
  saveHabits();
  activeHabitId = null;
  renderSidebar();
  showView('archive');
  renderArchiveView();
  showToast('Habit archived');
}

function unarchiveHabit(id) {
  const h = habits.find(h => h.id === id);
  if (!h) return;
  h.archived = false;
  saveHabits();
  renderSidebar();
  renderArchiveView();
  showToast('Habit restored');
}

/* ═══════════════════════════════════════════════
   HABIT DETAIL VIEW
═══════════════════════════════════════════════ */
function openDetail(id) {
  const h = habits.find(h => h.id === id);
  if (!h) return;
  activeHabitId = id;
  renderDetail(h);
  showView('detail');
  renderSidebar();
}

function renderDetail(h) {
  const today = todayISO();
  const endDate = addDays(h.startDate, h.days - 1);
  const totalDays = h.days;
  const completedDays = Object.values(h.log).filter(v => v.done).length;
  const pct = Math.round((completedDays / totalDays) * 100);
  const remaining = Math.max(0, totalDays - completedDays);
  const curStreak = calcStreak(h);
  const bestStreak = calcBestStreak(h);

  // Header
  $('detailColorDot').style.background = h.color || '#6c63ff';
  $('detailTitle').textContent = h.name;
  $('detailBadge').textContent = `${h.days}-day challenge`;
  $('detailMeta').textContent = `${formatDate(h.startDate)} → ${formatDate(endDate)}`;

  // Stats
  $('statCompleted').textContent = completedDays;
  $('statRemaining').textContent = remaining;
  $('statPercent').textContent = pct + '%';
  $('statStreak').textContent = curStreak + (curStreak > 0 ? '🔥' : '');
  $('statBest').textContent = bestStreak;

  // Progress
  $('progressFill').style.width = pct + '%';
  $('progressFill').style.background = h.color || '#6c63ff';
  $('progressLabel').textContent = `${completedDays} / ${totalDays} days`;

  // Day grid
  renderDayGrid(h, today);

  // Notes
  renderNotes(h);

  // Confetti on 100%
  if (pct === 100) setTimeout(launchConfetti, 400);
}

function renderDayGrid(h, today) {
  const grid = $('dayGrid');
  grid.innerHTML = '';
  for (let i = 0; i < h.days; i++) {
    const iso = addDays(h.startDate, i);
    const entry = h.log[iso] || {};
    const isFuture = iso > today;
    const isToday = iso === today;

    const cell = document.createElement('div');
    cell.className = 'day-cell';
    cell.setAttribute('role', 'button');
    cell.setAttribute('aria-label', `Day ${i + 1} – ${formatDate(iso)}`);
    cell.textContent = i + 1;

    if (entry.done) cell.classList.add('done');
    if (isToday) cell.classList.add('today-cell');
    if (isFuture) { cell.classList.add('future-cell'); cell.setAttribute('aria-disabled', 'true'); }
    if (entry.note) cell.classList.add('has-note');

    // Color the done cells
    if (entry.done) {
      cell.style.background = (h.color || '#6c63ff') + '22';
      cell.style.borderColor = h.color || '#6c63ff';
      cell.style.color = h.color || '#6c63ff';
    }

    if (!isFuture) {
      cell.addEventListener('click', () => openNoteModal(h, iso, i + 1));
    }
    grid.appendChild(cell);
  }
}

function renderNotes(h) {
  const list = $('notesList');
  list.innerHTML = '';
  const entries = Object.entries(h.log)
    .filter(([, v]) => v.note)
    .sort((a, b) => a[0].localeCompare(b[0]));
  $('notesCount').textContent = entries.length ? `(${entries.length})` : '';
  if (!entries.length) { list.innerHTML = '<p style="color:var(--text-3);font-size:.82rem;">No notes yet.</p>'; return; }
  entries.forEach(([iso, entry]) => {
    const dayNum = daysBetween(h.startDate, iso) + 1;
    const card = document.createElement('div');
    card.className = 'note-card';
    card.innerHTML = `
      <div class="note-card-top">
        <span class="note-day-badge">Day ${dayNum}</span>
        <span class="note-done-pill ${entry.done ? 'done' : 'skip'}">${entry.done ? '✓ done' : '✗ skipped'}</span>
        <span style="font-family:var(--font-mono);font-size:.68rem;color:var(--text-3);margin-left:auto;">${formatDate(iso)}</span>
      </div>
      <p class="note-text">${escHtml(entry.note)}</p>
    `;
    list.appendChild(card);
  });
}

/* ── Streak calculations ── */
function calcStreak(h) {
  let streak = 0;
  let d = todayISO();
  while (true) {
    if (d < h.startDate) break;
    if (h.log[d]?.done) { streak++; d = addDays(d, -1); }
    else if (d === todayISO()) { d = addDays(d, -1); } // today not yet done — check yesterday
    else break;
  }
  return streak;
}

function calcBestStreak(h) {
  let best = 0, cur = 0;
  for (let i = 0; i < h.days; i++) {
    const iso = addDays(h.startDate, i);
    if (h.log[iso]?.done) { cur++; best = Math.max(best, cur); }
    else cur = 0;
  }
  return best;
}

/* ═══════════════════════════════════════════════
   NOTE MODAL
═══════════════════════════════════════════════ */
function openNoteModal(h, iso, dayNum) {
  noteTargetDay = iso;
  const entry = h.log[iso] || {};
  $('modalNoteTitle').textContent = `Day ${dayNum}`;
  $('noteDayLabel').textContent = `Day ${dayNum} — ${formatDate(iso)}`;
  $('noteDoneCheckbox').checked = !!entry.done;
  $('inputNoteText').value = entry.note || '';
  $('modalNote').classList.remove('hidden');
  setTimeout(() => $('inputNoteText').focus(), 50);
}

function closeNoteModal() { $('modalNote').classList.add('hidden'); noteTargetDay = null; }

function saveNote() {
  const h = habits.find(h => h.id === activeHabitId);
  if (!h || !noteTargetDay) return;
  const done = $('noteDoneCheckbox').checked;
  const note = $('inputNoteText').value.trim();

  if (!done && !note) {
    delete h.log[noteTargetDay];
  } else {
    h.log[noteTargetDay] = { done, note };
  }
  saveHabits();
  closeNoteModal();
  renderDetail(h);
  renderSidebar();
  if (done) showToast('Day marked complete! 🎯', 'success');
}

/* ═══════════════════════════════════════════════
   SIDEBAR
═══════════════════════════════════════════════ */
function renderSidebar() {
  const list = $('habitList');
  const active = habits.filter(h => !h.archived);
  list.innerHTML = '';

  if (!active.length) {
    list.innerHTML = '<p style="color:var(--text-3);font-size:.75rem;padding:10px 10px;">No habits yet.</p>';
    if (currentView === 'detail') showView('empty');
    return;
  }

  active.forEach(h => {
    const total = h.days;
    const done = Object.values(h.log).filter(v => v.done).length;
    const pct = Math.round((done / total) * 100);
    const item = document.createElement('div');
    item.className = 'habit-item' + (h.id === activeHabitId ? ' active' : '');
    item.innerHTML = `
      <div class="habit-item-dot" style="background:${h.color || '#6c63ff'}"></div>
      <span class="habit-item-label">${escHtml(h.name)}</span>
      <span class="habit-item-pct">${pct}%</span>
    `;
    item.addEventListener('click', () => { openDetail(h.id); closeMobileSidebar(); });
    list.appendChild(item);
  });
}

/* ═══════════════════════════════════════════════
   ARCHIVE VIEW
═══════════════════════════════════════════════ */
function renderArchiveView() {
  const arch = habits.filter(h => h.archived);
  $('archEmpty').classList.toggle('hidden', arch.length > 0);
  const list = $('archList');
  list.innerHTML = '';
  arch.forEach(h => {
    const total = h.days;
    const done = Object.values(h.log).filter(v => v.done).length;
    const pct = Math.round((done / total) * 100);
    const card = document.createElement('div');
    card.className = 'arch-card';
    card.innerHTML = `
      <div class="arch-card-dot" style="background:${h.color || '#6c63ff'}"></div>
      <div class="arch-card-info">
        <div class="arch-card-name">${escHtml(h.name)}</div>
        <div class="arch-card-meta">${h.days} days · ${pct}% complete · started ${formatDate(h.startDate)}</div>
      </div>
      <div class="arch-card-actions">
        <button class="action-btn" onclick="unarchiveHabit('${h.id}')">Restore</button>
        <button class="action-btn danger" onclick="confirmDeleteArchived('${h.id}')">Delete</button>
      </div>
    `;
    list.appendChild(card);
  });
}

window.unarchiveHabit = unarchiveHabit;
window.confirmDeleteArchived = function(id) {
  if (!confirm('Permanently delete this habit?')) return;
  habits = habits.filter(h => h.id !== id);
  saveHabits();
  renderArchiveView();
  showToast('Habit deleted');
};

/* ═══════════════════════════════════════════════
   CALENDAR VIEW
═══════════════════════════════════════════════ */
function renderCalendar() {
  const grid = $('fullCalendarGrid');
  grid.innerHTML = '';
  const year = currentCalMonth.getFullYear();
  const month = currentCalMonth.getMonth();

  $('currentMonthLabel').textContent = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentCalMonth);

  // Headers
  ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => {
    const h = document.createElement('div');
    h.className = 'cal-day-header';
    h.textContent = d;
    grid.appendChild(h);
  });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    const div = document.createElement('div'); div.className = 'cal-day empty'; grid.appendChild(div);
  }

  const today = todayISO();
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
    const div = document.createElement('div');
    div.className = 'cal-day';
    if (dateStr === today) div.classList.add('today');
    if (dateStr === selectedCalDate) div.classList.add('selected');
    if (agenda[dateStr]?.length) div.classList.add('has-event');

    // Check if any habit was done on this day
    const anyDone = habits.some(h => !h.archived && h.log[dateStr]?.done);
    if (anyDone) div.classList.add('has-habit');

    div.textContent = i;
    div.addEventListener('click', () => {
      selectedCalDate = dateStr;
      $('calSelectedDateLabel').textContent = formatDate(selectedCalDate);
      renderCalendar();
      renderAgenda();
      renderCalHabits();
    });
    grid.appendChild(div);
  }
}

function renderCalHabits() {
  const strip = $('calHabitsStrip');
  strip.innerHTML = '';
  const activeHabits = habits.filter(h => !h.archived);
  if (!activeHabits.length) return;

  activeHabits.forEach(h => {
    const dayNum = daysBetween(h.startDate, selectedCalDate) + 1;
    const inRange = dayNum >= 1 && dayNum <= h.days;
    if (!inRange) return;

    const done = h.log[selectedCalDate]?.done || false;
    const pill = document.createElement('div');
    pill.className = 'cal-habit-pill' + (done ? ' done' : '');
    if (done) pill.style.background = h.color || '#6c63ff';
    pill.innerHTML = `
      <div class="cal-habit-pill-dot" style="background:${done ? '#fff' : (h.color || '#6c63ff')}"></div>
      <span>${escHtml(h.name)} <span style="opacity:.7">Day ${dayNum}</span></span>
      <span style="opacity:.7;font-size:.7rem">${done ? '✓' : '○'}</span>
    `;
    pill.title = done ? 'Completed – click to open habit' : 'Click to open habit';
    pill.addEventListener('click', () => { openDetail(h.id); closeMobileSidebar(); });
    strip.appendChild(pill);
  });
}

/* ── Agenda ── */
function renderAgenda() {
  const list = $('agendaList');
  list.innerHTML = '';
  const events = agenda[selectedCalDate] || [];

  if (!events.length) {
    list.innerHTML = `<p class="agenda-empty">No plans for ${formatDate(selectedCalDate)}. Add one above!</p>`;
    return;
  }

  events.forEach((ev, idx) => {
    const div = document.createElement('div');
    div.className = 'agenda-event';
    div.innerHTML = `
      <span class="agenda-event-text">${escHtml(ev)}</span>
      <span class="agenda-event-del">Delete</span>
    `;
    div.querySelector('.agenda-event-del').addEventListener('click', () => {
      agenda[selectedCalDate].splice(idx, 1);
      if (!agenda[selectedCalDate].length) delete agenda[selectedCalDate];
      saveAgenda(); renderAgenda(); renderCalendar();
    });
    list.appendChild(div);
  });
}

function addAgendaEvent(text) {
  if (!text.trim()) return;
  if (!agenda[selectedCalDate]) agenda[selectedCalDate] = [];
  agenda[selectedCalDate].push(text.trim());
  saveAgenda();
  renderAgenda();
  renderCalendar();
  showToast('Event added!');
}

/* ═══════════════════════════════════════════════
   NOTIFICATIONS
═══════════════════════════════════════════════ */
async function requestNotificationPermission() {
  if (!('Notification' in window)) { showToast('Notifications not supported in this browser', 'danger'); return; }
  const perm = await Notification.requestPermission();
  if (perm === 'granted') {
    showToast('Notifications enabled! 🔔', 'success');
    new Notification('TrackIt! is active', {
      body: 'You\'ll get reminders for your habits.',
      icon: 'icon-192.png'
    });
    scheduleNotifications();
  } else {
    showToast('Permission denied. Enable in browser settings.', 'danger');
  }
}

function scheduleNotifications() {
  // Schedule a daily reminder
  const now = new Date();
  const target = new Date();
  target.setHours(20, 0, 0, 0); // 8 PM reminder
  if (target < now) target.setDate(target.getDate() + 1);
  const delay = target - now;
  setTimeout(() => {
    const incomplete = habits.filter(h => !h.archived && !h.log[todayISO()]?.done);
    if (incomplete.length > 0) {
      new Notification('TrackIt! Reminder 🎯', {
        body: `${incomplete.length} habit${incomplete.length > 1 ? 's' : ''} still pending today: ${incomplete.map(h => h.name).join(', ')}`,
        icon: 'icon-192.png'
      });
    }
    scheduleNotifications(); // reschedule for next day
  }, delay);
}

/* ═══════════════════════════════════════════════
   EXPORT DATA
═══════════════════════════════════════════════ */
function exportData() {
  const data = { habits, agenda, exportedAt: new Date().toISOString(), version: '2.2' };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `trackit-backup-${todayISO()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('Data exported!', 'success');
}

/* ═══════════════════════════════════════════════
   THEME
═══════════════════════════════════════════════ */
function setTheme(t) {
  document.documentElement.dataset.theme = t;
  $('themeLabel').textContent = t.charAt(0).toUpperCase() + t.slice(1);
  localStorage.setItem(STORE_THEME, t);
}
function toggleTheme() {
  setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
}

/* ═══════════════════════════════════════════════
   MOBILE SIDEBAR
═══════════════════════════════════════════════ */
function openMobileSidebar() {
  $('sidebar').classList.add('open');
  $('sidebarOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeMobileSidebar() {
  $('sidebar').classList.remove('open');
  $('sidebarOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

/* ═══════════════════════════════════════════════
   KEYBOARD SHORTCUTS
═══════════════════════════════════════════════ */
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.key === 'n' || e.key === 'N') openHabitModal();
  if (e.key === 't' || e.key === 'T') toggleTheme();
  if (e.key === 'Escape') { closeHabitModal(); closeNoteModal(); closeMobileSidebar(); }
});

/* ═══════════════════════════════════════════════
   PWA INSTALL PROMPT
═══════════════════════════════════════════════ */
let deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredInstallPrompt = e;
  $('btnInstallApp').classList.remove('hidden');
});
window.addEventListener('appinstalled', () => {
  $('btnInstallApp').classList.add('hidden');
  showToast('TrackIt! installed successfully! 🎉', 'success');
});

/* ═══════════════════════════════════════════════
   EVENT LISTENERS
═══════════════════════════════════════════════ */

// Habit modal
$('btnNewHabit').addEventListener('click', () => openHabitModal());
$('btnMobileNew').addEventListener('click', () => { closeMobileSidebar(); openHabitModal(); });
$('btnEmptyNew').addEventListener('click', () => openHabitModal());
$('btnCloseHabitModal').addEventListener('click', closeHabitModal);
$('btnCancelHabit').addEventListener('click', closeHabitModal);
$('btnSaveHabit').addEventListener('click', saveHabit);
$('modalHabit').addEventListener('click', e => { if (e.target === $('modalHabit')) closeHabitModal(); });
$('inputHabitName').addEventListener('keydown', e => { if (e.key === 'Enter') saveHabit(); });

// Duration buttons
document.querySelectorAll('.dur-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    selectedDuration = +btn.dataset.days;
    document.querySelectorAll('.dur-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

// Color swatches
document.querySelectorAll('.color-swatch').forEach(btn => {
  btn.addEventListener('click', () => {
    selectedColor = btn.dataset.color;
    document.querySelectorAll('.color-swatch').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

// Note modal
$('btnCloseNoteModal').addEventListener('click', closeNoteModal);
$('btnCancelNote').addEventListener('click', closeNoteModal);
$('btnSaveNote').addEventListener('click', saveNote);
$('modalNote').addEventListener('click', e => { if (e.target === $('modalNote')) closeNoteModal(); });

// Detail actions
$('btnEditHabit').addEventListener('click', () => activeHabitId && openHabitModal(activeHabitId));
$('btnDeleteHabit').addEventListener('click', () => activeHabitId && deleteHabit(activeHabitId));
$('btnArchiveHabit').addEventListener('click', () => activeHabitId && archiveHabit(activeHabitId));

// Sidebar buttons
$('btnEnableNotif').addEventListener('click', requestNotificationPermission);
$('btnExport').addEventListener('click', exportData);
$('btnArchive').addEventListener('click', () => { showView('archive'); renderArchiveView(); closeMobileSidebar(); });
$('btnBackFromArchive').addEventListener('click', () => { showView(activeHabitId ? 'detail' : 'empty'); });
$('btnTheme').addEventListener('click', toggleTheme);
$('btnInstallApp').addEventListener('click', async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  const { outcome } = await deferredInstallPrompt.userChoice;
  if (outcome === 'accepted') $('btnInstallApp').classList.add('hidden');
  deferredInstallPrompt = null;
});

// Calendar
$('btnShowCalendar').addEventListener('click', () => {
  showView('calendar');
  selectedCalDate = todayISO();
  $('calSelectedDateLabel').textContent = formatDate(selectedCalDate);
  renderCalendar();
  renderAgenda();
  renderCalHabits();
  closeMobileSidebar();
});
$('btnPrevMonth').addEventListener('click', () => {
  currentCalMonth.setMonth(currentCalMonth.getMonth() - 1);
  renderCalendar();
});
$('btnNextMonth').addEventListener('click', () => {
  currentCalMonth.setMonth(currentCalMonth.getMonth() + 1);
  renderCalendar();
});
$('inputNewEvent').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    addAgendaEvent($('inputNewEvent').value);
    $('inputNewEvent').value = '';
  }
});

// Mobile sidebar
$('btnMobileMenu').addEventListener('click', openMobileSidebar);
$('sidebarOverlay').addEventListener('click', closeMobileSidebar);

/* ═══════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════ */
(function init() {
  // Restore theme
  const savedTheme = localStorage.getItem(STORE_THEME) || 'dark';
  setTheme(savedTheme);

  // Set today's date default
  $('inputStartDate').value = todayISO();

  // Render sidebar
  renderSidebar();

  // Determine initial view
  const active = habits.filter(h => !h.archived);
  if (active.length === 0) {
    showView('empty');
  } else {
    // Open first habit
    activeHabitId = active[0].id;
    openDetail(active[0].id);
  }
})();
