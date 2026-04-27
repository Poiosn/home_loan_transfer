// server.js — Express + Postgres + Google Sheets sync + admin
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const crypto = require('crypto');
const { appendToSheet } = require('./lib/sheets');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Postgres ──
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway') || process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false } : false,
});

// Auto-init on startup
(async () => {
  try {
    const fs = require('fs');
    const sql = fs.readFileSync(path.join(__dirname, 'db', 'schema.sql'), 'utf8');
    await pool.query(sql);
    console.log('✓ Schema ensured');
  } catch (e) {
    console.warn('Schema init warning:', e.message);
  }
})();

// ── Middleware ──
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json({ limit: '32kb' }));
app.use(cookieParser());

// Static — serve the landing page
app.use(express.static(path.join(__dirname, 'public')));

// ── Rate limit: 10 leads per IP per 10 min ──
const leadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: { error: 'Too many submissions. Please try again later.' },
  standardHeaders: true,
});

// ── Validation helpers ──
const isMobileValid = (m) => /^[6-9]\d{9}$/.test(String(m).replace(/\D/g, ''));
const isEmailValid = (e) => !e || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

// ── POST /api/leads ──
app.post('/api/leads', leadLimiter, async (req, res) => {
  try {
    const {
      name, mobile, email,
      consent_terms, consent_whatsapp,
      utm_source, utm_medium, utm_campaign, utm_content, utm_term,
      fbclid, referrer,
    } = req.body || {};

    if (!name || String(name).trim().length < 2)
      return res.status(400).json({ error: 'Name is required' });
    if (!isMobileValid(mobile))
      return res.status(400).json({ error: 'Invalid mobile number' });
    if (!isEmailValid(email))
      return res.status(400).json({ error: 'Invalid email' });

    const cleanMobile = String(mobile).replace(/\D/g, '');
    const ua = req.headers['user-agent'] || '';
    const ip = req.ip;

    const { rows } = await pool.query(
      `INSERT INTO leads (name, mobile, email, consent_terms, consent_whatsapp,
        utm_source, utm_medium, utm_campaign, utm_content, utm_term,
        fbclid, referrer, user_agent, ip)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING id, created_at`,
      [
        String(name).trim().slice(0, 120),
        cleanMobile,
        email ? String(email).trim().toLowerCase().slice(0, 200) : null,
        !!consent_terms,
        !!consent_whatsapp,
        utm_source || null, utm_medium || null, utm_campaign || null,
        utm_content || null, utm_term || null,
        fbclid || null, referrer || null,
        ua.slice(0, 500), ip,
      ]
    );

    const lead = rows[0];
    const refId = `HM${String(lead.id).padStart(6, '0')}`;

    // Fire-and-forget Google Sheets sync (don't block response)
    appendToSheet({
      id: lead.id,
      ref: refId,
      name, mobile: cleanMobile, email: email || '',
      consent_terms: !!consent_terms, consent_whatsapp: !!consent_whatsapp,
      utm_source: utm_source || '', utm_medium: utm_medium || '',
      utm_campaign: utm_campaign || '', utm_content: utm_content || '',
      utm_term: utm_term || '', fbclid: fbclid || '',
      referrer: referrer || '', created_at: lead.created_at,
    }).catch(e => console.warn('Sheets sync failed:', e.message));

    res.json({ ok: true, id: lead.id, ref: refId });
  } catch (e) {
    console.error('Lead insert error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Admin auth (cookie-based, simple) ──
function signToken(user) {
  const payload = JSON.stringify({ user, exp: Date.now() + 1000 * 60 * 60 * 12 });
  const b64 = Buffer.from(payload).toString('base64url');
  const sig = crypto.createHmac('sha256', process.env.SESSION_SECRET || 'dev')
    .update(b64).digest('base64url');
  return `${b64}.${sig}`;
}
function verifyToken(token) {
  if (!token) return null;
  const [b64, sig] = token.split('.');
  if (!b64 || !sig) return null;
  const expected = crypto.createHmac('sha256', process.env.SESSION_SECRET || 'dev')
    .update(b64).digest('base64url');
  if (sig !== expected) return null;
  try {
    const payload = JSON.parse(Buffer.from(b64, 'base64url').toString('utf8'));
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch { return null; }
}
function requireAdmin(req, res, next) {
  const ok = verifyToken(req.cookies?.admin_token);
  if (!ok) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

app.post('/api/admin/login', loginLimiter, (req, res) => {
  const { user, pass } = req.body || {};
  if (user === process.env.ADMIN_USER && pass === process.env.ADMIN_PASS) {
    const token = signToken(user);
    res.cookie('admin_token', token, {
      httpOnly: true, sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 12,
    });
    return res.json({ ok: true });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

app.post('/api/admin/logout', (req, res) => {
  res.clearCookie('admin_token');
  res.json({ ok: true });
});

app.get('/api/admin/leads', requireAdmin, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, name, mobile, email, consent_terms, consent_whatsapp,
      utm_source, utm_medium, utm_campaign, utm_content, fbclid,
      referrer, created_at
     FROM leads ORDER BY created_at DESC LIMIT 1000`
  );
  res.json({ leads: rows });
});

app.get('/api/admin/leads.csv', requireAdmin, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, name, mobile, email, consent_terms, consent_whatsapp,
      utm_source, utm_medium, utm_campaign, utm_content, utm_term,
      fbclid, referrer, user_agent, ip, created_at
     FROM leads ORDER BY created_at DESC`
  );
  const headers = Object.keys(rows[0] || { id: '', name: '', mobile: '', email: '', created_at: '' });
  const esc = (v) => {
    if (v == null) return '';
    const s = String(v).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  const csv = [headers.join(','), ...rows.map(r => headers.map(h => esc(r[h])).join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="leads-${Date.now()}.csv"`);
  res.send(csv);
});

app.get('/api/admin/me', (req, res) => {
  const ok = verifyToken(req.cookies?.admin_token);
  res.json({ authenticated: !!ok, user: ok?.user || null });
});

// Health check
app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`✓ Server running on :${PORT}`));
