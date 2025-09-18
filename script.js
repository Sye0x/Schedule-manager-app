// --- helpers ---
function to24Hour(hour, minute, ampm) {
    hour = parseInt(hour, 10);
    minute = parseInt(minute, 10);
    if (ampm === 'PM' && hour !== 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
    return String(hour).padStart(2, '0') + ':' + String(minute).padStart(2, '0');
}
function timeToMinutes(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
function minutesToTime(m) { const h = Math.floor(m / 60), min = m % 60; return String(h).padStart(2, '0') + ':' + String(min).padStart(2, '0'); }
function overlaps(aStart, aEnd, bStart, bEnd) { return aStart < bEnd && bStart < aEnd; }

const STORAGE_KEY = 'timetableLectures_v3';
function load() { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
function save(list) { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }

const headers = ["Time", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
function renderHeader(c) {
    c.innerHTML = '';
    headers.forEach(h => {
        const d = document.createElement('div');
        d.className = 'header';
        d.textContent = h;
        c.appendChild(d);
    });
}

function createLectureEl(l) {
    const w = document.createElement('div');
    w.className = 'lecture';
    const btn = document.createElement('button');
    btn.className = 'remove-btn';
    btn.innerHTML = '✖';
    btn.onclick = () => deleteLecture(l.id);
    w.innerHTML = `
    <b>${l.subject}</b>
    <div class="teacher">${l.teacher || ''}</div>
    <div class="room">${l.room || ''}</div>
    <div class="time-range">${l.start} - ${l.end}</div>
  `;
    w.appendChild(btn);
    return w;
}

function renderAll() {
    const c = document.getElementById('timetable');
    renderHeader(c);
    const lectures = load();
    if (!lectures.length) return;
    const times = [...new Set(lectures.map(l => l.start))].sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
    times.forEach(t => {
        const timeCell = document.createElement('div');
        timeCell.className = 'time';
        timeCell.textContent = t;
        c.appendChild(timeCell);
        for (let i = 1; i < headers.length; i++) {
            const day = headers[i];
            const cell = document.createElement('div');
            const f = lectures.find(l => l.day === day && l.start === t);
            if (f) cell.appendChild(createLectureEl(f));
            c.appendChild(cell);
        }
    });
}

function openModal() {
    document.getElementById('modal').style.display = 'flex';
    updateEndTime();
}
function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

function saveLecture() {
    const day = document.getElementById('day').value;
    const hour = document.getElementById('hour').value;
    const minute = document.getElementById('minute').value;
    const ampm = document.getElementById('ampm').value;
    const subject = document.getElementById('subject').value.trim();
    const teacher = document.getElementById('teacher').value.trim();
    const room = document.getElementById('room').value.trim();
    if (!day || !subject) { alert('Day and subject required'); return; }
    const start = to24Hour(hour, minute, ampm);
    const startM = timeToMinutes(start), endM = startM + 50, end = minutesToTime(endM);
    const list = load();
    for (const l of list) {
        if (l.day !== day) continue;
        if (overlaps(startM, endM, timeToMinutes(l.start), timeToMinutes(l.end))) {
            alert(`Conflict with ${l.subject} (${l.start}-${l.end})`); return;
        }
    }
    list.push({ id: Date.now(), day, start, end, subject, teacher, room });
    save(list); renderAll(); closeModal();
}

function deleteLecture(id) {
    if (confirm('Delete this lecture?')) {
        save(load().filter(l => l.id !== id));
        renderAll();
    }
}
function clearTimetable() {
    if (confirm('Clear all?')) {
        localStorage.removeItem(STORAGE_KEY);
        renderAll();
    }
}

function updateEndTime() {
    const hour = document.getElementById('hour').value;
    const minute = document.getElementById('minute').value;
    const ampm = document.getElementById('ampm').value;
    if (!hour || !minute || !ampm) {
        document.getElementById('endTimeDisplay').textContent = '--:--';
        return;
    }
    const start = to24Hour(hour, minute, ampm);
    document.getElementById('endTimeDisplay').textContent = minutesToTime(timeToMinutes(start) + 50);
}

window.onload = () => {
    // fill hour/minute dropdowns
    const hourSel = document.getElementById('hour');
    for (let i = 1; i <= 12; i++) {
        const o = document.createElement('option');
        o.text = i;
        hourSel.add(o);
    }
    const minSel = document.getElementById('minute');
    ["00", "10", "20", "30", "40", "50"].forEach(m => {
        const o = document.createElement('option');
        o.text = m;
        minSel.add(o);
    });
    document.getElementById('hour').addEventListener('change', updateEndTime);
    document.getElementById('minute').addEventListener('change', updateEndTime);
    document.getElementById('ampm').addEventListener('change', updateEndTime);
    renderAll();
};
