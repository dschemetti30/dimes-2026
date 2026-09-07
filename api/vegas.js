// Dimes War Room: Vegas lines + player props from The Odds API, normalized for the app.
// Key lives here server-side only (or in ODDS_API_KEY env var if you add one in Vercel settings).
const KEY = process.env.ODDS_API_KEY; // set in Vercel project settings
const BASE = "https://api.the-odds-api.com/v4/sports/americanfootball_nfl";
const BOOKS = "draftkings,fanduel,betmgm";
const PROP_MARKETS = "player_pass_yds,player_pass_tds,player_rush_yds,player_reception_yds,player_receptions,player_anytime_td";
const TEAM = { "Arizona Cardinals": "ARI", "Atlanta Falcons": "ATL", "Baltimore Ravens": "BAL", "Buffalo Bills": "BUF", "Carolina Panthers": "CAR", "Chicago Bears": "CHI", "Cincinnati Bengals": "CIN", "Cleveland Browns": "CLE", "Dallas Cowboys": "DAL", "Denver Broncos": "DEN", "Detroit Lions": "DET", "Green Bay Packers": "GB", "Houston Texans": "HOU", "Indianapolis Colts": "IND", "Jacksonville Jaguars": "JAX", "Kansas City Chiefs": "KC", "Los Angeles Chargers": "LAC", "Los Angeles Rams": "LAR", "Las Vegas Raiders": "LV", "Miami Dolphins": "MIA", "Minnesota Vikings": "MIN", "New England Patriots": "NE", "New Orleans Saints": "NO", "New York Giants": "NYG", "New York Jets": "NYJ", "Philadelphia Eagles": "PHI", "Pittsburgh Steelers": "PIT", "Seattle Seahawks": "SEA", "San Francisco 49ers": "SF", "Tampa Bay Buccaneers": "TB", "Tennessee Titans": "TEN", "Washington Commanders": "WAS" };
const abbr = (n) => TEAM[n] || n;
const prob = (price) => (price < 0 ? -price / (-price + 100) : 100 / (price + 100));
const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const norm = (n) => n.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/['.]/g, "").replace(/\b(jr|sr|ii|iii|iv|v)\b/g, "").replace(/[^a-z0-9]+/g, "");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "s-maxage=14400, stale-while-revalidate=3600");
  if (req.method === "OPTIONS") return res.status(200).end();
  const wantProps = String((req.query || {}).props || "") === "1";
  const days = Math.min(9, Math.max(1, parseInt((req.query || {}).days || "8", 10)));
  if (!KEY) return res.status(501).json({ error: "ODDS_API_KEY is not set in the Vercel project settings." });
  try {
    const r = await fetch(`${BASE}/odds?apiKey=${KEY}&regions=us&markets=spreads,totals&oddsFormat=american&bookmakers=${BOOKS}`);
    if (!r.ok) throw new Error(`Odds API ${r.status}: ${(await r.text()).slice(0, 200)}`);
    const credits = { remaining: r.headers.get("x-requests-remaining"), used: r.headers.get("x-requests-used"), last: r.headers.get("x-requests-last") };
    const events = await r.json();
    const now = Date.now();
    const soon = events.filter((e) => new Date(e.commence_time).getTime() < now + days * 864e5 && new Date(e.commence_time).getTime() > now - 6 * 3600e3);
    const games = soon.map((e) => {
      const totals = [], spreads = [];
      (e.bookmakers || []).forEach((b) => (b.markets || []).forEach((m) => {
        if (m.key === "totals") { const o = m.outcomes.find((x) => x.name === "Over"); if (o && o.point != null) totals.push(o.point); }
        if (m.key === "spreads") { const h = m.outcomes.find((x) => x.name === e.home_team); if (h && h.point != null) spreads.push(h.point); }
      }));
      const total = avg(totals), sh = avg(spreads);
      const home = abbr(e.home_team), away = abbr(e.away_team);
      return { id: e.id, home, away, commence: e.commence_time, total: total != null ? Math.round(total * 2) / 2 : null, spreadHome: sh != null ? Math.round(sh * 2) / 2 : null,
        impliedHome: total != null && sh != null ? Math.round(((total - sh) / 2) * 10) / 10 : null, impliedAway: total != null && sh != null ? Math.round(((total + sh) / 2) * 10) / 10 : null, books: (e.bookmakers || []).length };
    });
    const props = {};
    let propCredits = null;
    if (wantProps && soon.length) {
      const results = await Promise.all(soon.map(async (e) => {
        try {
          const pr = await fetch(`${BASE}/events/${e.id}/odds?apiKey=${KEY}&regions=us&markets=${PROP_MARKETS}&oddsFormat=american&bookmakers=${BOOKS}`);
          if (!pr.ok) return null;
          propCredits = { remaining: pr.headers.get("x-requests-remaining"), used: pr.headers.get("x-requests-used") };
          return { ev: e, data: await pr.json() };
        } catch (err) { return null; }
      }));
      results.filter(Boolean).forEach(({ ev, data }) => {
        const acc = {};
        (data.bookmakers || []).forEach((b) => (b.markets || []).forEach((m) => (m.outcomes || []).forEach((o) => {
          const name = o.description; if (!name) return;
          const k = norm(name); acc[k] = acc[k] || { name, game: `${abbr(ev.away_team)}@${abbr(ev.home_team)}`, m: {} };
          const slot = acc[k].m[m.key] = acc[k].m[m.key] || { points: [], yes: [] };
          if (m.key === "player_anytime_td") { if (o.name === "Yes" && o.price != null) slot.yes.push(prob(o.price)); }
          else if (o.name === "Over" && o.point != null) slot.points.push(o.point);
        })));
        Object.keys(acc).forEach((k) => {
          const a = acc[k]; const g = (key) => (a.m[key] && a.m[key].points.length ? Math.round(avg(a.m[key].points) * 2) / 2 : null);
          const atd = a.m.player_anytime_td && a.m.player_anytime_td.yes.length ? Math.round(avg(a.m.player_anytime_td.yes) / 1.06 * 1000) / 1000 : null;
          props[k] = { name: a.name, game: a.game, pass_yds: g("player_pass_yds"), pass_tds: g("player_pass_tds"), rush_yds: g("player_rush_yds"), rec_yds: g("player_reception_yds"), rec: g("player_receptions"), atd };
        });
      });
    }
    res.status(200).json({ at: Date.now(), games, props, propsIncluded: wantProps, credits: propCredits || credits });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
