// Daily player health + roster status from nflverse (official injury reports and roster files). No key needed.
const ROSTER = "https://github.com/nflverse/nflverse-data/releases/download/rosters/roster_2026.csv";
const INJ = "https://github.com/nflverse/nflverse-data/releases/download/injuries/injuries_2026.csv";
const POS = new Set(["QB", "RB", "WR", "TE", "K"]);
const TM = { LA: "LAR" };
function parseCsv(text) {
  const rows = []; let row = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) { const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; } else field += c; }
    else if (c === '"') q = true; else if (c === ",") { row.push(field); field = ""; } else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; } else if (c !== "\r") field += c; }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  const hdr = rows.shift(); return rows.filter((r) => r.length > 1).map((r) => Object.fromEntries(hdr.map((h, i) => [h, r[i]])));
}
const norm = (n) => (n || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/['.]/g, "").replace(/\b(jr|sr|ii|iii|iv|v)\b/g, "").replace(/[^a-z0-9]+/g, "");
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "s-maxage=21600, stale-while-revalidate=3600");
  if (req.method === "OPTIONS") return res.status(200).end();
  try {
    const [rr, ir] = await Promise.all([fetch(ROSTER), fetch(INJ)]);
    if (!rr.ok) throw new Error(`roster ${rr.status}`);
    const roster = parseCsv(await rr.text()).filter((r) => POS.has(r.position));
    const latestWeek = Math.max(0, ...roster.map((r) => parseInt(r.week || "0", 10) || 0));
    const status = {};
    roster.filter((r) => (parseInt(r.week || "0", 10) || 0) === latestWeek).forEach((r) => { status[norm(r.full_name) + "|" + r.position] = { st: r.status, dc: r.depth_chart_position || null, team: TM[r.team] || r.team }; });
    let injuries = [], injWeek = null;
    if (ir.ok) {
      const inj = parseCsv(await ir.text()).filter((r) => POS.has(r.position) && r.season_type === "REG");
      injWeek = Math.max(0, ...inj.map((r) => parseInt(r.week || "0", 10) || 0));
      injuries = inj.filter((r) => (parseInt(r.week || "0", 10) || 0) === injWeek).map((r) => ({ k: norm(r.full_name) + "|" + r.position, name: r.full_name, team: TM[r.team] || r.team, pos: r.position, status: r.report_status || null, injury: r.practice_primary_injury || null, practice: r.practice_status || null }));
    }
    res.status(200).json({ at: Date.now(), rosterWeek: latestWeek, injWeek, status, injuries, source: "nflverse official injury reports and roster files" });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
