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
    const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 55000);
    const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" }, body, signal: ctrl.signal });
    clearTimeout(timer);
    const text = await r.text(); let j; try { j = JSON.parse(text); } catch (e) { j = { error: { message: text.slice(0, 300) } }; }
    if (!r.ok) return res.status(r.status).json({ error: (j.error && j.error.message) || `Anthropic ${r.status}` });
    res.status(200).json(j);
  } catch (e) { res.status(504).json({ error: e.name === "AbortError" ? "The Coach took longer than 55 seconds (usually too many web searches). Ask again, or narrow the question." : e.message }); }
};
