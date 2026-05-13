// sticker-collection.js

const MILESTONES = [7, 14, 21, 30, 40, 50, 60, 75, 90, 105, 120, 140, 160, 180, 200, 225, 250, 275, 300, 330, 360, 390, 420, 450];

const STICKERS = [
  { emoji: '⭐', name: 'Stern' },
  { emoji: '🌟', name: 'Funken' },
  { emoji: '🎉', name: 'Party' },
  { emoji: '🏆', name: 'Pokal' },
  { emoji: '🎯', name: 'Ziel' },
  { emoji: '🚀', name: 'Rakete' },
  { emoji: '🌈', name: 'Regenbogen' },
  { emoji: '🦋', name: 'Schmetterling' },
  { emoji: '🌺', name: 'Blume' },
  { emoji: '🎸', name: 'Gitarre' },
  { emoji: '🌍', name: 'Globus' },
  { emoji: '🎨', name: 'Kunst' },
  { emoji: '🦁', name: 'Löwe' },
  { emoji: '🐉', name: 'Drache' },
  { emoji: '🎭', name: 'Drama' },
  { emoji: '🌊', name: 'Welle' },
  { emoji: '❄️', name: 'Eis' },
  { emoji: '🎪', name: 'Zirkus' },
  { emoji: '🦅', name: 'Adler' },
  { emoji: '🌅', name: 'Sonnenaufgang' },
  { emoji: '🎠', name: 'Magie' },
  { emoji: '💎', name: 'Diamant' },
  { emoji: '🦄', name: 'Einhorn' },
  { emoji: '👑', name: 'Krone' },
];

function getChildId() {
  return new URLSearchParams(window.location.search).get('id');
}

function getDateString(datetime) {
  return (datetime || '').split('T')[0].split(' ')[0];
}

async function loadStickerCollection() {
  const childId = getChildId();

  if (!childId) {
    window.location.href = 'protected.html';
    return;
  }

  document.getElementById('backLink').href = `child-profile.html?id=${childId}`;

  const [authRes, sessRes] = await Promise.all([
    fetch('api/protected.php', { credentials: 'include' }),
    fetch(`api/sessions.php?child_id=${childId}`, { credentials: 'include' }),
  ]);

  if (authRes.status === 401) {
    window.location.href = 'login.html';
    return;
  }

  const sessData = await sessRes.json();
  const sessions = sessData.sessions || [];

  const dayCount = {};
  sessions.filter((s) => s.completed == 1).forEach((s) => {
    const day = (s.startTime || '').split('T')[0].split(' ')[0];
    dayCount[day] = (dayCount[day] || 0) + 1;
  });
  const points = Object.values(dayCount).filter((c) => c >= 2).length;
  const collected = MILESTONES.filter((m) => points >= m).length;
  const nextMilestone = collected < MILESTONES.length ? MILESTONES[collected] : null;

  const prevMilestone = collected > 0 ? MILESTONES[collected - 1] : 0;
  const progressPercent = nextMilestone
    ? Math.min(100, ((points - prevMilestone) / (nextMilestone - prevMilestone)) * 100)
    : 100;

  document.getElementById('stickerCounter').textContent = `${points} Punkte · ${collected} / 24 Sticker`;
  document.getElementById('nextStickerHint').textContent = nextMilestone
    ? `Noch ${nextMilestone - points} Punkte bis zum nächsten Sticker`
    : 'Alle Sticker freigeschaltet!';
  document.getElementById('nextStickerFill').style.width = progressPercent + '%';

  const grid = document.getElementById('stickerGrid');
  STICKERS.forEach((sticker, i) => {
    const unlocked = i < collected;
    const level = i + 2;
    const tile = document.createElement('div');
    tile.className = unlocked ? 'sticker-tile sticker-tile--unlocked' : 'sticker-tile sticker-tile--locked';
    if (unlocked) {
      tile.innerHTML = `
        <span class="sticker-level-badge sticker-level-badge--unlocked">Lvl. ${level}</span>
        <span class="sticker-emoji">${sticker.emoji}</span>
        <span class="sticker-name">${sticker.name}</span>
      `;
    } else {
      tile.innerHTML = `
        <span class="sticker-level-badge">Lvl. ${level}</span>
        <svg class="sticker-lock" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <span class="sticker-name">ab ${MILESTONES[i]} Pkt.</span>
      `;
    }
    grid.appendChild(tile);
  });
}

document.addEventListener('DOMContentLoaded', loadStickerCollection);
