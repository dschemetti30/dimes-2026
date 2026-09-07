// Proxies Coach requests to Anthropic when ANTHROPIC_API_KEY is set in Vercel project settings.
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(501).json({ error: "Coach on the web needs ANTHROPIC_API_KEY set in the Vercel project settings. Coach still works inside the Claude app." });
  try {
    const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
    const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" }, body });
    const j = await r.json();
    res.status(r.status).json(j);
  } catch (e) { res.status(500).json({ error: e.message }); }
};
