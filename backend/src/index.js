import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { createUser, findUserByEmail, upsertOtp, clearOtp } from './db.js';
import { sendOtpEmail } from './email.js';

dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

if (!process.env.JWT_SECRET) {
  console.warn('[WARN] JWT_SECRET not set — using insecure default. Set it in .env for production.');
}

// All allowed frontend origins
const ALLOWED_ORIGINS = [
  process.env.CLIENT_ORIGIN,
  'http://127.0.0.1:5500',  // Live Server default
  'http://localhost:5500',
  'http://127.0.0.1:8000',
  'http://localhost:8000',
].filter(Boolean);

const app = express();
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no origin (e.g. curl, Postman, mobile apps)
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);
app.use(express.json());

// Simple in-memory rate limiter: max 5 OTP requests per email per 10 minutes
const otpRateLimit = new Map(); // email -> { count, resetAt }

function checkOtpRateLimit(email) {
  const now = Date.now();
  const entry = otpRateLimit.get(email);
  if (!entry || entry.resetAt < now) {
    otpRateLimit.set(email, { count: 1, resetAt: now + 10 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count += 1;
  return true;
}

// ── Health ────────────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ── Request OTP ───────────────────────────────────────────────────────────────

app.post('/api/auth/request-otp', async (req, res) => {
  const email = req.body?.email ? String(req.body.email).trim().toLowerCase() : '';
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  // Rate limit check
  if (!checkOtpRateLimit(email)) {
    return res.status(429).json({ error: 'Too many OTP requests. Please wait 10 minutes.' });
  }

  try {
    createUser.run(email);
  } catch (error) {
    console.error('Failed to create user record', error);
    return res.status(500).json({ error: 'Failed to process request' });
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const otpExpires = Date.now() + 10 * 60 * 1000;
  upsertOtp.run(otp, otpExpires, email);

  try {
    const { previewUrl } = await sendOtpEmail(email, otp);

    // In dev (Ethereal fallback), log the preview URL so you can view the email
    if (previewUrl) {
      console.log(`[DEV] OTP email preview for ${email}: ${previewUrl}`);
    }

    return res.json({
      message: 'OTP sent',
      // Only expose previewUrl in non-production so devs can test easily
      ...(process.env.NODE_ENV !== 'production' && previewUrl ? { previewUrl } : {}),
    });
  } catch (error) {
    console.error('OTP email failure', error);
    return res.status(500).json({ error: 'Failed to send OTP email' });
  }
});

// ── Verify OTP ────────────────────────────────────────────────────────────────

app.post('/api/auth/verify-otp', (req, res) => {
  const email = req.body?.email ? String(req.body.email).trim().toLowerCase() : '';
  const otp   = req.body?.otp   ? String(req.body.otp).trim() : '';

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  const user = findUserByEmail.get(email);
  if (!user || !user.otp || !user.otp_expires) {
    return res.status(400).json({ error: 'Invalid email or OTP' });
  }

  if (Number(user.otp_expires) < Date.now()) {
    return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
  }

  if (user.otp !== otp) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }

  // Clear OTP after successful use so it can't be reused
  clearOtp.run(email);

  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1h' });
  return res.json({ token, message: 'OTP verified' });
});

// ── Auth middleware ───────────────────────────────────────────────────────────

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Authorization required' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ── Protected routes ──────────────────────────────────────────────────────────

app.get('/api/user/profile', requireAuth, (req, res) => {
  const user = findUserByEmail.get(req.user.email);
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({ email: user.email, active: Boolean(user.active) });
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Backend listening on http://127.0.0.1:${PORT}`);
  console.log(`Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
});