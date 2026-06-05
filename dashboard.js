const API_BASE = 'http://127.0.0.1:3000/api';
const statusText = document.getElementById('dashboardStatus');
const profileSection = document.getElementById('profileDetails');
const profileEmail = document.getElementById('dashboardEmail');
const profileActive = document.getElementById('dashboardActive');
const logoutButton = document.getElementById('logoutButton');

function updateStatus(message, isError = false) {
  if (!statusText) return;
  statusText.textContent = message;
  statusText.style.color = isError ? '#ffb3b3' : '#ecf2ff';
}

function signOut() {
  localStorage.removeItem('barcodeAuthToken');
  window.location.href = 'login.html';
}

async function loadProfile() {
  const token = localStorage.getItem('barcodeAuthToken');
  if (!token) {
    updateStatus('No active session. Redirecting to login…', true);
    setTimeout(signOut, 1000);
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/user/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await response.json();

    if (!response.ok) {
      updateStatus(result.error || 'Session invalid. Redirecting…', true);
      setTimeout(signOut, 1200);
      return;
    }

    profileSection.style.display = 'block';
    profileEmail.textContent = result.email || 'Unknown';
    profileActive.textContent = result.active ? 'Yes' : 'No';
    updateStatus('You are signed in and your session is valid.');
  } catch (error) {
    updateStatus('Unable to load profile. Redirecting to login…', true);
    setTimeout(signOut, 1200);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  logoutButton?.addEventListener('click', signOut);
  loadProfile();
});
