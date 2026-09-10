// Live and final player stat lines for the week from ESPN's public game summaries, scored for Yahoo half-PPR. No key. Cached 60s.
const TM = { LA: "LAR", WSH: "WAS", JAC: "JAX" };
const norm = (n) => (n || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/['.]/g, "").replace(/\b(jr|sr|ii|iii|iv|v)\b/g, "").replace(/[^a-z0-9]+/g, "");
const num = (x) => { const n = parseFloat(String(x).split("/")[0]); return isNaN(n) ? 0 : n; };
const frac = (x) => { const m = String(x).match(/^(\d+)\/(\d+)/); return m ? [parseInt(m[1], 10), parseInt(m[2], 10)] : [num(x), 0]; };
function scoreLine(l) { return Math.round((l.py / 25 + l.ptd * 4 - l.int + l.ry / 10 + l.rtd * 6 + l.rec * 0.5 + l.recy / 10 + l.rectd * 6 - l.fl * 2 + l.fgpts + l.xp) * 100) / 100; }
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=60");
  if (req.method === "OPTIONS") return res.status(200).end();
  const week = parseInt((req.query || {}).week || "0", 10);
  try {
    const sb = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=2&dates=2026${week ? `&week=${week}` : ""}`); if (!sb.ok) throw new Error(`ESPN ${sb.status}`);
    const j = await sb.json(); const events = (j.events || []);
    const active = events.filter((e) => { const st = ((e.competitions || [])[0] || {}).status || e.status || {}; const t = st.type || {}; return t.state === "in" || t.completed; });
    const players = {}; const dst = {}; const games = [];
    await Promise.all(active.map(async (e) => {
      try {
        const r = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${e.id}`); if (!r.ok) return; const s = await r.json();
        const comp = (e.competitions || [])[0] || {}; const home = (comp.competitors || []).find((x) => x.homeAway === "home") || {}, away = (comp.competitors || []).find((x) => x.homeAway === "away") || {};
        const ab = (x) => { const a = (x.team && x.team.abbreviation) || ""; return TM[a] || a; }; const H = ab(home), A = ab(away); const hs = parseInt(home.score || "0", 10), as = parseInt(away.score || "0", 10);
        const st = (comp.status || {}).type || {}; const live = st.state === "in", done = !!st.completed; const detail = st.shortDetail || "";
        games.push({ home: H, away: A, hs, as, live, done, detail });
        const teamDef = { [H]: { sack: 0, int: 0, fr: 0, td: 0, pa: as }, [A]: { sack: 0, int: 0, fr: 0, td: 0, pa: hs } };
        (s.boxscore && s.boxscore.players || []).forEach((tp) => { const T = TM[(tp.team && tp.team.abbreviation) || ""] || (tp.team && tp.team.abbreviation) || ""; (tp.statistics || []).forEach((cat) => { const labels = cat.labels || []; const idx = (l) => labels.indexOf(l);
          (cat.athletes || []).forEach((a) => { const name = a.athlete && a.athlete.displayName; if (!name) return; const k = norm(name); const st0 = a.stats || []; const g = (l) => (idx(l) >= 0 ? st0[idx(l)] : null);
            const rec = players[k] = players[k] || { name, team: T, py: 0, ptd: 0, int: 0, ry: 0, rtd: 0, rec: 0, recy: 0, rectd: 0, fl: 0, fgpts: 0, xp: 0, tgt: 0, car: 0, att: 0, live, done };
            if (cat.name === "passing") { const [c, at] = frac(g("C/ATT")); rec.att = at; rec.py = num(g("YDS")); rec.ptd = num(g("TD")); rec.int = num(g("INT")); }
            if (cat.name === "rushing") { rec.car = num(g("CAR")); rec.ry = num(g("YDS")); rec.rtd = num(g("TD")); }
            if (cat.name === "receiving") { rec.rec = num(g("REC")); rec.recy = num(g("YDS")); rec.rectd = num(g("TD")); rec.tgt = num(g("TGTS")); }
            if (cat.name === "fumbles") { rec.fl = num(g("LOST")); }
            if (cat.name === "kicking") { const [fm] = frac(g("FG")); const [xm] = frac(g("XP")); const long = num(g("LONG")); rec.fgpts = fm * 3 + (long >= 50 ? 2 : long >= 40 ? 1 : 0); rec.xp = xm; rec.fgm = fm; rec.long = long; }
            if (cat.name === "defensive" && teamDef[T]) { teamDef[T].sack += num(g("SACKS")); teamDef[T].td += num(g("TD")); }
            if (cat.name === "interceptions" && teamDef[T]) { teamDef[T].int += num(g("INT")); teamDef[T].td += num(g("TD")); }
            if (cat.name === "fumbles" && teamDef[T] && cat.name === "fumbles") { teamDef[T].fr += num(g("REC")); }
          }); }); });
        Object.keys(teamDef).forEach((t) => { const d = teamDef[t]; const pa = d.pa; const paPts = pa === 0 ? 10 : pa <= 6 ? 7 : pa <= 13 ? 4 : pa <= 20 ? 1 : pa <= 27 ? 0 : pa <= 34 ? -1 : -4; dst[t] = { ...d, pts: Math.round((d.sack + d.int * 2 + d.fr * 2 + d.td * 6 + paPts) * 100) / 100, live, done }; });
      } catch (err) { /* skip game */ }
    }));
    Object.keys(players).forEach((k) => { players[k].pts = scoreLine(players[k]); });
    res.status(200).json({ at: Date.now(), week: j.week && j.week.number, games, players, dst, note: "Kicker distance tiers approximated from FG count and long; DEF fumble recoveries from the box score; safeties and blocked kicks not counted." });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
