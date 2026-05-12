// protected.js — Dashboard

const STICKER_MILESTONES = [7, 14, 30];

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

function brushedToday(sessions) {
  const today = new Date().toISOString().split("T")[0];
  return sessions.some((s) => s.completed == 1 && s.startTime.startsWith(today));
}

function calculateStreak(sessions) {
  const completedDays = [
    ...new Set(
      sessions
        .filter((s) => s.completed == 1)
        .map((s) => getDateString(s.startTime))
    ),
  ]
    .sort()
    .reverse();

  if (completedDays.length === 0) return 0;

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  if (completedDays[0] !== today && completedDays[0] !== yesterday) return 0;

  let streak = 0;
  const checkDate = new Date(completedDays[0]);

  for (const day of completedDays) {
    const expected = checkDate.toISOString().split("T")[0];
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
  sessions
    .filter((s) => s.completed == 1)
    .forEach((s) => {
      const day = getDateString(s.startTime);
      dayCount[day] = (dayCount[day] || 0) + 1;
    });
  return Object.values(dayCount).filter((count) => count >= 2).length;
}

function calculateWeeklyProgress(sessions) {
  const weekAgo = new Date(Date.now() - 6 * 86400000);
  return sessions.filter((s) => s.completed == 1 && new Date(s.startTime) >= weekAgo).length;
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

function calculateStickers(streak) {
  return STICKER_MILESTONES.filter((m) => streak >= m).length;
}

function renderChildCard(child, sessions) {
  const age = calculateAge(child.geburtstag);
  const streak = calculateStreak(sessions);
  const stickers = calculateStickers(streak);
  const weeklyProgress = calculateWeeklyProgress(sessions);
  const isBrushedToday = brushedToday(sessions);

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
    <div class="brush-status ${isBrushedToday ? "status-brushed" : "status-not-brushed"}">
      <span class="status-dot"></span>
      ${isBrushedToday ? "&#x2713; Heute geputzt" : "Noch nicht geputzt"}
    </div>
    <div class="child-stat-row">
      <span>Current Streak</span>
      <span>${streak} Tage &#x1F525;</span>
    </div>
    <div class="child-stat-row child-stat-pink">
      <span>Stickers Earned</span>
      <span>&#x2728; ${stickers}</span>
    </div>
    <div class="progress-section">
      <div class="progress-header">
        <span>Weekly Progress</span>
        <span>${weeklyProgress}/14</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${Math.min(100, (weeklyProgress / 14) * 100)}%"></div>
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
      return;
    }

    const container = document.getElementById("childrenContainer");
    let totalStreak = 0;
    let totalBrushedToday = 0;
    let totalStickers = 0;
    let totalWeekly = 0;

    for (const child of children) {
      const sessRes = await fetch(`api/sessions.php?child_id=${child.id}`, {
        credentials: "include",
      });
      const sessData = await sessRes.json();
      const sessions = sessData.sessions || [];

      container.appendChild(renderChildCard(child, sessions));

      const streak = calculateStreak(sessions);
      totalStreak += streak;
      if (brushedToday(sessions)) totalBrushedToday++;
      totalStickers += calculateStickers(streak);
      totalWeekly += calculateWeeklyProgress(sessions);
    }

    document.getElementById("totalStreakDays").textContent = totalStreak;
    document.getElementById("brushedTodayCount").textContent = totalBrushedToday;
    document.getElementById("totalStickers").textContent = totalStickers;
    const avgPercent =
      children.length > 0
        ? Math.round((totalWeekly / (children.length * 14)) * 100)
        : 0;
    document.getElementById("weeklyAverage").textContent = avgPercent + "%";
  } catch (error) {
    console.error("Dashboard Fehler:", error);
    document.getElementById("childrenContainer").innerHTML =
      "<p style='color:red'>Fehler beim Laden: " + error.message + "</p>";
  }
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

  msg.classList.remove("hidden");
  if (data.status === "success") {
    msg.textContent = "Familie erfolgreich beigetreten!";
    msg.style.color = "#166534";
    setTimeout(() => location.reload(), 1200);
  } else {
    msg.textContent = data.message;
    msg.style.color = "#b91c1c";
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
