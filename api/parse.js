// Turns a pasted text or a screenshot from Yahoo into structured data using Claude (needs ANTHROPIC_API_KEY).
// kinds: transactions | scores | lineup | roster
const PROMPTS = {
  transactions: `You read Yahoo Fantasy transaction logs. Return ONLY a JSON array. Each item: {"date":"Sep 7","team":"<fantasy team name exactly as shown>","action":"add"|"drop"|"trade","player":"<full player name>","pos":"QB|RB|WR|TE|K|DEF","nfl":"<NFL abbreviation like DET, SF, LV>","to":"<receiving fantasy team for trades, else null>"}. For defenses use the team nickname as player (e.g. "Raiders") and pos "DEF". One item per player moved. No prose.`,
  scores: `You read Yahoo Fantasy scoreboards or standings. Return ONLY a JSON array of matchups: {"week":<number or null>,"a":"<fantasy team name>","sa":<score as number or null>,"b":"<fantasy team name>","sb":<score or null>}. If the page shows a standings table instead, return {"standings":[{"team":"<name>","w":<wins>,"l":<losses>,"t":<ties>,"pf":<points for>,"pa":<points against>}]} . No prose.`,
  lineup: `You read a Yahoo Fantasy roster page. Return ONLY JSON: {"starters":[{"slot":"QB|RB|WR|TE|FLEX|K|DEF","player":"<full name as shown, expand abbreviated first names if obvious>","pos":"QB|RB|WR|TE|K|DEF","nfl":"<NFL abbr>","status":"<Q|D|O|IR|IR-R|CEL|null>"}],"bench":[same shape without slot],"ir":[same shape]}. Slot labels W/R/T or FLEX mean FLEX. No prose.`,
  roster: `You read a Yahoo Fantasy roster page for one team. Return ONLY JSON: {"team":"<fantasy team name if visible else null>","players":[{"player":"<full name>","pos":"QB|RB|WR|TE|K|DEF","nfl":"<NFL abbr>","status":"<Q|D|O|IR|null>"}]}. Include starters, bench and IR. No prose.`,
};
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const key = process.env.ANTHROPIC_API_KEY; if (!key) return res.status(501).json({ error: "Screenshot reading needs ANTHROPIC_API_KEY in Vercel." });
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const kind = body.kind; if (!PROMPTS[kind]) return res.status(400).json({ error: "Unknown kind" });
    const content = [];
    if (body.image) content.push({ type: "image", source: { type: "base64", media_type: body.mediaType || "image/jpeg", data: body.image } });
    if (body.text) content.push({ type: "text", text: "Pasted text:\n" + String(body.text).slice(0, 20000) });
    content.push({ type: "text", text: `Extract the ${kind} data now. Output JSON only.` });
    const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" }, body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 4000, system: PROMPTS[kind], messages: [{ role: "user", content }] }) });
    const text = await r.text(); let j; try { j = JSON.parse(text); } catch (e) { return res.status(502).json({ error: text.slice(0, 200) }); }
    if (!r.ok) return res.status(r.status).json({ error: (j.error && j.error.message) || `Anthropic ${r.status}` });
    const out = (j.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").replace(/```json|```/g, "").trim();
    let data; try { data = JSON.parse(out); } catch (e) { const m = out.match(/[\[{][\s\S]*[\]}]/); if (!m) return res.status(422).json({ error: "Could not read that. Try a clearer screenshot or paste the text." }); data = JSON.parse(m[0]); }
    res.status(200).json({ kind, data, usage: j.usage || null });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
