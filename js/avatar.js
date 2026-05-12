// avatar.js — shared avatar logic via localStorage (no DB needed)

const AVATARS = ['🦄', '🐉', '🦊', '🐸', '🐼', '🦁', '🐨', '🐯', '🐬', '🦋', '🐧', '🦩'];

function getAvatar(childId) {
  return localStorage.getItem('avatar_' + childId) || AVATARS[(childId - 1) % AVATARS.length];
}

function setAvatar(childId, emoji) {
  localStorage.setItem('avatar_' + childId, emoji);
}
