// Dimes War Room: Vegas lines + player props from The Odds API, normalized for the app.
// Key lives here server-side only (or in ODDS_API_KEY env var if you add one in Vercel settings).
const KEY = process.env.ODDS_API_KEY || "fa01dbca40e61e4a62f6e42ccd6cafb0";
const BASE = "https://api.the-odds-api.com/v4/sports/americanfootball_nfl";
const BOOKS = "pinnacle,draftkings,fanduel,betmgm"; // Pinnacle is the sharp anchor when present; the three US books are what you can bet
const PROP_MARKETS = "player_pass_yds,player_pass_tds,player_rush_yds,player_reception_yds,player_receptions,player_anytime_td";
const TEAM = { "Arizona Cardinals": "ARI", "Atlanta Falcons": "ATL", "Baltimore Ravens": "BAL", "Buffalo Bills": "BUF", "Carolina Panthers": "CAR", "Chicago Bears": "CHI", "Cincinnati Bengals": "CIN", "Cleveland Browns": "CLE", "Dallas Cowboys": "DAL", "Denver Broncos": "DEN", "Detroit Lions": "DET", "Green Bay Packers": "GB", "Houston Texans": "HOU", "Indianapolis Colts": "IND", "Jacksonville Jaguars": "JAX", "Kansas City Chiefs": "KC", "Los Angeles Chargers": "LAC", "Los Angeles Rams": "LAR", "Las Vegas Raiders": "LV", "Miami Dolphins": "MIA", "Minnesota Vikings": "MIN", "New England Patriots": "NE", "New Orleans Saints": "NO", "New York Giants": "NYG", "New York Jets": "NYJ", "Philadelphia Eagles": "PHI", "Pittsburgh Steelers": "PIT", "Seattle Seahawks": "SEA", "San Francisco 49ers": "SF", "Tampa Bay Buccaneers": "TB", "Tennessee Titans": "TEN", "Washington Commanders": "WAS" };
const abbr = (n) => TEAM[n] || n;
// Home stadiums: [lat, lon, roof]. roof: dome (closed), retract (retractable), open.
const STADIUM = { ARI:[33.5276,-112.2626,"retract"], ATL:[33.7554,-84.4010,"retract"], BAL:[39.2780,-76.6227,"open"], BUF:[42.7738,-78.7870,"open"], CAR:[35.2258,-80.8528,"open"], CHI:[41.8623,-87.6167,"open"], CIN:[39.0955,-84.5161,"open"], CLE:[41.5061,-81.6995,"open"], DAL:[32.7473,-97.0945,"retract"], DEN:[39.7439,-105.0201,"open"], DET:[42.3400,-83.0456,"dome"], GB:[44.5013,-88.0622,"open"], HOU:[29.6847,-95.4107,"retract"], IND:[39.7601,-86.1639,"retract"], JAX:[30.3239,-81.6373,"open"], KC:[39.0489,-94.4839,"open"], LAC:[33.9535,-118.3392,"dome"], LAR:[33.9535,-118.3392,"dome"], LV:[36.0909,-115.1833,"dome"], MIA:[25.9580,-80.2389,"open"], MIN:[44.9738,-93.2575,"dome"], NE:[42.0909,-71.2643,"open"], NO:[29.9511,-90.0812,"dome"], NYG:[40.8135,-74.0745,"open"], NYJ:[40.8135,-74.0745,"open"], PHI:[39.9008,-75.1675,"open"], PIT:[40.4468,-80.0158,"open"], SEA:[47.5952,-122.3316,"open"], SF:[37.4030,-121.9700,"open"], TB:[27.9759,-82.5033,"open"], TEN:[36.1665,-86.7713,"open"], WAS:[38.9076,-76.8645,"open"] };
// 2026 neutral-site games (nflverse schedule): key = away@home
const NEUTRAL = { "SF@LAR":[-37.8200,144.9834,"retract","Melbourne"], "BAL@DAL":[-22.9122,-43.2302,"open","Rio"], "IND@WAS":[51.6043,-0.0664,"open","London"], "HOU@JAX":[51.5560,-0.2795,"open","London"], "PIT@NO":[48.9244,2.3601,"open","Paris"], "CIN@ATL":[40.4531,-3.6883,"retract","Madrid"], "NE@DET":[48.2188,11.6247,"open","Munich"], "MIN@SF":[19.3029,-99.1505,"open","Mexico City"] };
async function weatherFor(home, away, commence) {
  const key = `${away}@${home}`; const site = NEUTRAL[key] || STADIUM[home]; if (!site || !commence) return null;
  const [lat, lon, roof, city] = site; if (roof === "dome") return { roof, city: city || null };
  try {
    const t = new Date(commence); const day = t.toISOString().slice(0, 10);
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation_probability,precipitation,wind_speed_10m,wind_gusts_10m,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=UTC&start_date=${day}&end_date=${day}`);
    if (!r.ok) return { roof, city: city || null };
    const j = await r.json(); const hrs = j.hourly && j.hourly.time ? j.hourly.time : []; if (!hrs.length) return { roof, city: city || null };
    const target = t.toISOString().slice(0, 13); let i = hrs.findIndex((h) => h.startsWith(target)); if (i < 0) i = Math.min(hrs.length - 1, t.getUTCHours());
    const g = (k) => (j.hourly[k] && j.hourly[k][i] != null ? j.hourly[k][i] : null);
    return { roof, city: city || null, temp: g("temperature_2m") != null ? Math.round(g("temperature_2m")) : null, wind: g("wind_speed_10m") != null ? Math.round(g("wind_speed_10m")) : null, gust: g("wind_gusts_10m") != null ? Math.round(g("wind_gusts_10m")) : null, pop: g("precipitation_probability"), precip: g("precipitation"), code: g("weather_code") };
  } catch (e) { return { roof, city: city || null }; }
}
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
  try {
    const r = await fetch(`${BASE}/odds?apiKey=${KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american&bookmakers=${BOOKS}`);
    if (!r.ok) throw new Error(`Odds API ${r.status}: ${(await r.text()).slice(0, 200)}`);
    const credits = { remaining: r.headers.get("x-requests-remaining"), used: r.headers.get("x-requests-used"), last: r.headers.get("x-requests-last") };
    const events = await r.json();
    const now = Date.now();
    const soon = events.filter((e) => new Date(e.commence_time).getTime() < now + days * 864e5 && new Date(e.commence_time).getTime() > now - 6 * 3600e3);
    const games = soon.map((e) => {
      const totals = [], spreads = [], mlH = [], mlA = [], ov = [], un = []; const bk = {};
      (e.bookmakers || []).forEach((b) => { const rec = bk[b.key] = bk[b.key] || {}; (b.markets || []).forEach((m) => {
        if (m.key === "totals") { const o = m.outcomes.find((x) => x.name === "Over"); const u = m.outcomes.find((x) => x.name === "Under"); if (o && o.point != null) { totals.push(o.point); rec.tot = o.point; } if (o && o.price != null) { ov.push(prob(o.price)); rec.oP = Math.round(prob(o.price) * 1000) / 1000; } if (u && u.price != null) { un.push(prob(u.price)); rec.uP = Math.round(prob(u.price) * 1000) / 1000; } }
        if (m.key === "spreads") { const h = m.outcomes.find((x) => x.name === e.home_team), a = m.outcomes.find((x) => x.name === e.away_team); if (h && h.point != null) { spreads.push(h.point); rec.sh = h.point; } if (h && h.price != null) rec.shP = Math.round(prob(h.price) * 1000) / 1000; if (a && a.price != null) rec.saP = Math.round(prob(a.price) * 1000) / 1000; }
        if (m.key === "h2h") { const h = m.outcomes.find((x) => x.name === e.home_team), a = m.outcomes.find((x) => x.name === e.away_team); if (h && h.price != null) { mlH.push(prob(h.price)); rec.mlH = Math.round(prob(h.price) * 1000) / 1000; } if (a && a.price != null) { mlA.push(prob(a.price)); rec.mlA = Math.round(prob(a.price) * 1000) / 1000; } }
      }); });
      const pin = bk.pinnacle || null;
      const total = pin && pin.tot != null ? pin.tot : avg(totals), sh = pin && pin.sh != null ? pin.sh : avg(spreads); const ph = pin && pin.mlH != null ? pin.mlH : avg(mlH), pa = pin && pin.mlA != null ? pin.mlA : avg(mlA);
      const winHome = ph != null && pa != null ? Math.round((ph / (ph + pa)) * 1000) / 1000 : null;
      const home = abbr(e.home_team), away = abbr(e.away_team);
      return { id: e.id, home, away, commence: e.commence_time, total: total != null ? Math.round(total * 2) / 2 : null, spreadHome: sh != null ? Math.round(sh * 2) / 2 : null, winHome,
        overP: ov.length ? Math.round(avg(ov) * 1000) / 1000 : null, underP: un.length ? Math.round(avg(un) * 1000) / 1000 : null,
        impliedHome: total != null && sh != null ? Math.round(((total - sh) / 2) * 10) / 10 : null, impliedAway: total != null && sh != null ? Math.round(((total + sh) / 2) * 10) / 10 : null, books: (e.bookmakers || []).length, anchor: pin ? "pinnacle" : "consensus", bk };
    });
    const wx = await Promise.all(games.map((g) => weatherFor(g.home, g.away, g.commence)));
    games.forEach((g, i) => { g.wx = wx[i]; });
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
          const k = norm(name); acc[k] = acc[k] || { name, game: `${abbr(ev.away_team)}@${abbr(ev.home_team)}`, m: {}, bk: {} };
          const bb = acc[k].bk[b.key] = acc[k].bk[b.key] || {}; const fld = { player_pass_yds: "pass_yds", player_pass_tds: "pass_tds", player_rush_yds: "rush_yds", player_reception_yds: "rec_yds", player_receptions: "rec", player_anytime_td: "atd" }[m.key];
          if (fld === "atd") { if (o.name === "Yes" && o.price != null) bb.atd = Math.round(prob(o.price) * 1000) / 1000; }
          else if (fld) { const cell = bb[fld] = bb[fld] || [null, null, null]; if (o.name === "Over") { if (o.point != null) cell[0] = o.point; if (o.price != null) cell[1] = Math.round(prob(o.price) * 1000) / 1000; } if (o.name === "Under" && o.price != null) cell[2] = Math.round(prob(o.price) * 1000) / 1000; }
          const slot = acc[k].m[m.key] = acc[k].m[m.key] || { points: [], yes: [], over: [], under: [] };
          if (m.key === "player_anytime_td") { if (o.name === "Yes" && o.price != null) slot.yes.push(prob(o.price)); }
          else if (o.name === "Over" && o.point != null) { slot.points.push(o.point); if (o.price != null) slot.over.push(prob(o.price)); }
          else if (o.name === "Under" && o.price != null) slot.under.push(prob(o.price));
        })));
        Object.keys(acc).forEach((k) => {
          const a = acc[k]; const g = (key) => (a.m[key] && a.m[key].points.length ? Math.round(avg(a.m[key].points) * 2) / 2 : null);
          const pr = (key, side) => (a.m[key] && a.m[key][side] && a.m[key][side].length ? Math.round(avg(a.m[key][side]) * 1000) / 1000 : null);
          const atdRaw = a.m.player_anytime_td && a.m.player_anytime_td.yes.length ? avg(a.m.player_anytime_td.yes) : null;
          const atd = atdRaw != null ? Math.round(atdRaw / 1.06 * 1000) / 1000 : null;
          props[k] = { name: a.name, game: a.game, pass_yds: g("player_pass_yds"), pass_tds: g("player_pass_tds"), rush_yds: g("player_rush_yds"), rec_yds: g("player_reception_yds"), rec: g("player_receptions"), atd,
            px: { pass_yds: [pr("player_pass_yds", "over"), pr("player_pass_yds", "under")], pass_tds: [pr("player_pass_tds", "over"), pr("player_pass_tds", "under")], rush_yds: [pr("player_rush_yds", "over"), pr("player_rush_yds", "under")], rec_yds: [pr("player_reception_yds", "over"), pr("player_reception_yds", "under")], rec: [pr("player_receptions", "over"), pr("player_receptions", "under")], atd: atdRaw != null ? Math.round(atdRaw * 1000) / 1000 : null }, bk: a.bk };
        });
      });
    }
    res.status(200).json({ at: Date.now(), games, props, propsIncluded: wantProps, credits: propCredits || credits });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
