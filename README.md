# Barcode Payment App

This workspace contains a local frontend and a backend API for OTP-based login.

## Files

- `index.html` — animated landing page with links to Login and Register
- `login.html` — dedicated login page with OTP request and verification
- `register.html` — dedicated registration page with OTP request and verification
- `styles.css` — shared animated theme and page styling
- `auth.js` — shared login/register OTP logic
- `backend/package.json` — backend dependencies and scripts
- `backend/src/index.js` — Express API server
- `backend/src/db.js` — SQLite auth database
- `backend/src/email.js` — Nodemailer OTP email / Ethereal preview support
- `backend/.env.sample` — optional SMTP and JWT configuration

## Run locally

### 1. Start the backend

Open a terminal in `backend` and run:

```powershell
cd backend
npm install
npm run dev
```

This starts the API at `http://127.0.0.1:3000`.

If port `3000` is already in use, set a different port:

```powershell
$env:PORT=3001
npm run dev
```

### 2. Serve the frontend

Open a terminal in the app root and run:

```powershell
cd .
python -m http.server 8000
```

Then open one of these pages:

```text
http://127.0.0.1:8000/index.html
http://127.0.0.1:8000/login.html
http://127.0.0.1:8000/register.html
```

### 3. Test the OTP flow

- Enter an email
- Click **Request OTP**
- If SMTP is not configured, the API returns an Ethereal preview URL
- Open the preview URL to view the OTP
- Enter the OTP and click **Verify OTP**

## Optional SMTP configuration

Copy `backend/.env.sample` to `backend/.env` and fill in real SMTP credentials if you want actual email delivery.

## Notes

- The frontend must be served from the app folder so the browser can load `index.html` directly.
- The backend supports CORS from `http://127.0.0.1:8000` and `http://localhost:8000`.
