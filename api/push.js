// Push notifications for injury and status changes on your roster.
//   GET  ?key=1        -> VAPID public key (for the browser to subscribe)
//   POST {sub, players} -> store the subscription and the roster keys to watch
//   GET  ?check=1      -> compare Sleeper statuses for watched players against the last check; notify on changes (Vercel cron hits this daily; the app also hits it when opened)
// Env: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:you@example.com), KV_REST_API_URL, KV_REST_API_TOKEN, DIMES_PIN
const webpush = require("web-push");
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL; const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const SLEEPER = "https://api.sleeper.app/v1/players/nfl";
const norm = (n) => (n || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/['.]/g, "").replace(/\b(jr|sr|ii|iii|iv|v)\b/g, "").replace(/[^a-z0-9]+/g, "");
async function kv(cmd, body) { const r = await fetch(`${URL_}/${cmd}`, { method: body != null ? "POST" : "GET", headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" }, body: body != null ? body : undefined }); if (!r.ok) throw new Error(`store ${r.status}`); return r.json(); }
const getJ = async (k) => { const j = await kv(`get/${k}`); if (!j.result) return null; try { return typeof j.result === "string" ? JSON.parse(j.result) : j.result; } catch (e) { return null; } };
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-dimes-pin"); res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") return res.status(200).end();
  const q = req.query || {};
  if (q.key) return res.status(200).json({ key: process.env.VAPID_PUBLIC_KEY || null });
  if (!URL_ || !TOKEN) return res.status(501).json({ error: "No database connected." });
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return res.status(501).json({ error: "Set VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY and VAPID_SUBJECT in Vercel to enable notifications." });
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:dimes@example.com", process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  try {
    if (req.method === "POST") {
      const pin = req.headers["x-dimes-pin"]; if (process.env.DIMES_PIN && pin !== process.env.DIMES_PIN) return res.status(401).json({ error: "PIN does not match." });
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
      const subs = (await getJ("dimes:push:subs")) || []; const key = body.sub && body.sub.endpoint; if (!key) return res.status(400).json({ error: "No subscription." });
      const next = subs.filter((s) => s.sub.endpoint !== key); next.push({ sub: body.sub, players: (body.players || []).slice(0, 40), at: Date.now() });
      await kv("set/dimes:push:subs", JSON.stringify(next)); return res.status(200).json({ ok: true, devices: next.length });
    }
    if (q.check) {
      const subs = (await getJ("dimes:push:subs")) || []; if (!subs.length) return res.status(200).json({ ok: true, note: "no devices" });
      const r = await fetch(SLEEPER); if (!r.ok) throw new Error(`Sleeper ${r.status}`); const all = await r.json();
      const byKey = {}; Object.values(all).forEach((p) => { if (!p || !p.position) return; byKey[norm(p.full_name || `${p.first_name} ${p.last_name}`) + "|" + p.position] = p; });
      const last = (await getJ("dimes:push:last")) || {}; const now = {}; const changes = [];
      const watched = new Set(subs.flatMap((s) => s.players || []));
      watched.forEach((k) => { const p = byKey[k]; if (!p) return; const st = `${p.injury_status || ""}|${p.status || ""}|${p.depth_chart_order || ""}`; now[k] = st; if (last[k] != null && last[k] !== st) { const name = p.full_name || `${p.first_name} ${p.last_name}`; const was = (last[k].split("|")[0] || "healthy"), is = (p.injury_status || "healthy"); if (was !== is) changes.push({ k, title: `${name}: ${is}`, body: `${p.injury_body_part ? p.injury_body_part + ". " : ""}${p.practice_participation ? "Practice: " + p.practice_participation + ". " : ""}Was ${was}.` }); else if (last[k].split("|")[2] !== String(p.depth_chart_order || "")) changes.push({ k, title: `${name}: depth chart moved`, body: `Now ${p.depth_chart_position || ""}${p.depth_chart_order || ""}.` }); } });
      await kv("set/dimes:push:last", JSON.stringify(now));
      let sent = 0; const dead = [];
      for (const s of subs) { const mine = changes.filter((c) => (s.players || []).includes(c.k)); for (const c of mine) { try { await webpush.sendNotification(s.sub, JSON.stringify({ title: c.title, body: c.body, url: "/" })); sent++; } catch (e) { if (e.statusCode === 404 || e.statusCode === 410) dead.push(s.sub.endpoint); } } }
      if (dead.length) await kv("set/dimes:push:subs", JSON.stringify(subs.filter((s) => !dead.includes(s.sub.endpoint))));
      return res.status(200).json({ ok: true, watched: watched.size, changes: changes.length, sent, firstRun: Object.keys(last).length === 0 });
    }
    res.status(400).json({ error: "Use ?key=1, ?check=1, or POST a subscription." });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
