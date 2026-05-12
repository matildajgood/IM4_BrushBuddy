// sticker-collection.js

const STICKERS = [
  { emoji: '⭐', name: 'Star' },
  { emoji: '🌟', name: 'Sparkle' },
  { emoji: '🎉', name: 'Party' },
  { emoji: '🏆', name: 'Trophy' },
  { emoji: '🎯', name: 'Target' },
  { emoji: '🚀', name: 'Rocket' },
  { emoji: '🌈', name: 'Rainbow' },
  { emoji: '🦋', name: 'Butterfly' },
  { emoji: '🌺', name: 'Flower' },
  { emoji: '🎸', name: 'Guitar' },
  { emoji: '🌍', name: 'Globe' },
  { emoji: '🎨', name: 'Art' },
  { emoji: '🦁', name: 'Lion' },
  { emoji: '🐉', name: 'Dragon' },
  { emoji: '🎭', name: 'Drama' },
  { emoji: '🌊', name: 'Wave' },
  { emoji: '❄️', name: 'Ice' },
  { emoji: '🎪', name: 'Circus' },
  { emoji: '🦅', name: 'Eagle' },
  { emoji: '🌅', name: 'Sunrise' },
  { emoji: '🎠', name: 'Magic' },
  { emoji: '💎', name: 'Diamond' },
  { emoji: '🦄', name: 'Unicorn' },
  { emoji: '👑', name: 'Crown' },
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

  const collected = Math.min(24, sessions.filter((s) => s.completed == 1).length);

  document.getElementById('stickerCounter').textContent = `Collected: ${collected} / 24`;

  const grid = document.getElementById('stickerGrid');
  STICKERS.forEach((sticker, i) => {
    const unlocked = i < collected;
    const tile = document.createElement('div');
    tile.className = unlocked ? 'sticker-tile sticker-tile--unlocked' : 'sticker-tile sticker-tile--locked';
    if (unlocked) {
      tile.innerHTML = `
        <span class="sticker-emoji">${sticker.emoji}</span>
        <span class="sticker-name">${sticker.name}</span>
      `;
    } else {
      tile.innerHTML = `
        <svg class="sticker-lock" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <span class="sticker-name">Locked</span>
      `;
    }
    grid.appendChild(tile);
  });
}

document.addEventListener('DOMContentLoaded', loadStickerCollection);
