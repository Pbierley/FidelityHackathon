// routes/ai.js
const express = require('express');
const router = express.Router();

// Use global fetch on Node 18+; otherwise lazy-load node-fetch
const doFetch = (typeof fetch === 'function')
  ? fetch
  : (...args) => import('node-fetch').then(({ default: f }) => f(...args));

/** =========================
 *  Kill switch + monthly cap
 *  ========================= */
function currentMonthKey() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

let monthKey = currentMonthKey();
let monthlyCount = 0;

// Middleware: enforce kill switch + monthly cap
function aiControls(req, res, next) {
  // 1) Kill switch: set AI_ENABLED=false in .env to disable immediately
  if ((process.env.AI_ENABLED || 'true').toLowerCase() === 'false') {
    return res.status(503).json({ error: 'AI temporarily disabled' });
  }

  // 2) Monthly cap: hard stop at configured limit
  const cap = Number(process.env.AI_MONTHLY_CAP || 2000);
  const mk = currentMonthKey();
  if (mk !== monthKey) { monthKey = mk; monthlyCount = 0; } // reset on new month (UTC)

  if (monthlyCount >= cap) {
    return res.status(429).json({ error: 'Monthly AI quota reached' });
  }

  // Count *before* calling upstream to close race windows
  monthlyCount += 1;
  next();
}

/** ===============
 *  Route handler
 *  =============== */
router.post('/ask', aiControls, async (req, res) => {
  try {
    const question = (req.body?.question || '').trim();
    if (!question) return res.status(400).json({ error: 'Ask a real question.' });

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) return res.status(500).json({ error: 'OPENAI_API_KEY missing' });

    // Keep system prompt short (counts toward input tokens)
    const system = `You are "An Investor (AI)". Be clear and educational about stocks and options. 
Avoid financial advice; provide general information and learning guidance only.`;

    // Short answers: cap output tokens
    const MAX_OUT = Number(process.env.AI_MAX_OUTPUT_TOKENS || 120);

    const r = await doFetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        input: [
          { role: 'system', content: system },
          { role: 'user', content: question }
        ],
        max_output_tokens: MAX_OUT,     // <-- short answers
        temperature: 0.3
      })
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(r.status).json({ error: 'Upstream error', detail: text });
    }

    const json = await r.json();
    const answer =
      (json.output_text && String(json.output_text).trim()) ||
      json.output?.[0]?.content?.[0]?.text ||
      '(no answer)';

    res.set('Cache-Control', 'no-store');
    res.json({ answer });
  } catch (e) {
    console.error('AI route error:', e);
    res.status(500).json({ error: 'internal' });
  }
});

module.exports = router;
