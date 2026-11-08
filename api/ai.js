/* Proxy IA : la clé Anthropic reste côté serveur. Réservé aux utilisateurs connectés (jeton Supabase vérifié). */
const SB_URL = process.env.SUPABASE_URL || 'https://ufqdplmibnczqnpmkgjq.supabase.co';
const SB_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_UVBJjovoii0HKOGJ5KmqaQ_-PDzRq5i';
const hits = new Map();
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(503).json({ error: 'not_configured' });
  const tok = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!tok) return res.status(401).json({ error: 'auth' });
  let user;
  try { const u = await fetch(`${SB_URL}/auth/v1/user`, { headers: { apikey: SB_KEY, Authorization: `Bearer ${tok}` } }); if (!u.ok) return res.status(401).json({ error: 'auth' }); user = await u.json(); }
  catch { return res.status(502).json({ error: 'auth_unreachable' }); }
  const now = Date.now(), h = (hits.get(user.id) || []).filter(t => now - t < 600000);
  if (h.length >= 60) return res.status(429).json({ error: 'rate_limited' });
  h.push(now); hits.set(user.id, h);
  let b = req.body; if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = null; } }
  if (!b || !Array.isArray(b.messages) || !b.messages.length || b.messages.length > 40) return res.status(400).json({ error: 'bad_request' });
  const payload = { model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5', max_tokens: Math.min(Number(b.max_tokens) || 4000, 8000), messages: b.messages };
  if (Array.isArray(b.tools) && b.tools.length) payload.tools = b.tools.slice(0, 10);
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    const txt = await r.text();
    res.setHeader('Content-Type', 'application/json');
    if (r.status === 429) return res.status(429).send(JSON.stringify({ error: 'rate_limited' }));
    return res.status(r.ok ? 200 : 502).send(r.ok ? txt : JSON.stringify({ error: 'upstream', status: r.status }));
  } catch { return res.status(502).json({ error: 'upstream_unreachable' }); }
};
