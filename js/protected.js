// protected.js — Dashboard

const MILESTONES = [7, 14, 21, 30, 40, 50, 60, 75, 90, 105, 120, 140, 160, 180, 200, 225, 250, 275, 300, 330, 360, 390, 420, 450];

function formatDate(date) {
  return date.toLocaleDateString("de-CH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function calculateAge(geburtstag) {
  const today = new Date();
  const birth = new Date(geburtstag);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function getDateString(datetime) {
  return (datetime || "").split("T")[0].split(" ")[0];
}

function localDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function brushedToday(sessions) {
  const today = localDateString();
  return sessions.some((s) => s.completed == 1 && s.startTime.startsWith(today));
}

function countBrushedToday(sessions) {
  const today = localDateString();
  return sessions.filter((s) => s.completed == 1 && s.startTime.startsWith(today)).length;
}

function calculateStreak(sessions) {
  const countPerDay = {};
  sessions
    .filter((s) => s.completed == 1)
    .forEach((s) => {
      const day = getDateString(s.startTime);
      countPerDay[day] = (countPerDay[day] || 0) + 1;
    });

  const completedDays = Object.keys(countPerDay)
    .filter((day) => countPerDay[day] >= 2)
    .sort()
    .reverse();

  if (completedDays.length === 0) return 0;

  const today = localDateString();
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yesterday = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  if (completedDays[0] !== today && completedDays[0] !== yesterday) return 0;

  let streak = 0;
  const checkDate = new Date(completedDays[0] + "T00:00:00");

  for (const day of completedDays) {
    const expected = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, "0")}-${String(checkDate.getDate()).padStart(2, "0")}`;
    if (day === expected) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function calculatePoints(sessions) {
  const dayCount = {};
  sessions.filter((s) => s.completed == 1).forEach((s) => {
    const day = getDateString(s.startTime);
    dayCount[day] = (dayCount[day] || 0) + 1;
  });
  return Object.values(dayCount).filter((count) => count >= 2).length;
}

function calculateStickersFromPoints(points) {
  return MILESTONES.filter((m) => points >= m).length;
}

function calculateWeeklyProgress(sessions) {
  const now = new Date();
  const daysSinceMonday = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - daysSinceMonday);

  const countPerDay = {};
  sessions
    .filter((s) => s.completed == 1 && new Date(s.startTime) >= monday)
    .forEach((s) => {
      const day = new Date(s.startTime).toDateString();
      countPerDay[day] = (countPerDay[day] || 0) + 1;
    });
  return Object.values(countPerDay).filter((count) => count >= 2).length;
}

function calculateLongestStreak(sessions) {
  const completedDays = [
    ...new Set(
      sessions
        .filter((s) => s.completed == 1)
        .map((s) => getDateString(s.startTime))
    ),
  ].sort();

  if (completedDays.length === 0) return 0;

  let longest = 1;
  let current = 1;

  for (let i = 1; i < completedDays.length; i++) {
    const prev = new Date(completedDays[i - 1]);
    const curr = new Date(completedDays[i]);
    const diff = (curr - prev) / 86400000;
    if (diff === 1) {
      current++;
      if (current > longest) longest = current;
    } else {
      current = 1;
    }
  }
  return longest;
}

function renderChildCard(child, sessions) {
  const age = calculateAge(child.geburtstag);
  const streak = calculateStreak(sessions);
  const points = calculatePoints(sessions);
  const weeklyProgress = calculateWeeklyProgress(sessions);
  const isBrushedToday = brushedToday(sessions);
  const countToday = Math.min(countBrushedToday(sessions), 2);

  const card = document.createElement("div");
  card.className = "child-card";
  card.innerHTML = `
    <div class="child-header">
      <div class="avatar-picker-anchor">
        <div class="child-avatar" onclick="toggleDashboardAvatarPicker(${child.id}, event)">${getAvatar(child.id)}</div>
        <span class="avatar-edit-hint">&#x270F;</span>
        <div id="dashAvatarPicker-${child.id}" class="avatar-picker hidden"></div>
      </div>
      <div class="child-header-link" onclick="window.location.href='child-profile.html?id=${child.id}'">
        <div class="child-info">
          <h2>${child.name}</h2>
          <p>${age} Jahre alt</p>
        </div>
      </div>
      <button type="button" class="edit-btn" onclick="toggleEditForm(${child.id})">&#x270F;</button>
    </div>
    <div id="editForm-${child.id}" class="edit-form">
      <input type="text" id="editName-${child.id}" value="${child.name}" placeholder="Name" />
      <input type="date" id="editGeburtstag-${child.id}" value="${child.geburtstag}" />
      <div class="edit-form-buttons">
        <button type="button" onclick="saveChild(${child.id})">Speichern</button>
        <button type="button" class="btn-cancel" onclick="closeEditForm(${child.id})">Abbrechen</button>
      </div>
    </div>
    <div class="brush-status ${countToday >= 2 ? "status-brushed" : "status-not-brushed"}">
      <span class="status-dot"></span>
      ${countToday === 0 ? "Noch nicht geputzt" : `&#x2713; ${countToday}/2 geputzt`}
    </div>
    <div class="child-stat-row">
      <span>Aktueller Streak</span>
      <span>${streak} Tage &#x1F525;</span>
    </div>
    <div class="child-stat-row child-stat-pink">
      <span>Gesammelte Punkte</span>
      <span>&#x2B50; ${points}</span>
    </div>
    <div class="progress-section">
      <div class="progress-header">
        <span>Wochenfortschritt</span>
        <span>${weeklyProgress}/7</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${Math.min(100, (weeklyProgress / 7) * 100)}%"></div>
      </div>
    </div>
  `;
  return card;
}

function toggleDashboardAvatarPicker(childId, event) {
  event.stopPropagation();
  const picker = document.getElementById('dashAvatarPicker-' + childId);

  // Alle anderen Picker schliessen
  document.querySelectorAll('.avatar-picker').forEach((p) => {
    if (p !== picker) p.classList.add('hidden');
  });

  // Picker aufbauen beim ersten Öffnen
  if (!picker.children.length) {
    AVATARS.forEach((emoji) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'avatar-option' + (emoji === getAvatar(childId) ? ' avatar-option--active' : '');
      btn.textContent = emoji;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        setAvatar(childId, emoji);
        picker.parentElement.querySelector('.child-avatar').textContent = emoji;
        picker.querySelectorAll('.avatar-option').forEach((b) => {
          b.classList.toggle('avatar-option--active', b.textContent === emoji);
        });
        picker.classList.add('hidden');
      });
      picker.appendChild(btn);
    });
  }

  picker.classList.toggle('hidden');
}

function renderFamilyCalendar(familyDayMap, childCount) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  const year = today.getFullYear();
  const jan1 = new Date(year, 0, 1);
  const jan1Dow = jan1.getDay() === 0 ? 6 : jan1.getDay() - 1;
  const startDate = new Date(year, 0, 1 - jan1Dow);

  const dec31 = new Date(year, 11, 31);
  const daysDiff = Math.round((dec31 - startDate) / 86400000);
  const WEEKS = Math.ceil((daysDiff + 1) / 7);

  const grid = document.getElementById("familyCalendar");
  const monthBar = document.getElementById("calMonthLabels");
  grid.innerHTML = '';
  monthBar.innerHTML = '';

  const MONTHS = ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];
  let lastMonth = -1;
  const monthPositions = [];

  for (let w = 0; w < WEEKS; w++) {
    const weekStart = new Date(startDate);
    weekStart.setDate(startDate.getDate() + w * 7);
    if (weekStart.getMonth() !== lastMonth) {
      monthPositions.push({ week: w, label: MONTHS[weekStart.getMonth()] });
      lastMonth = weekStart.getMonth();
    }
    for (let d = 0; d < 7; d++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + d);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
      const isFuture = date > today;
      const status = familyDayMap[dateStr];

      const cell = document.createElement("div");
      cell.className = "cal-cell";
      cell.title = dateStr;

      if (dateStr === todayStr) {
        cell.classList.add("cal-cell--today");
      } else if (isFuture) {
        cell.classList.add("cal-cell--future");
      } else if (!status) {
        cell.classList.add("cal-cell--miss");
      } else if (childCount <= 1 ? status.full >= 1 : status.full >= childCount) {
        cell.classList.add("cal-cell--full");
      } else {
        cell.classList.add("cal-cell--partial");
      }
      grid.appendChild(cell);
    }
  }

  monthPositions.forEach(({ week, label }) => {
    const span = document.createElement("span");
    span.textContent = label;
    span.style.gridColumn = week + 1;
    monthBar.appendChild(span);
  });
}

async function loadDashboard() {
  try {
    const authRes = await fetch("api/protected.php", { credentials: "include" });
    if (authRes.status === 401) {
      window.location.href = "login.html";
      return;
    }

    const childRes = await fetch("api/children.php", { credentials: "include" });
    const childData = await childRes.json();
    const children = childData.children || [];

    if (children.length === 0) {
      document.getElementById("noChildSection").classList.remove("hidden");
    }

    const container = document.getElementById("childrenContainer");
    const familyDayMap = {};

    for (const child of children) {
      const sessRes = await fetch(`api/sessions.php?child_id=${child.id}`, {
        credentials: "include",
      });
      const sessData = await sessRes.json();
      const sessions = sessData.sessions || [];

      container.appendChild(renderChildCard(child, sessions));

      const dayCount = {};
      sessions.filter((s) => s.completed == 1).forEach((s) => {
        const day = getDateString(s.startTime);
        dayCount[day] = (dayCount[day] || 0) + 1;
      });
      Object.entries(dayCount).forEach(([day, count]) => {
        if (!familyDayMap[day]) familyDayMap[day] = { full: 0, partial: 0 };
        if (count >= 2) familyDayMap[day].full++;
        else familyDayMap[day].partial++;
      });
    }

    renderFamilyCalendar(familyDayMap, children.length);
  } catch (error) {
    console.error("Dashboard Fehler:", error);
    document.getElementById("childrenContainer").innerHTML =
      "<p style='color:red'>Fehler beim Laden: " + error.message + "</p>";
  }
}

function toggleAddChildForm() {
  document.getElementById("addChildForm").classList.toggle("hidden");
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("currentDate").textContent = formatDate(new Date());

  document.getElementById("addChildForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("childName").value.trim();
    const geburtstag = document.getElementById("childGeburtstag").value;
    const res = await fetch("api/children.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, geburtstag }),
    });
    const data = await res.json();
    if (data.status === "success") location.reload();
  });

  loadDashboard();
  loadFamilyCode();

  document.addEventListener('click', () => {
    document.querySelectorAll('.avatar-picker').forEach((p) => p.classList.add('hidden'));
  });
});

async function loadFamilyCode() {
  const res  = await fetch("api/family.php", { credentials: "include" });
  const data = await res.json();
  if (data.family_code) {
    document.getElementById("familyCodeDisplay").textContent = data.family_code;
  }
}

async function joinFamily() {
  const code = document.getElementById("joinCodeInput").value.trim().toUpperCase();
  const msg  = document.getElementById("familyMsg");
  if (!code) return;

  const res  = await fetch("api/family.php", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ family_code: code }),
  });
  const data = await res.json();

  msg.classList.remove("hidden", "login-success", "login-error");
  if (data.status === "success") {
    msg.textContent = "Familie erfolgreich beigetreten!";
    msg.classList.add("login-success");
    setTimeout(() => location.reload(), 1200);
  } else {
    msg.textContent = data.message;
    msg.classList.add("login-error");
  }
}

function toggleEditForm(childId) {
  document.getElementById(`editForm-${childId}`).classList.toggle("edit-form--open");
}

function closeEditForm(childId) {
  document.getElementById(`editForm-${childId}`).classList.remove("edit-form--open");
}

async function saveChild(childId) {
  const name = document.getElementById(`editName-${childId}`).value.trim();
  const geburtstag = document.getElementById(`editGeburtstag-${childId}`).value;

  const res = await fetch("api/children.php", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ child_id: childId, name, geburtstag }),
  });
  const data = await res.json();
  if (data.status === "success") {
    closeEditForm(childId);
    const nameEl = document.querySelector(`#editForm-${childId}`)
      ?.closest(".child-card")
      ?.querySelector(".child-info h2");
    if (nameEl) nameEl.textContent = name;
  }
}
