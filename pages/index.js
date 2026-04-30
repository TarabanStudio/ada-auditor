import { useState, useRef } from "react";

const C = {
  blue: "#4a7a8a",
  blueDark: "#3a6070",
  blueLight: "#6a9aaa",
  cream: "#f5f2eb",
  creamDark: "#ede9e0",
  gold: "#e8c96a",
  goldDark: "#c8a94a",
  white: "#ffffff",
  text: "#2c2c2c",
  textLight: "#5a6a6f",
  border: "#d8d0c0",
};

const impactConfig = {
  critical: { bg: "#fef2f2", text: "#8b1a1a", border: "#f5b8b8", dot: "#cc2222" },
  serious:  { bg: "#fff8f0", text: "#8b4a12", border: "#f5c896", dot: "#d97020" },
  moderate: { bg: "#fffef0", text: "#7a6010", border: "#e8d870", dot: "#b89820" },
  minor:    { bg: "#f0f8f4", text: "#1a6040", border: "#90d8b0", dot: "#208050" },
};

const oppConfig = {
  high:   { label: "Strong Prospect", color: "#208050", bg: "#f0f8f4" },
  medium: { label: "Worth Outreach",  color: "#b07020", bg: "#fffaf0" },
  low:    { label: "Minor Issues",    color: "#5a6a6f", bg: "#f5f5f5" },
};

function scoreColor(s) {
  if (s >= 80) return "#208050";
  if (s >= 60) return "#b07020";
  if (s >= 40) return "#d97020";
  return "#cc2222";
}

function Star({ size = 20, color = C.gold }) {
  const arms = 8;
  const points = [];
  for (let i = 0; i < arms * 2; i++) {
    const angle = (i * Math.PI) / arms - Math.PI / 2;
    const r = i % 2 === 0 ? size / 2 : size / 5;
    points.push((size / 2 + r * Math.cos(angle)).toFixed(2) + "," + (size / 2 + r * Math.sin(angle)).toFixed(2));
  }
  return (
    <svg width={size} height={size} viewBox={"0 0 " + size + " " + size} style={{ display: "inline-block", flexShrink: 0 }}>
      <polygon points={points.join(" ")} fill={color} />
    </svg>
  );
}

function ScoreRing({ score, size = 90 }) {
  const r = size * 0.38, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = scoreColor(score);
  const cx = size / 2, cy = size / 2;
  return (
    <svg width={size} height={size} viewBox={"0 0 " + size + " " + size}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.creamDark} strokeWidth={size * 0.08} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={size * 0.08}
        strokeDasharray={dash + " " + (circ - dash)} strokeLinecap="round"
        transform={"rotate(-90 " + cx + " " + cy + ")"} style={{ transition: "stroke-dasharray 1.2s ease" }} />
      <text x={cx} y={cy - 2} textAnchor="middle" fontSize={size * 0.22} fontWeight="400"
        fill={color} fontFamily="'Cormorant Garamond', Georgia, serif">{score}</text>
      <text x={cx} y={cy + size * 0.18} textAnchor="middle" fontSize={size * 0.12} fill={C.textLight}
        fontFamily="Georgia, serif">/100</text>
    </svg>
  );
}

// Groups violations by category and deduplicates
function groupViolations(violations) {
  const grouped = {};
  violations.forEach(v => {
    const key = v.category + "_" + v.impact;
    if (!grouped[key]) {
      grouped[key] = { ...v, count: 1 };
    } else {
      grouped[key].count++;
    }
  });
  return Object.values(grouped);
}

function ViolationCard({ v }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = impactConfig[v.impact] || impactConfig.minor;
  const isSkipNav = v.category && v.category.toLowerCase().includes("skip");
  
  return (
    <div onClick={() => setExpanded(o => !o)} style={{
      border: "1px solid " + (expanded ? cfg.border : C.border),
      borderRadius: 3, marginBottom: 8, cursor: "pointer",
      background: expanded ? cfg.bg : C.white,
      transition: "all 0.2s ease", overflow: "hidden",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
        <div style={{ width: 9, height: 9, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <span style={{ fontWeight: 600, fontSize: 16, color: C.text, fontFamily: "Georgia, serif" }}>
            {v.category}
            {v.count > 1 ? " (" + v.count + " instances)" : ""}
          </span>
          <span style={{ marginLeft: 10, fontSize: 12, padding: "2px 8px", borderRadius: 2, background: cfg.bg, color: cfg.text, border: "1px solid " + cfg.border, fontFamily: "monospace" }}>
            WCAG {v.wcag}
          </span>
          {isSkipNav && (
            <span style={{ marginLeft: 8, fontSize: 11, padding: "2px 8px", borderRadius: 2, background: "#f0f0ff", color: "#4444aa", border: "1px solid #aaaadd" }}>
              Platform limitation
            </span>
          )}
        </div>
        <span style={{ fontSize: 12, color: cfg.text, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{v.impact}</span>
        <span style={{ color: C.textLight, fontSize: 14, marginLeft: 8 }}>{expanded ? "▲" : "▼"}</span>
      </div>
      {expanded && (
        <div style={{ padding: "0 16px 16px", borderTop: "1px solid " + cfg.border }}>
          <p style={{ margin: "12px 0 10px", fontSize: 16, color: C.text, lineHeight: 1.7, fontFamily: "Georgia, serif" }}>{v.issue}</p>
          {isSkipNav && (
            <div style={{ background: "#f0f0ff", border: "1px solid #aaaadd", borderRadius: 3, padding: "10px 14px", fontSize: 16, color: "#333366", marginBottom: 10, fontFamily: "Georgia, serif" }}>
              <strong>Note:</strong> Squarespace includes a skip navigation link by default, but it may not function correctly in all templates due to platform limitations. Custom code injection may be required for full compliance.
            </div>
          )}
          <div style={{ background: "#fff8f0", border: "1px solid " + C.border, borderRadius: 3, padding: "10px 14px", fontSize: 16, color: C.text, fontFamily: "Georgia, serif" }}>
            <strong>🔒 Full remediation details available in the paid report.</strong> Contact us to receive a complete page-by-page fix guide.
          </div>
        </div>
      )}
    </div>
  );
}

function PageResult({ page }) {
  const [open, setOpen] = useState(false);
  const opp = oppConfig[page.result?.opportunityScore] || oppConfig.low;
  const grouped = page.result?.violations ? groupViolations(page.result.violations) : [];

  return (
    <div style={{ border: "1px solid " + C.border, borderRadius: 3, marginBottom: 12, background: C.white, overflow: "hidden" }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: 18, padding: "16px 20px", cursor: "pointer" }}>
        <ScoreRing score={page.result?.score ?? 0} size={64} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text, fontFamily: "Georgia, serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{page.label}</div>
          <div style={{ fontSize: 14, color: C.textLight, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{page.url}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <span style={{ padding: "4px 10px", borderRadius: 2, fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", background: opp.bg, color: opp.color }}>{opp.label}</span>
            <span style={{ padding: "4px 10px", borderRadius: 2, fontSize: 12, background: C.creamDark, color: C.textLight }}>{grouped.length} issue types found</span>
            {page.result?.pdfCount > 0 && <span style={{ padding: "4px 10px", borderRadius: 2, fontSize: 12, background: "#fff8f0", color: "#8b4a12" }}>{page.result.pdfCount} PDFs</span>}
          </div>
        </div>
        <span style={{ color: C.textLight, fontSize: 16, flexShrink: 0 }}>{open ? "▲" : "▼"}</span>
      </div>

      {open && page.result && (
        <div style={{ borderTop: "1px solid " + C.border, padding: "18px 20px", background: C.cream }}>
          <p style={{ margin: "0 0 16px", fontSize: 16, color: C.text, lineHeight: 1.75, fontFamily: "Georgia, serif" }}>{page.result.summary}</p>
          {grouped.length === 0
            ? <div style={{ padding: "12px 16px", background: "#f0f8f4", borderRadius: 3, fontSize: 16, color: "#1a6040", fontFamily: "Georgia, serif" }}>No violations found on this page.</div>
            : grouped.map((v, i) => <ViolationCard key={i} v={v} />)
          }
          {page.result.pitchAngle && (
            <div style={{ marginTop: 16, padding: "16px 18px", background: C.white, borderLeft: "3px solid " + C.gold, fontSize: 16, color: C.text, fontStyle: "italic", lineHeight: 1.8, fontFamily: "Georgia, serif" }}>
              "{page.result.pitchAngle}"
            </div>
          )}
        </div>
      )}
      {open && page.error && (
        <div style={{ borderTop: "1px solid " + C.border, padding: "14px 20px", background: "#fef2f2" }}>
          <span style={{ fontSize: 16, color: "#8b1a1a", fontFamily: "Georgia, serif" }}>Could not audit this page: {page.error}</span>
        </div>
      )}
    </div>
  );
}

function AccordionItem({ question, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid " + C.border }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 0", cursor: "pointer" }}>
        <span style={{ fontSize: 20, color: C.blue, fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}>{question}</span>
        <span style={{ fontSize: 22, color: C.textLight, marginLeft: 20, flexShrink: 0 }}>{open ? "−" : "+"}</span>
      </div>
      {open && (
        <div style={{ paddingBottom: 24, fontSize: 16, color: C.text, lineHeight: 1.85, fontFamily: "Georgia, serif", animation: "fadeIn 0.2s ease" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function getPageLabel(url) {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/$/, "") || "/";
    if (path === "/") return "Home";
    return path.split("/").filter(Boolean).pop().replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  } catch { return url; }
}

async function serverFetch(url) {
  const res = await fetch("/api/fetch-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.html;
}

async function serverAudit(html, label) {
  const res = await fetch("/api/audit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ html, label }) });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

async function extractUrlsFromSitemap(xml, baseHost) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");
  const sitemapLocs = [...doc.querySelectorAll("sitemap loc")].map(el => el.textContent.trim());
  if (sitemapLocs.length > 0) {
    try {
      const childXml = await serverFetch(sitemapLocs[0]);
      const childDoc = parser.parseFromString(childXml, "text/xml");
      return [...childDoc.querySelectorAll("url loc")].map(el => el.textContent.trim()).filter(u => u.includes(baseHost));
    } catch { return []; }
  }
  return [...doc.querySelectorAll("url loc")].map(el => el.textContent.trim()).filter(u => u.includes(baseHost));
}

export default function ADAAgent() {
  const [mode, setMode] = useState("url");
  const [url, setUrl] = useState("");
  const [pastedHtml, setPastedHtml] = useState("");
  const [pasteLabel, setPasteLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState("");
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [pages, setPages] = useState([]);
  const [siteScore, setSiteScore] = useState(null);
  const [totalPdfs, setTotalPdfs] = useState(0);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [combinedPitch, setCombinedPitch] = useState("");
  const abortRef = useRef(false);

  function resetResults() { setError(""); setPages([]); setSiteScore(null); setTotalPdfs(0); setCombinedPitch(""); }

  async function runPasteAudit() {
    if (!pastedHtml.trim()) return;
    resetResults(); setLoading(true); setStage("Analyzing pasted HTML…");
    const label = pasteLabel.trim() || "Pasted Page";
    try {
      const result = await serverAudit(pastedHtml, label);
      setPages([{ url: label, label, result, error: null }]);
      setSiteScore(result.score); setTotalPdfs(result.pdfCount || 0); setCombinedPitch(result.pitchAngle || "");
    } catch (e) { setError(e.message || "Analysis failed."); }
    setLoading(false); setStage("");
  }

  async function runFullAudit() {
    resetResults(); abortRef.current = false;
    let cleanUrl = url.trim();
    if (!cleanUrl) return;
    if (!cleanUrl.startsWith("http")) cleanUrl = "https://" + cleanUrl;
    let baseHost;
    try { baseHost = new URL(cleanUrl).hostname; } catch { setError("Invalid URL."); return; }
    setLoading(true); setStage("Looking for sitemap…");
    let pageUrls = [];
    for (const sUrl of ["https://" + baseHost + "/sitemap.xml", "https://" + baseHost + "/sitemap_index.xml", "https://" + baseHost + "/page-sitemap.xml"]) {
      try { const xml = await serverFetch(sUrl); const found = await extractUrlsFromSitemap(xml, baseHost); if (found.length > 0) { pageUrls = found; break; } } catch { continue; }
    }
    if (pageUrls.length === 0) { setStage("No sitemap — auditing homepage…"); pageUrls = [cleanUrl]; }
    const skipPatterns = ["divider", "sonora", "light-life", "living-book", "resplendent", "folder", "config", "cart", "account", "search"];
    pageUrls = pageUrls.filter(u => !skipPatterns.some(p => u.toLowerCase().includes(p)));
    pageUrls = pageUrls.slice(0, 10);
    setProgress({ current: 0, total: pageUrls.length });
    const results = [];
    for (let i = 0; i < pageUrls.length; i++) {
      if (abortRef.current) break;
      const pageUrl = pageUrls[i];
      const label = getPageLabel(pageUrl);
      setStage("Auditing: " + label + " (" + (i + 1) + "/" + pageUrls.length + ")");
      setProgress({ current: i + 1, total: pageUrls.length });
      let pageResult = null, pageError = null;
      try { const html = await serverFetch(pageUrl); pageResult = await serverAudit(html, label); } catch (e) { pageError = e.message || "Failed"; }
      results.push({ url: pageUrl, label, result: pageResult, error: pageError });
      setPages([...results]);
    }
    const scored = results.filter(r => r.result?.score != null);
    if (scored.length > 0) {
      setSiteScore(Math.round(scored.reduce((s, r) => s + r.result.score, 0) / scored.length));
      setTotalPdfs(scored.reduce((s, r) => s + (r.result.pdfCount || 0), 0));
      const allV = scored.flatMap(r => r.result.violations || []);
      const topIssues = [...new Set(allV.map(v => v.category))].slice(0, 3).join(", ");
      setCombinedPitch(scored.map(r => r.result.pitchAngle).filter(Boolean)[0] || "This site has accessibility violations across " + scored.length + " pages, including issues with " + (topIssues || "multiple WCAG criteria") + ".");
    }
    setLoading(false); setStage("");
  }

  const progressPct = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;
  const canRun = mode === "url" ? url.trim().length > 0 : pastedHtml.trim().length > 0;

  const auditCategories = [
    { title: "Images, Charts & Maps", desc: "Missing or empty alt text, decorative images not properly hidden, charts and maps without text alternatives" },
    { title: "Page Structure", desc: "Heading hierarchy (H1–H3), language declaration, skip-to-content navigation" },
    { title: "Navigation & Links", desc: "Vague link text such as 'click here' or 'read more,' buttons without accessible labels" },
    { title: "Forms", desc: "Input fields missing labels, no error identification or instructions for users" },
    { title: "Landmarks & Regions", desc: "Missing semantic HTML elements — nav, main, header, footer — and ARIA landmark roles" },
    { title: "Color & Contrast", desc: "Inline styles with poor color contrast ratios that make text difficult to read" },
    { title: "Documents & PDFs", desc: "PDF files linked from the page that require their own separate remediation process" },
    { title: "Tables & Data", desc: "Tables missing captions, header scope attributes, or data not readable by screen readers" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontFamily: "Georgia, serif", paddingBottom: 80 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; }
        ::placeholder { color: #8a9ea3; font-size: 16px; }
        a { color: inherit; }
        body { font-size: 16px; }
      `}</style>

      {/* Header */}
      <div style={{ background: C.blue, padding: "36px 24px 32px", textAlign: "center", borderBottom: "2px solid " + C.blueDark }}>
        <div style={{ marginBottom: 14 }}>
          <Star size={32} color={C.gold} />
        </div>
        <h1 style={{ margin: "0 0 12px", fontSize: 48, color: C.white, fontWeight: 600, fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: "0.06em", lineHeight: 1.1 }}>
          ADA Accessibility Audit
        </h1>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.7)", fontSize: 18, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Sitemap Crawl &nbsp;·&nbsp; Page-by-Page Analysis &nbsp;·&nbsp; Compliance Report
        </p>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 28px" }}>

        {/* Bold intro */}
        <div style={{ textAlign: "center", padding: "48px 20px 40px" }}>
          <p style={{ fontSize: 22, color: C.text, lineHeight: 1.85, fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600, maxWidth: 680, margin: "0 auto" }}>
            Every website deserves to be experienced by everyone. Enter any URL below to receive a free accessibility score and a page-by-page breakdown of WCAG 2.1 violations.
          </p>
        </div>

        {/* Input card */}
        <div style={{ background: C.white, border: "1px solid " + C.border, padding: "28px 28px 24px", marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "1px solid " + C.border }}>
            {[{ id: "url", label: "Enter URL" }, { id: "paste", label: "Paste HTML" }].map(({ id, label }) => (
              <button key={id} onClick={() => { setMode(id); resetResults(); }} style={{
                padding: "10px 22px", border: "none", borderBottom: mode === id ? "2px solid " + C.blue : "2px solid transparent",
                background: "none", color: mode === id ? C.blue : C.textLight,
                fontSize: 16, fontFamily: "Georgia, serif", cursor: "pointer",
                fontWeight: mode === id ? 700 : 400, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: -1,
              }}>{label}</button>
            ))}
          </div>

          {mode === "url" ? (
            <>
              <label style={{ display: "block", fontSize: 14, color: C.textLight, marginBottom: 10, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700 }}>Website URL</label>
              <div style={{ display: "flex", gap: 12 }}>
                <input value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && !loading && runFullAudit()} placeholder="e.g. yourbusiness.com"
                  style={{ flex: 1, padding: "14px 16px", border: "1px solid " + C.border, fontSize: 16, fontFamily: "Georgia, serif", outline: "none", background: C.cream, color: C.text, borderRadius: 2 }} />
                {!loading
                  ? <button onClick={runFullAudit} disabled={!canRun} style={{ padding: "14px 28px", border: "none", cursor: !canRun ? "not-allowed" : "pointer", background: !canRun ? C.textLight : C.blue, color: C.white, fontSize: 16, fontFamily: "Georgia, serif", whiteSpace: "nowrap", letterSpacing: "0.06em", textTransform: "uppercase", borderRadius: 2, fontWeight: 700 }}>Audit Site</button>
                  : <button onClick={() => { abortRef.current = true; setLoading(false); }} style={{ padding: "14px 28px", border: "none", cursor: "pointer", background: "#cc2222", color: C.white, fontSize: 16, fontFamily: "Georgia, serif", letterSpacing: "0.06em", textTransform: "uppercase", borderRadius: 2, fontWeight: 700 }}>Stop</button>
                }
              </div>
            </>
          ) : (
            <>
              <label style={{ display: "block", fontSize: 14, color: C.textLight, marginBottom: 10, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700 }}>Page Name (optional)</label>
              <input value={pasteLabel} onChange={e => setPasteLabel(e.target.value)} placeholder="e.g. Home, About, Contact"
                style={{ width: "100%", padding: "12px 14px", border: "1px solid " + C.border, marginBottom: 18, fontSize: 16, fontFamily: "Georgia, serif", outline: "none", background: C.cream, color: C.text, borderRadius: 2 }} />
              <label style={{ display: "block", fontSize: 14, color: C.textLight, marginBottom: 10, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700 }}>Paste Page Source HTML</label>
              <p style={{ fontSize: 16, color: C.textLight, marginBottom: 12, lineHeight: 1.7 }}>
                On iPhone (Chrome): type <code style={{ background: C.creamDark, padding: "2px 6px", borderRadius: 2, fontSize: 14 }}>view-source:</code> before the URL. On desktop: right-click → View Page Source → Select All → Copy.
              </p>
              <textarea value={pastedHtml} onChange={e => setPastedHtml(e.target.value)} placeholder="Paste HTML source here…" rows={6}
                style={{ width: "100%", padding: "12px 14px", border: "1px solid " + C.border, fontSize: 14, fontFamily: "monospace", outline: "none", background: C.cream, color: C.text, resize: "vertical", borderRadius: 2 }} />
              <button onClick={runPasteAudit} disabled={loading || !canRun} style={{ marginTop: 14, padding: "14px 28px", border: "none", cursor: loading || !canRun ? "not-allowed" : "pointer", background: loading || !canRun ? C.textLight : C.blue, color: C.white, fontSize: 16, fontFamily: "Georgia, serif", letterSpacing: "0.06em", textTransform: "uppercase", borderRadius: 2, fontWeight: 700 }}>
                {loading ? "Analyzing…" : "Audit This Page"}
              </button>
            </>
          )}

          {loading && (
            <div style={{ marginTop: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ width: 16, height: 16, border: "2px solid " + C.blue, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.9s linear infinite", flexShrink: 0 }} />
                <span style={{ fontSize: 16, color: C.textLight }}>{stage}</span>
              </div>
              {progress.total > 1 && (
                <>
                  <div style={{ height: 3, background: C.creamDark, borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", background: C.blue, width: progressPct + "%", transition: "width 0.5s ease" }} />
                  </div>
                  <div style={{ fontSize: 14, color: C.textLight, marginTop: 6 }}>{progress.current} of {progress.total} pages</div>
                </>
              )}
            </div>
          )}
          {error && <div style={{ marginTop: 14, padding: "12px 16px", background: "#fef2f2", border: "1px solid #f5b8b8", borderRadius: 2, fontSize: 16, color: "#8b1a1a" }}>{error}</div>}
        </div>

        {/* Overall score */}
        {siteScore !== null && (
          <div style={{ background: C.blue, border: "1px solid " + C.blueDark, padding: 24, marginBottom: 20, animation: "fadeIn 0.4s ease", display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
            <ScoreRing score={siteScore} size={100} />
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontSize: 12, color: C.gold, textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 8, fontWeight: 700 }}>{pages.length > 1 ? "Overall Site Score" : "Page Score"}</div>
              <div style={{ fontSize: 26, fontWeight: 300, color: C.white, marginBottom: 10, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{pages.length} page{pages.length > 1 ? "s" : ""} audited</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <span style={{ padding: "4px 12px", fontSize: 16, background: "rgba(255,255,255,0.15)", color: C.white }}>{pages.reduce((s, p) => s + (p.result?.violations?.length || 0), 0)} violations found</span>
                {totalPdfs > 0 && <span style={{ padding: "4px 12px", fontSize: 16, background: "rgba(232,201,106,0.2)", color: C.gold, fontWeight: 700 }}>{totalPdfs} PDF{totalPdfs > 1 ? "s" : ""} detected</span>}
              </div>
            </div>
          </div>
        )}

        {/* Pitch */}
        {combinedPitch && (
          <div style={{ background: C.white, border: "1px solid " + C.border, padding: "24px 26px", marginBottom: 20, animation: "fadeIn 0.5s ease" }}>
            <div style={{ fontSize: 12, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 14, fontWeight: 700 }}>Outreach Pitch</div>
            <blockquote style={{ margin: "0 0 16px", padding: "16px 20px", background: C.cream, borderLeft: "3px solid " + C.gold, fontSize: 18, color: C.text, lineHeight: 1.85, fontStyle: "italic", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 300 }}>"{combinedPitch}"</blockquote>
            <button onClick={() => { navigator.clipboard.writeText(combinedPitch); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              style={{ padding: "10px 22px", border: "1px solid " + C.blue, background: copied ? C.blue : C.white, color: copied ? C.white : C.blue, fontSize: 16, fontFamily: "Georgia, serif", cursor: "pointer", letterSpacing: "0.08em", textTransform: "uppercase", borderRadius: 2, transition: "all 0.2s", fontWeight: 700 }}>
              {copied ? "✓ Copied" : "Copy Pitch"}
            </button>
          </div>
        )}

        {/* Page results */}
        {pages.length > 0 && (
          <div style={{ animation: "fadeIn 0.3s ease", marginBottom: 48 }}>
            <div style={{ fontSize: 14, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid " + C.border, fontWeight: 700 }}>
              {pages.length > 1 ? "Page-by-Page Results" : "Audit Results"}
            </div>
            {pages.map((page, i) => <PageResult key={i} page={page} />)}
          </div>
        )}

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 18, margin: "56px 0 48px" }}>
          <div style={{ flex: 1, height: 1, background: C.border }} />
          <Star size={20} color={C.goldDark} />
          <div style={{ flex: 1, height: 1, background: C.border }} />
        </div>

        {/* FAQ Accordion */}
        <div style={{ marginBottom: 64 }}>
          <h2 style={{ fontSize: 36, fontWeight: 600, color: C.blue, fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: "0.04em", marginBottom: 28, textAlign: "center" }}>
            Understanding ADA Compliance
          </h2>

          <AccordionItem question="What is ADA Compliance?">
            The Americans with Disabilities Act (ADA) was signed into law in 1990 to protect people with disabilities from discrimination. While it originally focused on physical spaces — ramps, parking, building access — courts and regulators have extended it to the digital world. Today, ADA compliance for websites means ensuring your site can be used by people with visual, auditory, motor, and cognitive disabilities. The technical standard used to measure this is called WCAG 2.1 (Web Content Accessibility Guidelines), which outlines specific criteria your site must meet.
          </AccordionItem>

          <AccordionItem question="What Does the Law Say?">
            <p style={{ margin: "0 0 16px" }}>ADA Title III requires that any business open to the public provide equal access — and courts have repeatedly ruled that websites count. In 2024, the Department of Justice finalized rules requiring government websites to meet WCAG 2.1 AA standards, and private business lawsuits have been mounting for years under the same framework.</p>
            <p style={{ margin: "0 0 16px" }}>Over 4,000 ADA web accessibility lawsuits were filed in 2023 alone — targeting businesses of every size. Small businesses are not exempt. In fact, they are frequently targeted because they are less likely to have legal teams monitoring compliance. Settlements typically range from $25,000 to $100,000 or more, not including legal fees.</p>
            <p style={{ margin: 0 }}>There is no official government certification for ADA compliance — which makes having a thorough, documented audit all the more important.</p>
          </AccordionItem>

          <AccordionItem question="Why Does It Matter for My Business?">
            <p style={{ margin: "0 0 16px" }}>Beyond legal risk, accessibility is simply good business. 1 in 4 Americans lives with a disability. An accessible website reaches a wider audience, performs better in search results — since many accessibility best practices overlap with SEO — and signals to your customers that your business is thoughtful and inclusive.</p>
            <p style={{ margin: 0 }}>Increasingly, consumers and clients choose brands that reflect their values. Accessibility is no longer a niche concern. It is an expectation.</p>
          </AccordionItem>
        </div>

        {/* What This Audit Checks */}
        <div style={{ background: C.blue, padding: "48px 40px", marginBottom: 2 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 20 }}>
            <Star size={16} color={C.gold} />
            <span style={{ fontSize: 14, color: C.gold, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700 }}>Audit Coverage</span>
            <Star size={16} color={C.gold} />
          </div>
          <h2 style={{ fontSize: 36, fontWeight: 600, color: C.white, fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: "0.04em", textAlign: "center", marginBottom: 12 }}>
            What This Audit Checks
          </h2>
          <p style={{ textAlign: "center", color: "rgba(255,255,255,0.65)", fontSize: 18, marginBottom: 36, lineHeight: 1.6 }}>
            Every page is scanned against WCAG 2.1 criteria across eight categories
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18 }}>
            {auditCategories.map((cat, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.08)", padding: "20px 22px", borderLeft: "3px solid " + C.gold }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.white, fontFamily: "Georgia, serif", marginBottom: 8 }}>{cat.title}</div>
                <div style={{ fontSize: 16, color: "rgba(255,255,255,0.65)", lineHeight: 1.7 }}>{cat.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Services */}
        <div style={{ background: C.creamDark, padding: "48px 40px", marginBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 20 }}>
            <Star size={16} color={C.goldDark} />
            <span style={{ fontSize: 14, color: C.goldDark, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700 }}>Ready to Fix What We Find?</span>
            <Star size={16} color={C.goldDark} />
          </div>
          <p style={{ textAlign: "center", fontSize: 22, color: C.text, fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600, lineHeight: 1.85, maxWidth: 560, margin: "0 auto 40px" }}>
            Accessibility work is meaningful — it makes the web more welcoming to everyone. If your audit revealed violations, we offer two ways to help.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            {[
              {
                label: "Compliance Report",
                title: "Detailed PDF Report",
                body: "Receive a full page-by-page PDF report outlining every violation, mapped to its specific WCAG criterion, with clear remediation guidance. Professional, thorough, and documented — something you can act on or hand directly to your developer.",
                cta: "Request a Report",
                subject: "ADA Compliance Report Request",
              },
              {
                label: "Full Service",
                title: "Remediation Services",
                body: "Prefer to hand it off entirely? We offer full accessibility remediation for websites of all sizes. Accessibility work is detailed, methodical, and worth doing right — we handle it from audit through implementation.",
                cta: "Get in Touch",
                subject: "ADA Remediation Inquiry",
              },
            ].map((card, i) => (
              <div key={i} style={{ background: C.white, border: "1px solid " + C.border, padding: "28px 26px", display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 12, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 12, fontWeight: 700 }}>{card.label}</div>
                <h3 style={{ fontSize: 24, fontWeight: 600, color: C.blue, fontFamily: "'Cormorant Garamond', Georgia, serif", marginBottom: 14 }}>{card.title}</h3>
                <p style={{ fontSize: 16, color: C.text, lineHeight: 1.8, marginBottom: 0, flex: 1 }}>{card.body}</p>
                <div style={{ marginTop: 28 }}>
                  <a href={"mailto:TarabanStudio@gmail.com?subject=" + card.subject} style={{ display: "inline-block", padding: "14px 28px", background: C.blue, color: C.white, fontSize: 16, letterSpacing: "0.08em", textTransform: "uppercase", textDecoration: "none", borderRadius: 2, fontWeight: 700 }}>
                    {card.cta}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{ textAlign: "center", padding: "0 20px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <Star size={14} color={C.goldDark} />
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>
          <p style={{ fontSize: 14, color: C.textLight, lineHeight: 1.85, maxWidth: 600, margin: "0 auto" }}>
            This tool scans publicly accessible web pages only. No data is stored or shared. Results are provided for informational purposes and do not constitute legal advice. ADA compliance should be confirmed by a qualified accessibility professional.
          </p>
        </div>

      </div>
    </div>
  );
}
