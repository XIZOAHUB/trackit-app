/* ============================================================
   TRACKIT! v2 — script.js
   Full app logic: multi-habit, notes, stats, export, confetti
   Vanilla JS — no dependencies
   ============================================================ */

'use strict';

/* ─── Storage Keys ─── */
const STORAGE_HABITS = 'trackit_v2_habits';
const STORAGE_THEME  = 'trackit_v2_theme';

/* ─── App State ─── */
let habits = [];         // all habits (active + archived)
let activeId = null;     // currently viewed habit id
let currentView = 'empty'; // 'empty' | 'detail' | 'archive'

/* ── Modal ephemeral state ── */
let modalMode = 'create';    // 'create' | 'edit'
let editingHabitId = null;
let selectedDays = 21;
let selectedColor = '#3a7a5c';
let noteTargetDay = null;
let longPressTimer = null;

/* ─── DOM refs ─── */
const $ = id => document.getElementById(id);

const DOM = {
  app:              $('app'),
  sidebar:          $('sidebar'),
  sidebarOverlay:   $('sidebarOverlay'),
  habitList:        $('habitList'),
  btnNewHabit:      $('btnNewHabit'),
  btnMobileMenu:    $('btnMobileMenu'),
  btnMobileNew:     $('btnMobileNew'),
  btnArchive:       $('btnArchive'),
  btnExport:        $('btnExport'),
  btnTheme:         $('btnTheme'),
  themeLabel:       $('themeLabel'),

  viewEmpty:        $('viewEmpty'),
  viewDetail:       $('viewDetail'),
  viewArchive:      $('viewArchive'),

  btnEmptyNew:      $('btnEmptyNew'),
  topbarTitle:      $('topbarTitle'),

  detailColorDot:   $('detailColorDot'),
  detailTitle:      $('detailTitle'),
  detailBadge:      $('detailBadge'),
  detailMeta:       $('detailMeta'),
  btnEditHabit:     $('btnEditHabit'),
  btnDeleteHabit:   $('btnDeleteHabit'),

  statCompleted:    $('statCompleted'),
  statRemaining:    $('statRemaining'),
  statPercent:      $('statPercent'),
  statStreak:       $('statStreak'),
  statBestStreak:   $('statBestStreak'),
  statWeekly:       $('statWeekly'),
  progressFill:     $('progressFill'),
  progressLabel:    $('progressLabel'),

  dayGrid:          $('dayGrid'),
  notesSection:     $('notesSection'),
  notesList:        $('notesList'),
  notesCount:       $('notesCount'),

  archList:         $('archList'),
  archEmpty:        $('archEmpty'),
  btnBackFromArchive: $('btnBackFromArchive'),

  // Habit modal
  modalHabit:       $('modalHabit'),
  modalHabitTitle:  $('modalHabitTitle'),
  inputHabitName:   $('inputHabitName'),
  inputHabitDesc:   $('inputHabitDesc'),
  inputStartDate:   $('inputStartDate'),
  btnCloseHabitModal: $('btnCloseHabitModal'),
  btnCancelHabit:   $('btnCancelHabit'),
  btnSaveHabit:     $('btnSaveHabit'),
  colorPicker:      $('colorPicker'),

  // Note modal
  modalNote:        $('modalNote'),
  modalNoteTitle:   $('modalNoteTitle'),
  noteDayLabel:     $('noteDayLabel'),
  noteDoneCheckbox: $('noteDoneCheckbox'),
  inputNoteText:    $('inputNoteText'),
  noteCharCount:    $('noteCharCount'),
  btnCloseNoteModal: $('btnCloseNoteModal'),
  btnCancelNote:    $('btnCancelNote'),
  btnSaveNote:      $('btnSaveNote'),

  toastContainer:   $('toastContainer'),
  confettiCanvas:   $('confettiCanvas'),
};

/* ─── Init ─── */
function init() {
  loadHabits();
  applyTheme(localStorage.getItem(STORAGE_THEME) || 'light');
  bindEvents();
  renderSidebar();

  // Set today's date as default in modal
  DOM.inputStartDate.value = todayISO();

  // Open first active habit if any
  const first = habits.find(h => !h.archived);
  if (first) openHabit(first.id);
  else showView('empty');
}

/* ─── Theme ─── */
let currentTheme = 'light';

function applyTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_THEME, theme);
  DOM.themeLabel.textContent = theme === 'light' ? 'Dark' : 'Light';
  // Swap SVG for moon/sun
  const svg = $('themeIconSvg');
  if (theme === 'dark') {
    svg.innerHTML = '<path d="M12 3a7 7 0 100 10A5 5 0 0112 3z" stroke="currentColor" stroke-width="1.6" fill="none"/>';
  } else {
    svg.innerHTML = '<circle cx="8" cy="8" r="4"/><line x1="8" y1="1" x2="8" y2="2.5"/><line x1="8" y1="13.5" x2="8" y2="15"/><line x1="1" y1="8" x2="2.5" y2="8"/><line x1="13.5" y1="8" x2="15" y2="8"/><line x1="3.2" y1="3.2" x2="4.2" y2="4.2"/><line x1="11.8" y1="11.8" x2="12.8" y2="12.8"/><line x1="12.8" y1="3.2" x2="11.8" y2="4.2"/><line x1="4.2" y1="11.8" x2="3.2" y2="12.8"/>';
  }
}

/* ─── Event Bindings ─── */
function bindEvents() {
  // Sidebar toggles
  DOM.btnNewHabit.addEventListener('click', openCreateModal);
  DOM.btnEmptyNew.addEventListener('click', openCreateModal);
  DOM.btnMobileNew.addEventListener('click', openCreateModal);
  DOM.btnTheme.addEventListener('click', () => applyTheme(currentTheme === 'light' ? 'dark' : 'light'));
  DOM.btnExport.addEventListener('click', exportData);
  DOM.btnArchive.addEventListener('click', showArchive);
  DOM.btnBackFromArchive.addEventListener('click', () => {
    const first = habits.find(h => !h.archived);
    if (first) openHabit(first.id);
    else showView('empty');
  });

  // Mobile sidebar
  DOM.btnMobileMenu.addEventListener('click', toggleMobileSidebar);
  DOM.sidebarOverlay.addEventListener('click', closeMobileSidebar);

  // Detail actions
  DOM.btnEditHabit.addEventListener('click', openEditModal);
  DOM.btnDeleteHabit.addEventListener('click', deleteActiveHabit);

  // Habit modal
  DOM.btnCloseHabitModal.addEventListener('click', closeHabitModal);
  DOM.btnCancelHabit.addEventListener('click', closeHabitModal);
  DOM.btnSaveHabit.addEventListener('click', saveHabit);
  DOM.inputHabitName.addEventListener('keydown', e => { if (e.key === 'Enter') saveHabit(); });

  // Duration buttons (habit modal)
  document.querySelectorAll('.dur-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.dur-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedDays = parseInt(btn.dataset.days, 10);
    });
  });

  // Color picker
  document.querySelectorAll('.cp-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cp-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedColor = btn.dataset.color;
    });
  });

  // Note modal
  DOM.btnCloseNoteModal.addEventListener('click', closeNoteModal);
  DOM.btnCancelNote.addEventListener('click', closeNoteModal);
  DOM.btnSaveNote.addEventListener('click', saveNote);
  DOM.inputNoteText.addEventListener('input', () => {
    DOM.noteCharCount.textContent = `${DOM.inputNoteText.value.length} / 500`;
  });

  // Backdrop click to close modals
  DOM.modalHabit.addEventListener('click', e => { if (e.target === DOM.modalHabit) closeHabitModal(); });
  DOM.modalNote.addEventListener('click', e => { if (e.target === DOM.modalNote) closeNoteModal(); });

  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeyboard);
}

function handleKeyboard(e) {
  const tag = e.target.tagName;
  const inInput = tag === 'INPUT' || tag === 'TEXTAREA';

  // Global shortcuts (only when no modal open)
  if (!inInput && DOM.modalHabit.classList.contains('hidden') && DOM.modalNote.classList.contains('hidden')) {
    if (e.key === 'n' || e.key === 'N') openCreateModal();
    if (e.key === 't' || e.key === 'T') DOM.btnTheme.click();
  }
  // Escape closes modals
  if (e.key === 'Escape') {
    if (!DOM.modalNote.classList.contains('hidden')) closeNoteModal();
    else if (!DOM.modalHabit.classList.contains('hidden')) closeHabitModal();
    else closeMobileSidebar();
  }
}

/* ─── Mobile sidebar ─── */
function toggleMobileSidebar() {
  DOM.sidebar.classList.toggle('open');
  DOM.sidebarOverlay.classList.toggle('visible');
}
function closeMobileSidebar() {
  DOM.sidebar.classList.remove('open');
  DOM.sidebarOverlay.classList.remove('visible');
}

/* ─── Views ─── */
function showView(view) {
  currentView = view;
  DOM.viewEmpty.classList.add('hidden');
  DOM.viewDetail.classList.add('hidden');
  DOM.viewArchive.classList.add('hidden');
  if (view === 'empty')   DOM.viewEmpty.classList.remove('hidden');
  if (view === 'detail')  DOM.viewDetail.classList.remove('hidden');
  if (view === 'archive') DOM.viewArchive.classList.remove('hidden');
}

/* ─── Sidebar render ─── */
function renderSidebar() {
  const active = habits.filter(h => !h.archived);
  DOM.habitList.innerHTML = '';

  if (active.length === 0) {
    DOM.habitList.innerHTML = `<p class="habit-list-empty">No habits yet.<br>Press <kbd>N</kbd> to add one.</p>`;
    return;
  }

  active.forEach(h => {
    const pct = calcPct(h);
    const item = document.createElement('div');
    item.className = 'habit-item' + (h.id === activeId ? ' active' : '');
    item.dataset.id = h.id;
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-label', `${h.name}, ${pct}% complete`);
    item.innerHTML = `
      <span class="habit-item-dot" style="background:${h.color}"></span>
      <span class="habit-item-name">${escHtml(h.name)}</span>
      <span class="habit-item-pct">${pct}%</span>
    `;
    item.addEventListener('click', () => { openHabit(h.id); closeMobileSidebar(); });
    item.addEventListener('keydown', e => { if (e.key === 'Enter') { openHabit(h.id); closeMobileSidebar(); } });
    DOM.habitList.appendChild(item);
  });
}

/* ─── Open habit ─── */
function openHabit(id) {
  activeId = id;
  showView('detail');
  renderDetail();
  renderSidebar(); // update active state
}

/* ─── Render detail ─── */
function renderDetail() {
  const h = getHabit(activeId);
  if (!h) return;

  const doneCount = Object.keys(h.days).filter(d => h.days[d].done).length;
  const pct = calcPct(h);

  // Header
  DOM.detailColorDot.style.background = h.color;
  DOM.detailTitle.textContent = h.name;
  DOM.detailBadge.textContent = `${h.totalDays}-day challenge`;
  DOM.detailMeta.textContent = `${h.totalDays} days · started ${formatDate(h.startDate)}${h.desc ? ' · ' + h.desc : ''}`;
  DOM.topbarTitle.textContent = h.name;

  // Stats
  const stats = calcStats(h);
  DOM.statCompleted.textContent   = stats.done;
  DOM.statRemaining.textContent   = stats.remaining;
  DOM.statPercent.textContent     = stats.pct + '%';
  DOM.statStreak.textContent      = stats.currentStreak;
  DOM.statBestStreak.textContent  = stats.bestStreak;
  DOM.statWeekly.textContent      = stats.weeklyPct + '%';
  DOM.progressFill.style.width    = stats.pct + '%';
  DOM.progressLabel.textContent   = `${stats.done} / ${h.totalDays} days`;
  DOM.progressFill.style.background = h.color;

  // Grid
  buildGrid(h);

  // Notes
  renderNotes(h);

  // Trigger confetti if just hit 100%
  if (stats.pct === 100 && doneCount === h.totalDays) {
    const wasJustCompleted = h._justCompleted;
    if (wasJustCompleted) {
      launchConfetti(h.color);
      h._justCompleted = false;
    }
  }
}

/* ─── Build grid ─── */
function buildGrid(h) {
  DOM.dayGrid.innerHTML = '';

  for (let i = 1; i <= h.totalDays; i++) {
    const dayData = h.days[i] || { done: false, note: '' };
    const cell = document.createElement('div');
    cell.className = 'day-cell';
    if (dayData.done) cell.classList.add('done');
    if (dayData.note && dayData.note.trim()) cell.classList.add('has-note');

    cell.setAttribute('role', 'listitem');
    cell.setAttribute('tabindex', '0');
    cell.setAttribute('aria-label', `Day ${i}${dayData.done ? ', completed' : ''}${dayData.note ? ', has note' : ''}`);
    cell.dataset.day = i;

    cell.innerHTML = `
      ${dayData.done ? '<span class="cell-check" aria-hidden="true">✓</span>' : ''}
      <span class="cell-num">${String(i).padStart(2, '0')}</span>
      ${dayData.note && dayData.note.trim() ? '<span class="cell-note-dot" aria-hidden="true"></span>' : ''}
    `;

    // Single click = toggle done
    cell.addEventListener('click', () => toggleDay(i));

    // Long press = open note modal
    cell.addEventListener('pointerdown', () => {
      longPressTimer = setTimeout(() => {
        openNoteModal(i);
        longPressTimer = null;
      }, 500);
    });
    cell.addEventListener('pointerup', () => { if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; } });
    cell.addEventListener('pointerleave', () => { if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; } });

    // Keyboard
    cell.addEventListener('keydown', e => {
      if (e.key === 'Enter') toggleDay(i);
      if (e.key === ' ') { e.preventDefault(); openNoteModal(i); }
    });

    DOM.dayGrid.appendChild(cell);
  }
}

/* ─── Toggle day ─── */
function toggleDay(dayNum) {
  const h = getHabit(activeId);
  if (!h) return;

  if (!h.days[dayNum]) h.days[dayNum] = { done: false, note: '' };
  const wasDone = h.days[dayNum].done;
  h.days[dayNum].done = !wasDone;

  // Check for 100% completion milestone
  const doneCount = Object.keys(h.days).filter(d => h.days[d].done).length;
  if (doneCount === h.totalDays) {
    h._justCompleted = true;
    showToast('🎉 Challenge complete! Amazing work!', 'success');
  }

  saveHabits();
  renderDetail();
  renderSidebar();

  // Cell pop animation
  requestAnimationFrame(() => {
    const cell = DOM.dayGrid.querySelector(`[data-day="${dayNum}"]`);
    if (cell) {
      cell.classList.remove('pop');
      void cell.offsetWidth;
      cell.classList.add('pop');
      cell.addEventListener('animationend', () => cell.classList.remove('pop'), { once: true });
    }
  });
}

/* ─── Render notes ─── */
function renderNotes(h) {
  const notes = Object.entries(h.days)
    .filter(([, d]) => d.note && d.note.trim())
    .sort(([a], [b]) => parseInt(a) - parseInt(b));

  DOM.notesCount.textContent = notes.length ? `(${notes.length})` : '';
  DOM.notesList.innerHTML = '';

  if (notes.length === 0) {
    DOM.notesList.innerHTML = '<p class="notes-empty">No notes yet. Long-press any day or press Space on a focused cell to add one.</p>';
    return;
  }

  notes.forEach(([day, data]) => {
    const entry = document.createElement('div');
    entry.className = 'note-entry';
    entry.innerHTML = `
      <span class="note-entry-day">Day ${String(day).padStart(2,'0')}</span>
      <p class="note-entry-text">${escHtml(data.note)}</p>
    `;
    DOM.notesList.appendChild(entry);
  });
}

/* ─── Stats calculation ─── */
function calcStats(h) {
  const doneDays = Object.keys(h.days)
    .filter(d => h.days[d].done)
    .map(Number)
    .sort((a, b) => a - b);

  const done      = doneDays.length;
  const remaining = h.totalDays - done;
  const pct       = h.totalDays > 0 ? Math.round((done / h.totalDays) * 100) : 0;

  // Current streak (tail from the most recently done day)
  let currentStreak = 0;
  if (doneDays.length > 0) {
    let last = doneDays[doneDays.length - 1];
    for (let i = doneDays.length - 1; i >= 0; i--) {
      if (doneDays[i] === last) { currentStreak++; last--; }
      else break;
    }
  }

  // Best streak
  let bestStreak = 0, run = 0;
  for (let i = 0; i < doneDays.length; i++) {
    if (i === 0 || doneDays[i] === doneDays[i-1] + 1) { run++; bestStreak = Math.max(bestStreak, run); }
    else { run = 1; }
  }

  // Weekly completion (last 7 days of the challenge done)
  const recentDays = Array.from({length: 7}, (_, i) => h.totalDays - 6 + i).filter(d => d >= 1);
  const weekDone = recentDays.filter(d => h.days[d] && h.days[d].done).length;
  const weeklyPct = recentDays.length > 0 ? Math.round((weekDone / recentDays.length) * 100) : 0;

  return { done, remaining, pct, currentStreak, bestStreak, weeklyPct };
}

function calcPct(h) {
  const done = Object.keys(h.days).filter(d => h.days[d].done).length;
  return h.totalDays > 0 ? Math.round((done / h.totalDays) * 100) : 0;
}

/* ─── Habit modal ─── */
function openCreateModal() {
  modalMode = 'create';
  editingHabitId = null;
  DOM.modalHabitTitle.textContent = 'New habit';
  DOM.btnSaveHabit.textContent = 'Create habit →';
  DOM.inputHabitName.value = '';
  DOM.inputHabitDesc.value = '';
  DOM.inputStartDate.value = todayISO();

  // Reset duration
  selectedDays = 21;
  document.querySelectorAll('.dur-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.days === '21');
  });

  // Reset color
  selectedColor = '#3a7a5c';
  document.querySelectorAll('.cp-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.color === '#3a7a5c');
  });

  DOM.modalHabit.classList.remove('hidden');
  requestAnimationFrame(() => DOM.inputHabitName.focus());
}

function openEditModal() {
  const h = getHabit(activeId);
  if (!h) return;

  modalMode = 'edit';
  editingHabitId = h.id;
  DOM.modalHabitTitle.textContent = 'Edit habit';
  DOM.btnSaveHabit.textContent = 'Save changes →';
  DOM.inputHabitName.value = h.name;
  DOM.inputHabitDesc.value = h.desc || '';
  DOM.inputStartDate.value = h.startDate ? h.startDate.slice(0, 10) : todayISO();

  selectedDays = h.totalDays;
  document.querySelectorAll('.dur-btn').forEach(b => {
    b.classList.toggle('active', parseInt(b.dataset.days) === h.totalDays);
  });

  selectedColor = h.color;
  document.querySelectorAll('.cp-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.color === h.color);
  });

  DOM.modalHabit.classList.remove('hidden');
  requestAnimationFrame(() => DOM.inputHabitName.focus());
}

function closeHabitModal() {
  DOM.modalHabit.classList.add('hidden');
}

function saveHabit() {
  const name = DOM.inputHabitName.value.trim();
  if (!name) {
    DOM.inputHabitName.focus();
    DOM.inputHabitName.style.borderColor = 'var(--danger)';
    DOM.inputHabitName.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--danger) 13%, transparent)';
    setTimeout(() => {
      DOM.inputHabitName.style.borderColor = '';
      DOM.inputHabitName.style.boxShadow = '';
    }, 1800);
    return;
  }

  const startDate = DOM.inputStartDate.value || todayISO();

  if (modalMode === 'create') {
    const h = {
      id:        genId(),
      name,
      desc:      DOM.inputHabitDesc.value.trim(),
      totalDays: selectedDays,
      color:     selectedColor,
      startDate,
      days:      {},
      archived:  false,
      createdAt: new Date().toISOString(),
    };
    habits.push(h);
    saveHabits();
    closeHabitModal();
    renderSidebar();
    openHabit(h.id);
    showToast(`"${name}" created! Let's go 🚀`, 'success');
  } else {
    const h = getHabit(editingHabitId);
    if (!h) return;
    h.name = name;
    h.desc = DOM.inputHabitDesc.value.trim();
    h.totalDays = selectedDays;
    h.color = selectedColor;
    h.startDate = startDate;
    // Trim days object if totalDays reduced
    Object.keys(h.days).forEach(d => { if (parseInt(d) > h.totalDays) delete h.days[d]; });
    saveHabits();
    closeHabitModal();
    renderSidebar();
    renderDetail();
    showToast('Habit updated!');
  }
}

/* ─── Delete habit ─── */
function deleteActiveHabit() {
  const h = getHabit(activeId);
  if (!h) return;
  const confirmed = window.confirm(`Delete "${h.name}"? This cannot be undone.`);
  if (!confirmed) return;
  habits = habits.filter(x => x.id !== activeId);
  activeId = null;
  saveHabits();
  renderSidebar();
  const next = habits.find(x => !x.archived);
  if (next) openHabit(next.id);
  else showView('empty');
  showToast('Habit deleted.', 'danger');
}

/* ─── Note modal ─── */
function openNoteModal(dayNum) {
  const h = getHabit(activeId);
  if (!h) return;
  noteTargetDay = dayNum;
  const dayData = h.days[dayNum] || { done: false, note: '' };

  DOM.modalNoteTitle.textContent = `Day ${String(dayNum).padStart(2, '0')}`;
  DOM.noteDayLabel.textContent = `${h.name} · Day ${dayNum} of ${h.totalDays}`;
  DOM.noteDoneCheckbox.checked = !!dayData.done;
  DOM.inputNoteText.value = dayData.note || '';
  DOM.noteCharCount.textContent = `${(dayData.note || '').length} / 500`;

  DOM.modalNote.classList.remove('hidden');
  requestAnimationFrame(() => DOM.inputNoteText.focus());
}

function closeNoteModal() {
  DOM.modalNote.classList.add('hidden');
  noteTargetDay = null;
}

function saveNote() {
  const h = getHabit(activeId);
  if (!h || !noteTargetDay) return;
  if (!h.days[noteTargetDay]) h.days[noteTargetDay] = { done: false, note: '' };
  h.days[noteTargetDay].done = DOM.noteDoneCheckbox.checked;
  h.days[noteTargetDay].note = DOM.inputNoteText.value.trim();

  // Check completion
  const doneCount = Object.keys(h.days).filter(d => h.days[d].done).length;
  if (doneCount === h.totalDays) h._justCompleted = true;

  saveHabits();
  closeNoteModal();
  renderDetail();
  renderSidebar();
  showToast('Note saved!');
}

/* ─── Archive view ─── */
function showArchive() {
  showView('archive');
  activeId = null;
  renderSidebar();
  DOM.topbarTitle.textContent = 'Archive';
  closeMobileSidebar();

  const archived = habits.filter(h => h.archived);
  DOM.archList.innerHTML = '';
  DOM.archEmpty.classList.toggle('hidden', archived.length > 0);

  archived.forEach(h => {
    const pct = calcPct(h);
    const card = document.createElement('div');
    card.className = 'arch-card';
    card.innerHTML = `
      <span class="arch-dot" style="background:${h.color}"></span>
      <div class="arch-info">
        <div class="arch-name">${escHtml(h.name)}</div>
        <div class="arch-sub">${h.totalDays} days · started ${formatDate(h.startDate)}</div>
      </div>
      <span class="arch-pct">${pct}%</span>
      <button class="arch-restore" data-id="${h.id}">Restore</button>
    `;
    card.querySelector('.arch-restore').addEventListener('click', () => restoreHabit(h.id));
    DOM.archList.appendChild(card);
  });
}

function restoreHabit(id) {
  const h = getHabit(id);
  if (!h) return;
  h.archived = false;
  saveHabits();
  showToast(`"${h.name}" restored!`, 'success');
  renderSidebar();
  openHabit(id);
}

/* ─── Export ─── */
function exportData() {
  const payload = {
    exportedAt: new Date().toISOString(),
    version: '2.0',
    habits: habits.map(h => ({
      id: h.id, name: h.name, desc: h.desc,
      totalDays: h.totalDays, color: h.color,
      startDate: h.startDate, archived: h.archived,
      completedDays: Object.keys(h.days).filter(d => h.days[d].done).map(Number),
      notes: Object.fromEntries(
        Object.entries(h.days)
          .filter(([,d]) => d.note && d.note.trim())
          .map(([day, d]) => [day, d.note])
      ),
      stats: calcStats(h),
    })),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `trackit-export-${todayISO()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Data exported successfully!', 'success');
}

/* ─── Confetti ─── */
function launchConfetti(accentColor) {
  const canvas = DOM.confettiCanvas;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = [accentColor, '#f5c976', '#f8a4d8', '#7ec8f0', '#a8d8a0', '#f8a090'];
  const pieces = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * -canvas.height,
    w: Math.random() * 10 + 5,
    h: Math.random() * 6 + 3,
    color: colors[Math.floor(Math.random() * colors.length)],
    rot: Math.random() * Math.PI * 2,
    vx: (Math.random() - 0.5) * 3,
    vy: Math.random() * 4 + 2,
    vr: (Math.random() - 0.5) * 0.1,
    alpha: 1,
  }));

  let frame;
  const startTime = Date.now();

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const elapsed = Date.now() - startTime;

    pieces.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.vy += 0.05; // gravity
      if (elapsed > 1800) p.alpha -= 0.015;
      p.alpha = Math.max(0, p.alpha);

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });

    if (elapsed < 3500) frame = requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  if (frame) cancelAnimationFrame(frame);
  draw();
}

/* ─── Toast ─── */
function showToast(msg, type = '') {
  const t = document.createElement('div');
  t.className = 'toast' + (type ? ' ' + type : '');
  t.textContent = msg;
  DOM.toastContainer.appendChild(t);
  setTimeout(() => {
    t.classList.add('out');
    t.addEventListener('animationend', () => t.remove(), { once: true });
  }, 3000);
}

/* ─── Persistence ─── */
function saveHabits() {
  localStorage.setItem(STORAGE_HABITS, JSON.stringify(habits));
}
function loadHabits() {
  try {
    const raw = localStorage.getItem(STORAGE_HABITS);
    habits = raw ? JSON.parse(raw) : [];
  } catch { habits = []; }
}

/* ─── Helpers ─── */
function getHabit(id) { return habits.find(h => h.id === id) || null; }
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function todayISO() { return new Date().toISOString().slice(0, 10); }
function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ─── Start ─── */
init();
