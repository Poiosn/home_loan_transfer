// lib/sheets.js — append a lead row to Google Sheets (optional)
const { google } = require('googleapis');

let sheetsClient = null;

function getClient() {
  if (sheetsClient) return sheetsClient;
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!json) return null;
  let creds;
  try { creds = JSON.parse(json); }
  catch { console.warn('Invalid GOOGLE_SERVICE_ACCOUNT_JSON'); return null; }
  const auth = new google.auth.JWT(
    creds.client_email, null, creds.private_key,
    ['https://www.googleapis.com/auth/spreadsheets']
  );
  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

async function appendToSheet(lead) {
  const sheets = getClient();
  if (!sheets) return; // sync disabled
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const tab = process.env.GOOGLE_SHEET_TAB || 'Leads';
  if (!sheetId) return;

  const row = [
    lead.id, lead.ref, new Date(lead.created_at).toISOString(),
    lead.name, lead.mobile, lead.email,
    lead.consent_terms ? 'Yes' : 'No',
    lead.consent_whatsapp ? 'Yes' : 'No',
    lead.utm_source, lead.utm_medium, lead.utm_campaign,
    lead.utm_content, lead.utm_term, lead.fbclid, lead.referrer,
  ];

  // Ensure header row exists
  try {
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId, range: `${tab}!A1:O1`,
    });
    if (!existing.data.values || existing.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId, range: `${tab}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: [[
          'ID', 'Ref', 'Created', 'Name', 'Mobile', 'Email',
          'Consent Terms', 'Consent WhatsApp',
          'UTM Source', 'UTM Medium', 'UTM Campaign',
          'UTM Content', 'UTM Term', 'fbclid', 'Referrer',
        ]] },
      });
    }
  } catch (e) {
    // tab might not exist; continue and let append fail loudly
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId, range: `${tab}!A:O`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [row] },
  });
}

module.exports = { appendToSheet };
