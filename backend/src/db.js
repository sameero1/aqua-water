import Database from 'better-sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, '..', 'data.sqlite');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS auth_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  otp TEXT,
  otp_expires INTEGER,
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);
`);

const createUser = db.prepare(
  'INSERT OR IGNORE INTO auth_users (email, active) VALUES (?, 1)'
);
const upsertOtp = db.prepare(
  'UPDATE auth_users SET otp = ?, otp_expires = ?, active = 1 WHERE email = ?'
);
const findUserByEmail = db.prepare('SELECT * FROM auth_users WHERE email = ?');
const activateUser = db.prepare('UPDATE auth_users SET active = 1 WHERE email = ?');

const clearOtp = db.prepare('UPDATE auth_users SET otp = NULL, otp_expires = NULL WHERE email = ?');

export { createUser, upsertOtp, findUserByEmail, activateUser, clearOtp };
