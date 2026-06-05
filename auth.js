const API_BASE = 'http://127.0.0.1:3000/api';
const mode = document.body.dataset.authMode || 'login';

const pageActionLabel = mode === 'register' ? 'Create account' : 'Sign in';
const pageSubtext = mode === 'register'
  ? 'Enter your email to begin registration, then verify with the OTP sent to your inbox.'
  : 'Enter the email for your account and verify the OTP to sign in instantly.';

// ── DOM refs ──────────────────────────────────────────────────────────────────
const titleText      = document.querySelector('.form-title');
const descText       = document.querySelector('.form-description');
const badgeText      = document.querySelector('.page-badge, .hero-badge');
const requestButton  = document.getElementById('requestOtp');
const verifyButton   = document.getElementById('verifyOtp');
const emailInput     = document.getElementById('email');
const otpInput       = document.getElementById('otp');
const statusText     = document.getElementById('statusText');
const previewSection = document.getElementById('previewSection');
const previewLink    = document.getElementById('previewLink');
const profileCard    = document.getElementById('profileCard');
const profileEmail   = document.getElementById('profileEmail');
const profileStatus  = document.getElementById('profileStatus');
const backLink       = document.getElementById('backLink');

// ── Init ──────────────────────────────────────────────────────────────────────
if (titleText)   titleText.textContent  = pageActionLabel;
if (descText)    descText.textContent   = pageSubtext;
if (badgeText)   badgeText.textContent  = mode === 'register' ? 'Register new account' : 'Login securely';
if (backLink)    backLink.href          = 'Index.html';

// ── Helpers ───────────────────────────────────────────────────────────────────
function setLoading(isLoading) {
  requestButton.disabled = isLoading;
  verifyButton.disabled  = isLoading;
  emailInput.disabled    = isLoading;
  requestButton.textContent = isLoading ? 'Please wait…' : (requestButton.dataset.label || 'Send OTP');
}

function showStatus(message, type = 'info') {
  if (!statusText) return;
  statusText.textContent = message;
  statusText.className   = `status-text ${type}`;
}

function showPreview(url) {
  if (!previewSection || !previewLink) return;
  previewSection.classList.remove('hidden');
  previewLink.href        = url;
  previewLink.textContent = url;
}

function displayProfile(profile) {
  if (!profileCard || !profileEmail || !profileStatus) return;
  profileCard.classList.remove('hidden');
  profileEmail.textContent   = profile.email  || 'Unknown';
  profileStatus.textContent  = profile.active ? 'Active user' : 'Inactive user';
}

// ── Request OTP ───────────────────────────────────────────────────────────────
async function requestOtp() {
  const email = emailInput.value.trim().toLowerCase();
  if (!email) {
    showStatus('Please enter a valid email address.', 'error');
    emailInput.focus();
    return;
  }

  setLoading(true);
  showStatus('Sending your one-time code…');
  if (previewSection) previewSection.classList.add('hidden');

  try {
    const response = await fetch(`${API_BASE}/auth/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Unable to send OTP');

    showStatus('OTP sent! Check your inbox (or the preview link below).', 'success');

    if (result.previewUrl) showPreview(result.previewUrl);

    // Auto-focus OTP field so user can type immediately
    otpInput?.focus();

  } catch (error) {
    showStatus(error.message || 'Failed to request OTP.', 'error');
  } finally {
    setLoading(false);
  }
}

// ── Verify OTP ────────────────────────────────────────────────────────────────
async function verifyOtp() {
  const email = emailInput.value.trim().toLowerCase();
  const otp   = otpInput.value.trim();

  if (!email || !otp) {
    showStatus('Email and OTP are required to verify.', 'error');
    return;
  }

  setLoading(true);
  showStatus('Verifying your code…');

  try {
    const response = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Verification failed');
    if (!result.token) throw new Error('OTP verified but no session token was returned.');

    // Store token
    localStorage.setItem('AUTH_TOKEN', result.token);

    showStatus('Verified successfully. Redirecting to your dashboard...', 'success');
    displayProfile({ email, active: true });

    setTimeout(() => {
      window.location.assign('dashboard.html');
    }, 800);

  } catch (error) {
    console.error('OTP verify error:', error);
    showStatus(error.message || 'OTP verification failed.', 'error');
  } finally {
    setLoading(false);
  }
}

// ── Event listeners ───────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  requestButton?.addEventListener('click', requestOtp);
  verifyButton?.addEventListener('click', verifyOtp);

  // Enter on email field → request OTP
  emailInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') requestOtp();
  });

  // Enter on OTP field → verify
  otpInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') verifyOtp();
  });
});