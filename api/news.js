// League-wide news: ESPN NFL headlines plus Google News RSS per NFL team (local beat coverage) and per requested player. No keys. Cached one hour.
const TEAMS = { ARI: "Arizona Cardinals", ATL: "Atlanta Falcons", BAL: "Baltimore Ravens", BUF: "Buffalo Bills", CAR: "Carolina Panthers", CHI: "Chicago Bears", CIN: "Cincinnati Bengals", CLE: "Cleveland Browns", DAL: "Dallas Cowboys", DEN: "Denver Broncos", DET: "Detroit Lions", GB: "Green Bay Packers", HOU: "Houston Texans", IND: "Indianapolis Colts", JAX: "Jacksonville Jaguars", KC: "Kansas City Chiefs", LAC: "Los Angeles Chargers", LAR: "Los Angeles Rams", LV: "Las Vegas Raiders", MIA: "Miami Dolphins", MIN: "Minnesota Vikings", NE: "New England Patriots", NO: "New Orleans Saints", NYG: "New York Giants", NYJ: "New York Jets", PHI: "Philadelphia Eagles", PIT: "Pittsburgh Steelers", SEA: "Seattle Seahawks", SF: "San Francisco 49ers", TB: "Tampa Bay Buccaneers", TEN: "Tennessee Titans", WAS: "Washington Commanders" };
const strip = (s) => (s || "").replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
function parseRss(xml, tag) {
  const items = []; const re = /<item>([\s\S]*?)<\/item>/g; let m;
  while ((m = re.exec(xml)) && items.length < 25) { const b = m[1]; const g = (t) => { const mm = b.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)<\\/${t}>`)); return mm ? strip(mm[1]) : ""; };
    let title = g("title"); let src = g("source"); const mm = title.match(/ - ([^-]+)$/); if (mm) { if (!src) src = mm[1].trim(); if (title.endsWith(" - " + src)) title = title.slice(0, -(src.length + 3)); }
    items.push({ title, link: g("link"), ts: Date.parse(g("pubDate")) || 0, src, tag }); }
  return items;
}
async function gnews(q, tag) { try { const r = await fetch(`https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`, { headers: { "User-Agent": "Mozilla/5.0" } }); if (!r.ok) return []; return parseRss(await r.text(), tag); } catch (e) { return []; } }
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=900");
  if (req.method === "OPTIONS") return res.status(200).end();
  const players = String((req.query || {}).players || "").split(",").map((x) => x.trim()).filter(Boolean).slice(0, 30);
  const out = { at: Date.now(), items: [], sources: [] };
  try { const r = await fetch("https://site.api.espn.com/apis/site/v2/sports/football/nfl/news?limit=60"); if (r.ok) { const j = await r.json(); (j.articles || []).forEach((a) => { out.items.push({ title: a.headline, desc: a.description || "", link: (a.links && a.links.web && a.links.web.href) || "", ts: Date.parse(a.published || a.lastModified) || 0, src: "ESPN", tag: "nfl", teams: (a.categories || []).filter((c) => c.type === "team" && c.team && c.team.abbreviation).map((c) => c.team.abbreviation), athletes: (a.categories || []).filter((c) => c.type === "athlete" && c.description).map((c) => c.description) }); }); out.sources.push("ESPN"); } } catch (e) { /* skip */ }
  const cutoff = Date.now() - 4 * 86400e3;
  const teamJobs = Object.keys(TEAMS).map((ab) => gnews(`"${TEAMS[ab]}" (injury OR injured OR practice OR "depth chart" OR questionable OR "ruled out" OR trade OR signed OR released OR starter) when:3d`, ab));
  const playerJobs = players.map((n) => gnews(`"${n}" NFL when:3d`, "player:" + n));
  const results = await Promise.all([...teamJobs, ...playerJobs]);
  const seen = new Set(out.items.map((x) => x.title));
  results.flat().forEach((it) => { if (!it.title || it.ts < cutoff || seen.has(it.title)) return; seen.add(it.title); out.items.push({ title: it.title, desc: "", link: it.link, ts: it.ts, src: it.src || "Google News", tag: it.tag.startsWith("player:") ? "player" : "team", teams: it.tag.startsWith("player:") ? [] : [it.tag], athletes: it.tag.startsWith("player:") ? [it.tag.slice(7)] : [] }); });
  out.items.sort((a, b) => b.ts - a.ts); out.items = out.items.slice(0, 400); out.sources.push("Google News (local and national outlets)");
  res.status(200).json(out);
};
