export const runtime = "nodejs";

const AUDIT_SYSTEM_PROMPT = `You are an expert ADA/WCAG 2.1 accessibility auditor. You will be given HTML content from a webpage and must identify accessibility violations.

Analyze the HTML for these specific issues:
1. Images: Missing or empty alt attributes on img tags
2. Forms: Input fields missing associated label elements or aria-label
3. Headings: Missing H1, or heading hierarchy that skips levels
4. Links: Links with vague text like "click here", "read more", "here"
5. Language: Missing lang attribute on html tag
6. Skip Navigation: No skip-to-content link near the top
7. ARIA Landmarks: Missing semantic elements like nav, main, header, footer or role attributes
8. PDFs: Any links to .pdf files (these require separate remediation)
9. Videos/Media: Any video or iframe without captions mentioned
10. Buttons: button or anchor tags used as buttons with no accessible label
11. Tables: Tables missing caption or th scope attributes
12. Color contrast: Any inline styles suggesting poor contrast

Respond ONLY with a valid JSON object. No markdown, no backticks, no explanation. Use this exact structure:
{
  "score": <number 0-100>,
  "severity": "<critical|high|moderate|low>",
  "summary": "<2-3 sentence plain-language summary>",
  "violations": [
    {
      "id": "<short_id>",
      "category": "<category name>",
      "wcag": "<e.g. 1.1.1>",
      "issue": "<clear description>",
      "impact": "<critical|serious|moderate|minor>",
      "example": "<actual HTML snippet or 'Multiple instances found'>",
      "fix": "<brief fix description>"
    }
  ],
  "pdfCount": <number>,
  "opportunityScore": "<high|medium|low>",
  "pitchAngle": "<1-2 sentence outreach hook for this specific site>"
}`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { html, label } = req.body;
  if (!html) return res.status(400).json({ error: "HTML required" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        system: AUDIT_SYSTEM_PROMPT,
        messages: [{ role: "user", content: `Audit this HTML from "${label || "Unknown page"}":\n\n${html.slice(0, 15000)}` }],
      }),
    });

    const data = await response.json();
    const raw = data.content?.find(b => b.type === "text")?.text || "";
    const clean = raw.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message || "Audit failed" });
  }
}
