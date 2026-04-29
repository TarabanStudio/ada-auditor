export const runtime = "nodejs";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL required" });

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ADAuditor/1.0)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      return res.status(502).json({ error: `Site returned ${response.status}` });
    }

    const html = await response.text();
    return res.status(200).json({ html: html.slice(0, 20000) });
  } catch (err) {
    return res.status(502).json({ error: err.message || "Fetch failed" });
  }
}
