// Player health, depth charts, ownership and trends.
//   Sleeper public API (no key): intraday injury status, practice, depth chart, trending adds/drops.
//   ESPN public fantasy endpoint (no key, best effort): percent rostered and started.
//   nflverse official injury report (fallback and cross-check).
const SLEEPER = "https://api.sleeper.app/v1/players/nfl";
const TREND = (kind) => `https://api.sleeper.app/v1/players/nfl/trending/${kind}?lookback_hours=24&limit=150`;
const ESPN = (season) => `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${season}/players?scoringPeriodId=0&view=players_wl`;
const INJ = "https://github.com/nflverse/nflverse-data/releases/download/injuries/injuries_2026.csv";
const POS = new Set(["QB", "RB", "WR", "TE", "K"]);
const TM = { LA: "LAR", WSH: "WAS", JAC: "JAX" };
const norm = (n) => (n || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/['.]/g, "").replace(/\b(jr|sr|ii|iii|iv|v)\b/g, "").replace(/[^a-z0-9]+/g, "");
function parseCsv(text) { const rows = []; let row = [], field = "", q = false; for (let i = 0; i < text.length; i++) { const c = text[i]; if (q) { if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; } else field += c; } else if (c === '"') q = true; else if (c === ",") { row.push(field); field = ""; } else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; } else if (c !== "\r") field += c; } if (field.length || row.length) { row.push(field); rows.push(row); } const hdr = rows.shift(); return rows.filter((r) => r.length > 1).map((r) => Object.fromEntries(hdr.map((h, i) => [h, r[i]]))); }
const ESPN_POS = { 1: "QB", 2: "RB", 3: "WR", 4: "TE", 5: "K", 16: "DEF" };
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "s-maxage=10800, stale-while-revalidate=3600");
  if (req.method === "OPTIONS") return res.status(200).end();
  const out = { at: Date.now(), health: {}, trend: { add: {}, drop: {} }, own: {}, sources: [] };
  // 1. Sleeper players (5 MB): injury status, practice, depth chart, status
  try {
    const r = await fetch(SLEEPER); if (r.ok) { const all = await r.json(); const byId = {};
      Object.keys(all).forEach((id) => { const p = all[id]; if (!p || !POS.has(p.position) || !p.team) return; byId[id] = p; const k = norm(p.full_name || `${p.first_name} ${p.last_name}`) + "|" + p.position;
        out.health[k] = { team: TM[p.team] || p.team, inj: p.injury_status || null, part: p.injury_body_part || null, note: p.injury_notes || null, prac: p.practice_participation || null, dc: p.depth_chart_position || null, dco: p.depth_chart_order || null, st: p.status || null, sid: id, espn: p.espn_id || null, rank: p.search_rank || null }; });
      out.sources.push("Sleeper players");
      for (const kind of ["add", "drop"]) { try { const t = await fetch(TREND(kind)); if (t.ok) { const arr = await t.json(); arr.forEach((x) => { const p = byId[x.player_id]; if (p) out.trend[kind][norm(p.full_name || `${p.first_name} ${p.last_name}`) + "|" + p.position] = x.count; }); out.sources.push(`Sleeper trending ${kind}s`); } } catch (e) { /* skip */ } }
    }
  } catch (e) { out.sleeperError = e.message; }
  // 2. ESPN percent rostered (best effort; unofficial endpoint)
  try {
    const r = await fetch(ESPN(2026), { headers: { "x-fantasy-filter": JSON.stringify({ players: { limit: 1200, sortPercOwned: { sortPriority: 1, sortAsc: false }, filterStatus: { value: ["FREEAGENT", "WAIVERS", "ONTEAM"] } } }), "User-Agent": "Mozilla/5.0" } });
    if (r.ok) { const arr = await r.json(); (Array.isArray(arr) ? arr : []).forEach((p) => { const pos = ESPN_POS[p.defaultPositionId]; if (!pos || !p.ownership) return; const k = norm(p.fullName) + "|" + pos; out.own[k] = { pct: Math.round(p.ownership.percentOwned * 10) / 10, started: Math.round((p.ownership.percentStarted || 0) * 10) / 10, chg: Math.round((p.ownership.percentChange || 0) * 10) / 10 }; }); out.sources.push("ESPN ownership"); }
  } catch (e) { out.espnError = e.message; }
  // 3. nflverse official report (cross-check; the app prefers Sleeper when both exist)
  try {
    const r = await fetch(INJ); if (r.ok) { const inj = parseCsv(await r.text()).filter((x) => POS.has(x.position) && x.season_type === "REG"); const wk = Math.max(0, ...inj.map((x) => parseInt(x.week || "0", 10) || 0)); out.injWeek = wk; out.official = {};
      inj.filter((x) => (parseInt(x.week || "0", 10) || 0) === wk).forEach((x) => { out.official[norm(x.full_name) + "|" + x.position] = { status: x.report_status || null, injury: x.practice_primary_injury || null, practice: x.practice_status || null }; }); out.sources.push("nflverse official injury report"); }
  } catch (e) { /* skip */ }
  res.status(200).json(out);
};
