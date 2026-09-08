// Live and final NFL scores from ESPN's public scoreboard (no key). Cached five minutes.
const TM = { LA: "LAR", WSH: "WAS", JAC: "JAX" };
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=120");
  if (req.method === "OPTIONS") return res.status(200).end();
  const week = parseInt((req.query || {}).week || "0", 10);
  const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=2&dates=2026${week ? `&week=${week}` : ""}`;
  try {
    const r = await fetch(url); if (!r.ok) throw new Error(`ESPN ${r.status}`);
    const j = await r.json();
    const games = (j.events || []).map((e) => { const c = (e.competitions || [])[0] || {}; const home = (c.competitors || []).find((x) => x.homeAway === "home") || {}, away = (c.competitors || []).find((x) => x.homeAway === "away") || {}; const st = (c.status || e.status || {}); const t = st.type || {};
      const ab = (x) => { const a = (x.team && x.team.abbreviation) || ""; return TM[a] || a; };
      return { home: ab(home), away: ab(away), hs: home.score != null ? parseInt(home.score, 10) : null, as: away.score != null ? parseInt(away.score, 10) : null, state: t.state || null, done: !!t.completed, detail: t.shortDetail || t.detail || null, clock: st.displayClock || null, period: st.period || null, start: e.date || null, week: j.week && j.week.number };
    });
    res.status(200).json({ at: Date.now(), week: j.week && j.week.number, games, source: "ESPN scoreboard" });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
