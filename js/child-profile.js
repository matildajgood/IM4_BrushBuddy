// child-profile.js

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
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
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

function getLevelInfo(stickers) {
  const stickersPerLevel = 5;
  const level = Math.floor(stickers / stickersPerLevel) + 1;
  const stickersForCurrentLevel = (level - 1) * stickersPerLevel;
  const stickersForNextLevel = level * stickersPerLevel;
  return { level, stickersForCurrentLevel, stickersForNextLevel };
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

  const stickers = sessions.filter((s) => s.completed == 1).length;
  const streak = calculateStreak(sessions);
  const { level, stickersForCurrentLevel, stickersForNextLevel } = getLevelInfo(stickers);
  const progress = stickers - stickersForCurrentLevel;
  const needed = stickersForNextLevel - stickersForCurrentLevel;
  const progressPercent = Math.min(100, (progress / needed) * 100);

  const avatar = getAvatar(child.id);
  document.getElementById('profileAvatar').textContent = avatar;
  document.getElementById('profileChildName').textContent = child.name;
  document.getElementById('profileLevel').textContent = `Level ${level}`;
  document.getElementById('profileStreakBadge').textContent = `🏆 ${streak} day streak`;
  document.getElementById('profileProgressLabel').textContent = `Progress to Level ${level + 1}`;
  document.getElementById('profileProgressCount').textContent = `${stickers} / ${stickersForNextLevel} stickers`;
  document.getElementById('profileProgressFill').style.width = progressPercent + '%';
  document.getElementById('statStickers').textContent = stickers;
  document.getElementById('statStreak').textContent = `${streak} days`;
  document.getElementById('viewStickersLink').href = `sticker-collection.html?id=${childId}`;

  const completedSessions = sessions.filter((s) => s.completed == 1).slice(0, 10);
  const activityList = document.getElementById('activityList');

  if (completedSessions.length === 0) {
    activityList.innerHTML = '<p class="activity-empty">Noch keine Aktivitäten vorhanden.</p>';
    return;
  }

  completedSessions.forEach((s, i) => {
    const dateStr = getDateString(s.startTime);
    const item = document.createElement('div');
    item.className = 'activity-item';
    item.innerHTML = `
      <div class="activity-icon-wrap">${ACTIVITY_ICONS[i % ACTIVITY_ICONS.length]}</div>
      <div class="activity-info">
        <p class="activity-date">${formatActivityDate(dateStr)}</p>
        <p class="activity-time">${formatTime(s.startTime)}</p>
      </div>
      <span class="activity-badge">Brushed</span>
    `;
    activityList.appendChild(item);
  });
}

document.addEventListener('DOMContentLoaded', loadChildProfile);
