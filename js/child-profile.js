// child-profile.js

const MILESTONES = [7, 14, 21, 30, 40, 50, 60, 75, 90, 105, 120, 140, 160, 180, 200, 225, 250, 275, 300, 330, 360, 390, 420, 450];

const ACTIVITY_ICONS = ['⭐', '🌟', '✨', '🌠', '💫'];

function getChildId() {
  return new URLSearchParams(window.location.search).get('id');
}

function getDateString(datetime) {
  return (datetime || '').split('T')[0].split(' ')[0];
}

function formatActivityDate(dateStr) {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (dateStr === today) return 'Heute';
  if (dateStr === yesterday) return 'Gestern';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('de-CH', { month: 'short', day: 'numeric' });
}

function formatTime(datetime) {
  const d = new Date(datetime);
  return d.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' });
}

function calculateStreak(sessions) {
  const completedDays = [
    ...new Set(
      sessions
        .filter((s) => s.completed == 1)
        .map((s) => getDateString(s.startTime))
    ),
  ].sort().reverse();

  if (completedDays.length === 0) return 0;

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (completedDays[0] !== today && completedDays[0] !== yesterday) return 0;

  let streak = 0;
  const checkDate = new Date(completedDays[0]);
  for (const day of completedDays) {
    if (day === checkDate.toISOString().split('T')[0]) {
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

function getLevelInfo(points) {
  const stickers = MILESTONES.filter((m) => points >= m).length;
  const level = stickers + 1;
  const prevMilestone = stickers > 0 ? MILESTONES[stickers - 1] : 0;
  const nextMilestone = stickers < MILESTONES.length ? MILESTONES[stickers] : null;
  const progressPercent = nextMilestone
    ? Math.min(100, ((points - prevMilestone) / (nextMilestone - prevMilestone)) * 100)
    : 100;
  return { stickers, level, nextMilestone, progressPercent };
}

let currentChildId = null;

async function loadChildProfile() {
  const childId = getChildId();
  if (!childId) {
    window.location.href = 'protected.html';
    return;
  }
  currentChildId = parseInt(childId);

  const authRes = await fetch('api/protected.php', { credentials: 'include' });
  if (authRes.status === 401) {
    window.location.href = 'login.html';
    return;
  }

  const childRes = await fetch('api/children.php', { credentials: 'include' });
  const childData = await childRes.json();
  const child = (childData.children || []).find((c) => c.id == childId);
  if (!child) {
    window.location.href = 'protected.html';
    return;
  }

  const sessRes = await fetch(`api/sessions.php?child_id=${childId}`, { credentials: 'include' });
  const sessData = await sessRes.json();
  const sessions = sessData.sessions || [];

  const points = calculatePoints(sessions);
  const streak = calculateStreak(sessions);
  const { stickers, level, nextMilestone, progressPercent } = getLevelInfo(points);

  const avatar = getAvatar(child.id);
  document.getElementById('profileAvatar').textContent = avatar;
  document.getElementById('profileChildName').textContent = child.name;
  document.getElementById('profileLevel').textContent = `Level ${level} / ${MILESTONES.length + 1}`;
  document.getElementById('profileStreakBadge').textContent = `🏆 ${streak} Tage Streak`;
  document.getElementById('profileProgressLabel').textContent =
    nextMilestone ? `Fortschritt zu Level ${level + 1}` : 'Maximales Level erreicht!';
  document.getElementById('profileProgressCount').textContent =
    nextMilestone ? `${points} / ${nextMilestone} Punkte` : `${points} Punkte`;
  document.getElementById('profileProgressFill').style.width = progressPercent + '%';
  document.getElementById('statPoints').textContent = points;
  document.getElementById('statStreak').textContent = `${streak} Tage`;
  document.getElementById('viewStickersLink').href = `sticker-collection.html?id=${childId}`;
  document.getElementById('viewStickersLink').textContent = `Alle ${MILESTONES.length + 1} Level ansehen →`;

  const completedSessions = sessions.filter((s) => s.completed == 1);
  const activityList = document.getElementById('activityList');

  if (completedSessions.length === 0) {
    activityList.innerHTML = '<p class="activity-empty">Noch keine Aktivitäten vorhanden.</p>';
    return;
  }

  const PAGE_SIZE = 5;
  let shown = 0;

  function renderActivities() {
    const batch = completedSessions.slice(shown, shown + PAGE_SIZE);
    batch.forEach((s, i) => {
      const dateStr = getDateString(s.startTime);
      const item = document.createElement('div');
      item.className = 'activity-item';
      item.innerHTML = `
        <div class="activity-icon-wrap">${ACTIVITY_ICONS[(shown + i) % ACTIVITY_ICONS.length]}</div>
        <div class="activity-info">
          <p class="activity-date">${formatActivityDate(dateStr)}</p>
          <p class="activity-time">${formatTime(s.startTime)}</p>
        </div>
        <span class="activity-badge">Geputzt</span>
      `;
      activityList.appendChild(item);
    });
    shown += batch.length;

    const btn = document.getElementById('loadMoreBtn');
    if (shown >= completedSessions.length) {
      if (btn) btn.remove();
    } else {
      if (!btn) {
        const more = document.createElement('button');
        more.id = 'loadMoreBtn';
        more.className = 'load-more-btn';
        more.textContent = `Mehr anzeigen (${completedSessions.length - shown} weitere)`;
        more.addEventListener('click', renderActivities);
        activityList.after(more);
      } else {
        btn.textContent = `Mehr anzeigen (${completedSessions.length - shown} weitere)`;
      }
    }
  }

  renderActivities();
}

document.addEventListener('DOMContentLoaded', loadChildProfile);
