// nav.js — shared nav bar logic (profile dropdown + logout)

function toggleProfile() {
  document.getElementById('navProfileForm').classList.toggle('hidden');
}

async function loadNavProfile() {
  const res = await fetch('api/profile.php', { credentials: 'include' });
  const data = await res.json();
  if (data.status === 'success') {
    const u = data.user;
    document.getElementById('navProfileName').textContent = u.vorname + ' ' + u.name;
    document.getElementById('navProfileVorname').value = u.vorname;
    document.getElementById('navProfileName2').value = u.name;
    document.getElementById('navProfileEmail').value = u.email;
  }
}

async function saveNavProfile() {
  const vorname  = document.getElementById('navProfileVorname').value.trim();
  const name     = document.getElementById('navProfileName2').value.trim();
  const email    = document.getElementById('navProfileEmail').value.trim();
  const password = document.getElementById('navProfilePassword').value;
  const msg      = document.getElementById('navProfileMsg');

  const res = await fetch('api/profile.php', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ vorname, name, email, password }),
  });
  const data = await res.json();

  msg.classList.remove('hidden', 'login-success', 'login-error');
  if (data.status === 'success') {
    msg.textContent = 'Gespeichert!';
    msg.classList.add('login-success');
    document.getElementById('navProfileName').textContent = vorname + ' ' + name;
    setTimeout(() => toggleProfile(), 1000);
  } else {
    msg.textContent = data.message;
    msg.classList.add('login-error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadNavProfile();

  document.getElementById('navLogoutBtn').addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('api/logout.php', { method: 'GET', credentials: 'include' });
      const result = await res.json();
      if (result.status === 'success') {
        window.location.href = 'login.html';
      } else {
        alert('Logout fehlgeschlagen. Bitte erneut versuchen.');
      }
    } catch {
      alert('Fehler beim Logout!');
    }
  });

  document.addEventListener('click', (e) => {
    const wrapper = document.querySelector('.nav-profile-wrapper');
    if (wrapper && !wrapper.contains(e.target)) {
      document.getElementById('navProfileForm').classList.add('hidden');
    }
  });
});
