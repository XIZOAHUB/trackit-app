/* ============================================================
   TRACKIT! v2.1 — CALENDAR, AGENDA & NOTIFICATIONS LOGIC
   ============================================================ */

/* ─── Storage Keys & State ─── */
const STORAGE_AGENDA = 'trackit_v2_agenda';
let agenda = JSON.parse(localStorage.getItem(STORAGE_AGENDA)) || {}; 
let selectedCalDate = todayISO(); 
let currentCalMonth = new Date(); 

/* ─── DOM Refs ─── */
const CAL_DOM = {
  viewCalendar:      $('viewCalendar'),
  btnShowCalendar:   $('btnShowCalendar'),
  grid:              $('fullCalendarGrid'),
  label:             $('currentMonthLabel'),
  prev:              $('btnPrevMonth'),
  next:              $('btnNextMonth'),
  inputEvent:        $('inputNewEvent'),
  agendaList:        $('agendaList'),
  btnNotif:          $('btnEnableNotif')
};

/* ─── Init Additional Events ─── */
CAL_DOM.btnShowCalendar.addEventListener('click', () => {
  showView('calendar');
  renderCalendar();
  renderAgenda();
  closeMobileSidebar();
});

CAL_DOM.prev.addEventListener('click', () => {
  currentCalMonth.setMonth(currentCalMonth.getMonth() - 1);
  renderCalendar();
});

CAL_DOM.next.addEventListener('click', () => {
  currentCalMonth.setMonth(currentCalMonth.getMonth() + 1);
  renderCalendar();
});

CAL_DOM.inputEvent.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && CAL_DOM.inputEvent.value.trim()) {
    addAgendaEvent(CAL_DOM.inputEvent.value.trim());
    CAL_DOM.inputEvent.value = '';
  }
});

CAL_DOM.btnNotif.addEventListener('click', requestNotificationPermission);

/* ─── Calendar Logic ─── */
function renderCalendar() {
  CAL_DOM.grid.innerHTML = '';
  const year = currentCalMonth.getFullYear();
  const month = currentCalMonth.getMonth();
  
  CAL_DOM.label.textContent = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentCalMonth);

  // Day Headers
  ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(d => {
    const h = document.createElement('div');
    h.className = 'cal-day-header';
    h.textContent = d;
    CAL_DOM.grid.appendChild(h);
  });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Empty slots
  for (let i = 0; i < firstDay; i++) {
    const div = document.createElement('div');
    div.className = 'cal-day empty';
    CAL_DOM.grid.appendChild(div);
  }

  // Days
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const div = document.createElement('div');
    div.className = 'cal-day';
    if (dateStr === todayISO()) div.classList.add('today');
    if (dateStr === selectedCalDate) div.classList.add('selected');
    if (agenda[dateStr] && agenda[dateStr].length > 0) div.classList.add('has-event');
    
    div.textContent = i;
    div.onclick = () => {
      selectedCalDate = dateStr;
      renderCalendar();
      renderAgenda();
    };
    CAL_DOM.grid.appendChild(div);
  }
}

/* ─── Agenda Logic ─── */
function renderAgenda() {
  CAL_DOM.agendaList.innerHTML = '';
  const events = agenda[selectedCalDate] || [];
  
  if (events.length === 0) {
    CAL_DOM.agendaList.innerHTML = `<p class="agenda-empty">No plans for ${formatDate(selectedCalDate)}. Add one above!</p>`;
    return;
  }

  events.forEach((ev, idx) => {
    const div = document.createElement('div');
    div.className = 'agenda-event';
    div.innerHTML = `
      <span class="agenda-event-text">${escHtml(ev)}</span>
      <span class="agenda-event-del" onclick="deleteAgendaEvent('${selectedCalDate}', ${idx})">Delete</span>
    `;
    CAL_DOM.agendaList.appendChild(div);
  });
}

function addAgendaEvent(text) {
  if (!agenda[selectedCalDate]) agenda[selectedCalDate] = [];
  agenda[selectedCalDate].push(text);
  saveAgenda();
  renderAgenda();
  renderCalendar();
  showToast("Event added to agenda!");
}

window.deleteAgendaEvent = function(date, idx) {
  agenda[date].splice(idx, 1);
  saveAgenda();
  renderAgenda();
  renderCalendar();
};

function saveAgenda() {
  localStorage.setItem(STORAGE_AGENDA, JSON.stringify(agenda));
}

/* ─── Notification Logic (Offline) ─── */
async function requestNotificationPermission() {
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    showToast("Notifications Enabled!", "success");
    // Test Notif
    new Notification("TrackIt! Active", {
      body: "Aapke exams aur challenges ke updates yahan milenge.",
      icon: "icon-192.png"
    });
  } else {
    showToast("Notification permission denied.", "danger");
  }
}

/* ─── Integrate with existing showView ─── */
const originalShowView = showView;
showView = function(view) {
  originalShowView(view);
  if (view !== 'calendar') CAL_DOM.viewCalendar.classList.add('hidden');
  else CAL_DOM.viewCalendar.classList.remove('hidden');
};
