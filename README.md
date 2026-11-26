# InventoryEasePro v2

A rebuilt version of the MERN inventory app, moved to modern Node.js and JavaScript,
with a redesigned interface.

| Layer    | v1 (original)                    | v2 (this version)                                  |
|----------|----------------------------------|----------------------------------------------------|
| Runtime  | Node (CommonJS), Express 4       | Node 20+, ES modules, Express 5                    |
| Security | Basic JWT cookie                 | Helmet, rate-limited auth, hashed single-use tokens, cookie hardening |
| Frontend | Create React App, SCSS, Quill    | Vite, React 18, Redux Toolkit, CSS design system   |
| UI       | Light, template-style            | Dark aurora theme, glass surfaces, responsive shell |
| Uploads  | Disk + direct browser upload     | Memory → Cloudinary via backend, 5MB limit         |

API paths are unchanged (`/api/users/*`, `/api/products/*`, `/api/contactus`), so the
endpoints behave the same way for existing clients.

## Project layout

```
backend/   Express 5 API (src/controllers, routes, models, middleware, utils)
frontend/  Vite React app (src/pages, components, store, styles)
```

## Quick start

Requirements: Node.js 20 or newer, and a MongoDB instance (local or Atlas).

```bash
# 1. API
cd backend
cp .env.example .env        # fill in MONGO_URI, JWT_SECRET, Cloudinary and Gmail values
npm install
npm run dev                 # http://localhost:5000

# 2. Web app (new terminal)
cd frontend
npm install
npm run dev                 # http://localhost:5173  (proxies /api to port 5000)
```

## Email

The API picks its mail transport from the environment:

- **Generic SMTP** (SendGrid, Mailgun, SES, Mailtrap, …): set `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`.
- **Gmail OAuth2** (when `SMTP_HOST` is empty): set `EMAIL_USER`, `CLIENT_ID`, `CLIENT_SECRET`, `REFRESH_TOKEN`.

`EMAIL_FROM` sets the sender shown to recipients. `CONTACT_EMAIL` sets where contact-form messages go.
The transport is checked at startup and logs a warning if it can't connect, but the API keeps running.
Failed sends return a clean `502` with a retry message. They never expose provider errors to the client.

## Testing

Start the API with MongoDB and a mail sink, then run the end-to-end suite:

```bash
npm run mail:sink                 # local SMTP receiver on port 2525, writes /tmp/inbox.json
SMTP_HOST=127.0.0.1 SMTP_PORT=2525 ... npm start   # API on port 5055 for the test
npm run test:api                  # 51 checks: auth, verification, products, isolation, reset, contact
```

`test/ui.e2e.py` runs the browser flow (Playwright) against the Vite app.

## Environment variables

Backend (`backend/.env`):

| Variable        | Purpose                                             |
|-----------------|-----------------------------------------------------|
| `MONGO_URI`     | MongoDB connection string (required)                |
| `JWT_SECRET`    | Secret for session tokens (required, use a long random value) |
| `FRONTEND_URL`  | Allowed origin for CORS and links in emails         |
| `CLOUDINARY_URL`| `cloudinary://key:secret@cloud_name`                |
| `SMTP_HOST` (+ `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`) | Generic SMTP transport |
| `EMAIL_USER`, `CLIENT_ID`, `CLIENT_SECRET`, `REFRESH_TOKEN` | Gmail OAuth2 transport (when `SMTP_HOST` is empty) |
| `EMAIL_FROM`, `CONTACT_EMAIL` | Sender address and contact-form recipient |
| `NODE_ENV`      | Set to `production` to enable secure, cross-site cookies |

Frontend (`frontend/.env`): leave `VITE_API_URL` empty in development. Set it to your API
origin only when the API is hosted on a different domain.

## Production notes

- Set `NODE_ENV=production` and serve both apps over HTTPS. Cookies use `SameSite=None; Secure`.
- Put the API and frontend on the same site (for example `app.example.com` and `api.example.com`).
- Rotate `JWT_SECRET` and the Gmail OAuth credentials if they were ever committed.

## Migrating existing data from v1

- `quantity` and `price` are now numbers. Existing numeric strings are converted on save.
- Product images moved from `image.filePath` to `image.url`. Re-upload older images, or run a one-time
  migration that copies `filePath` into `url`.
- Profile photos are uploaded through the API now, so the hard-coded client-side Cloudinary preset is gone.
- Product descriptions are plain text. The rich-text editor (Quill) was removed to cut the bundle size.
  Existing HTML descriptions will display as raw text.

## Bug fixes carried over from v1

- Reset-password no longer crashes when the user record is missing.
- Confirm-email no longer sends two responses for an already-verified account.
- Forgot-password returns the same message whether or not the email is registered.
- Expired verification and reset tokens are removed automatically by a MongoDB TTL index.
- Failed verification emails roll back the new account, so the person can retry.
- Products are always looked up by owner, so one user cannot read another user's products.
