// Cross-device save. Stores your league data (not the re-fetchable caches) in Upstash Redis via Vercel's Storage integration.
// Env: KV_REST_API_URL + KV_REST_API_TOKEN (added automatically when you connect the database), DIMES_PIN (a passphrase you choose).
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const PIN = process.env.DIMES_PIN;
const KEY = "dimes:state:v1";
async function kv(cmd, body) { const r = await fetch(`${URL_}/${cmd}`, { method: body != null ? "POST" : "GET", headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" }, body: body != null ? body : undefined }); if (!r.ok) throw new Error(`store ${r.status}`); return r.json(); }
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-dimes-pin"); res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS"); res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (!URL_ || !TOKEN) return res.status(501).json({ error: "No database connected. In Vercel, open Storage, create a Redis (Upstash) database and connect it to this project." });
  if (!PIN) return res.status(501).json({ error: "Set a DIMES_PIN environment variable in Vercel, then enter the same PIN in the app's Settings." });
  const pin = req.headers["x-dimes-pin"] || (req.query || {}).pin;
  if (pin !== PIN) return res.status(401).json({ error: "PIN does not match." });
  try {
    if (req.method === "GET") { const j = await kv(`get/${KEY}`); if (!j.result) return res.status(200).json({ empty: true }); const doc = typeof j.result === "string" ? JSON.parse(j.result) : j.result; return res.status(200).json(doc); }
    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
      if (!body || !body.data || !body.updatedAt) return res.status(400).json({ error: "Expected { updatedAt, data }." });
      const cur = await kv(`get/${KEY}`); const prev = cur.result ? (typeof cur.result === "string" ? JSON.parse(cur.result) : cur.result) : null;
      if (prev && prev.updatedAt > body.updatedAt && !(req.query || {}).force) return res.status(409).json({ conflict: true, remote: prev });
      const doc = { updatedAt: body.updatedAt, device: body.device || null, data: body.data };
      await kv(`set/${KEY}`, JSON.stringify(doc));
      return res.status(200).json({ ok: true, updatedAt: doc.updatedAt, bytes: JSON.stringify(doc).length });
    }
    res.status(405).json({ error: "GET or POST" });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
