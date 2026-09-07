// Weekly usage from nflverse: snap share, targets, target share, carries, air-yards share. Free, no key.
const STATS = (s) => `https://github.com/nflverse/nflverse-data/releases/download/stats_player/stats_player_week_${s}.csv`;
const SNAPS = (s) => `https://github.com/nflverse/nflverse-data/releases/download/snap_counts/snap_counts_${s}.csv`;
const POS = new Set(["QB", "RB", "WR", "TE"]);
const TM = { LA: "LAR" };
const norm = (n) => (n || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/['.]/g, "").replace(/\b(jr|sr|ii|iii|iv|v)\b/g, "").replace(/[^a-z0-9]+/g, "");
function parseCsv(text) { const rows = []; let row = [], field = "", q = false; for (let i = 0; i < text.length; i++) { const c = text[i]; if (q) { if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; } else field += c; } else if (c === '"') q = true; else if (c === ",") { row.push(field); field = ""; } else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; } else if (c !== "\r") field += c; } if (field.length || row.length) { row.push(field); rows.push(row); } const hdr = rows.shift(); return rows.filter((r) => r.length > 1).map((r) => Object.fromEntries(hdr.map((h, i) => [h, r[i]]))); }
const f = (x) => { const n = parseFloat(x); return isNaN(n) ? null : n; };
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "s-maxage=21600, stale-while-revalidate=3600");
  if (req.method === "OPTIONS") return res.status(200).end();
  const season = parseInt((req.query || {}).season || "2026", 10);
  const weeksBack = Math.min(8, Math.max(1, parseInt((req.query || {}).weeks || "5", 10)));
  try {
    const [sr, nr] = await Promise.all([fetch(STATS(season)), fetch(SNAPS(season))]);
    if (!sr.ok) return res.status(200).json({ at: Date.now(), season, weeks: [], players: {}, note: `No weekly stats published yet for ${season}.` });
    const stats = parseCsv(await sr.text()).filter((r) => POS.has(r.position) && r.season_type === "REG");
    const maxW = Math.max(0, ...stats.map((r) => parseInt(r.week || "0", 10) || 0)); const minW = Math.max(1, maxW - weeksBack + 1);
    const snaps = {}; if (nr.ok) parseCsv(await nr.text()).forEach((r) => { if (!POS.has(r.position) || r.game_type !== "REG") return; const w = parseInt(r.week || "0", 10); if (w < minW) return; snaps[norm(r.player) + "|" + r.position + "|" + w] = f(r.offense_pct); });
    const players = {};
    stats.forEach((r) => { const w = parseInt(r.week || "0", 10); if (w < minW) return; const k = norm(r.player_display_name) + "|" + r.position; const rec = players[k] = players[k] || { team: TM[r.team] || r.team, wk: {} };
      rec.wk[w] = { opp: TM[r.opponent_team] || r.opponent_team, snap: snaps[k + "|" + w] != null ? Math.round(snaps[k + "|" + w] * 100) : null, tgt: f(r.targets), ts: f(r.target_share) != null ? Math.round(f(r.target_share) * 100) : null, ays: f(r.air_yards_share) != null ? Math.round(f(r.air_yards_share) * 100) : null, rec: f(r.receptions), recy: f(r.receiving_yards), car: f(r.carries), ry: f(r.rushing_yards), att: f(r.attempts), py: f(r.passing_yards), td: (f(r.passing_tds) || 0) + (f(r.rushing_tds) || 0) + (f(r.receiving_tds) || 0),
        fp: Math.round(((f(r.passing_yards) || 0) / 25 + (f(r.passing_tds) || 0) * 4 - (f(r.passing_interceptions) || 0) + (f(r.rushing_yards) || 0) / 10 + (f(r.rushing_tds) || 0) * 6 + (f(r.receptions) || 0) * 0.5 + (f(r.receiving_yards) || 0) / 10 + (f(r.receiving_tds) || 0) * 6 - ((f(r.rushing_fumbles_lost) || 0) + (f(r.receiving_fumbles_lost) || 0) + (f(r.sack_fumbles_lost) || 0)) * 2) * 10) / 10 }; });
    res.status(200).json({ at: Date.now(), season, weeks: Array.from({ length: maxW - minW + 1 }, (_, i) => minW + i), players, source: "nflverse weekly player stats and snap counts" });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
