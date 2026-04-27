# Hoam — Home Loan Lead Capture

A landing page + lead-capture API ready to deploy on **Railway**, with an admin dashboard, CSV export, and optional Google Sheets sync. Designed to run Facebook/Instagram ad campaigns against — captures UTM parameters and `fbclid` automatically and exposes a Meta-Pixel hook on the form-success event.

---

## What you get

- `/` — the public landing page (mobile-first; the design you previewed in `Home Loan Template.html`)
- `/admin.html` — password-protected admin dashboard (search, stats, CSV download)
- `POST /api/leads` — public endpoint the form submits to (rate-limited)
- PostgreSQL database (Railway plugin) — every lead stored
- Optional Google Sheets append (every lead is also written to a sheet you own)

---

## 1. Deploy to Railway (first time)

### a. Push this folder to GitHub

```bash
cd <this folder>
git init
git add .
git commit -m "Initial commit"
gh repo create hoam-loan-leads --private --source=. --remote=origin --push
# or: create the repo manually on github.com and `git push`
```

### b. Create a Railway project

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** → select your repo.
2. In the same project, click **+ New** → **Database** → **Add PostgreSQL**. Railway will auto-inject `DATABASE_URL` into your service.
3. Open your service → **Variables** → add:
   - `ADMIN_USER` — pick any username
   - `ADMIN_PASS` — pick a strong password
   - `SESSION_SECRET` — paste any 32+ char random string (e.g. from `openssl rand -base64 32`)
   - `NODE_ENV` = `production`
4. Open the service → **Settings** → **Networking** → click **Generate Domain**. You'll get a URL like `hoam-loan-leads-production.up.railway.app`.

The schema is auto-applied on first start, so you don't need to run any migration manually.

That's it — visit the URL and you'll see the landing page. The admin is at `/admin.html`.

---

## 2. Optional: Google Sheets sync

If you want each lead to also appear in a Google Sheet:

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → create or pick a project.
2. **APIs & Services** → enable **Google Sheets API**.
3. **Credentials** → **Create Credentials** → **Service Account**. Give it any name. Skip the optional steps.
4. Open the service account → **Keys** → **Add Key** → **JSON**. A `.json` file downloads.
5. Create a new Google Sheet. Note the ID from its URL: `docs.google.com/spreadsheets/d/<THIS_PART>/edit`.
6. Click **Share** in your sheet → paste the service account's email (from the JSON, field `client_email`) → give **Editor** access.
7. Back in Railway → service **Variables**, add:
   - `GOOGLE_SHEET_ID` — the sheet ID from step 5
   - `GOOGLE_SHEET_TAB` — `Leads` (or whatever you named the tab)
   - `GOOGLE_SERVICE_ACCOUNT_JSON` — paste the **entire** JSON file content as a single value. Railway accepts multi-line; if it doesn't, replace newlines in `private_key` with `\n`.

Redeploy — every new lead will append a row.

---

## 3. Running locally

```bash
cp .env.example .env
# fill in DATABASE_URL (a local Postgres or a Railway-shared DB), ADMIN_USER, ADMIN_PASS, SESSION_SECRET
npm install
npm run init-db   # creates the leads table
npm start         # http://localhost:3000
```

---

## 4. Running Facebook / Instagram ads against this

When you're ready to run ads:

1. **Create a Meta Pixel** in [Meta Events Manager](https://business.facebook.com/events_manager). You'll get a pixel ID.
2. Add the pixel snippet just before `</head>` in `public/index.html`:

   ```html
   <!-- Meta Pixel -->
   <script>
   !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
   n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
   n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
   t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
   document,'script','https://connect.facebook.net/en_US/fbevents.js');
   fbq('init', 'YOUR_PIXEL_ID');
   fbq('track', 'PageView');
   </script>
   ```

3. Build your ads with **URL parameters** so you know which ad sent each lead:

   ```
   https://your-domain.up.railway.app/?utm_source=facebook&utm_medium=cpc&utm_campaign=spring_homeloan&utm_content=ad_variant_a
   ```

   These auto-flow into every lead row and into your Google Sheet, so you can compare which campaigns convert.

4. **Conversions API (recommended later)** — for proper iOS-safe attribution, fire `Lead` events server-side from `POST /api/leads`. Hit me up when you're ready and I'll wire it up.

---

## 5. Project structure

```
.
├── public/                 # Static files served at /
│   ├── index.html          # Landing page
│   ├── styles.css
│   ├── app.js              # Form + UTM logic
│   ├── admin.html          # Admin dashboard
│   └── hero-family.png
├── lib/sheets.js           # Google Sheets append
├── db/schema.sql           # Postgres schema
├── scripts/init-db.js      # Manual schema apply
├── server.js               # Express API
├── package.json
├── .env.example
└── README.md
```

---

## 6. Security notes

- Change `ADMIN_PASS` to something strong, immediately.
- The form is rate-limited (10 submits per IP per 10 min). Adjust in `server.js` if needed.
- Admin login is rate-limited (10 attempts per 15 min).
- Cookies are `httpOnly` + `secure` in production.
- To rotate the admin session secret, change `SESSION_SECRET` and redeploy — all admins will be signed out.

---

## 7. Editing the landing page

The production landing lives in `public/`. The interactive prototype (with Tweaks panel + iOS frame) lives in the root as `Home Loan Template.html` — that's for design iteration only and isn't deployed.

When you change copy or design in the prototype, mirror the changes into `public/index.html` + `public/styles.css`, then `git push` — Railway redeploys automatically.
