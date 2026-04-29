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
  textLight: "#7a8a8f",
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
  low:    { label: "Minor Issues",    color: "#7a8a8f", bg: "#f5f5f5" },
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
      <text x={cx} y={cy - 2} textAnchor="middle" fontSize={size * 0.2} fontWeight="300"
        fill={color} fontFamily="'Cormorant Garamond', Georgia, serif">{score}</text>
      <text x={cx} y={cy + size * 0.16} textAnchor="middle" fontSize={size * 0.1} fill={C.textLight}
        fontFamily="Georgia, serif">/100</text>
    </svg>
  );
}

function ViolationCard({ v, expanded, onToggle }) {
  const cfg = impactConfig[v.impact] || impactConfig.minor;
  return (
    <div onClick={onToggle} style={{
      border: "1px solid " + (expanded ? cfg.border : C.border),
      borderRadius: 3, marginBottom: 6, cursor: "pointer",
      background: expanded ? cfg.bg : C.white,
      transition: "all 0.2s ease", overflow: "hidden",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px" }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <span style={{ fontWeight: 400, fontSize: 13, color: C.text, fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: "0.02em" }}>{v.category}</span>
          <span style={{ marginLeft: 8, fontSize: 9, padding: "1px 6px", borderRadius: 2, background: cfg.bg, color: cfg.text, border: "1px solid " + cfg.border, fontFamily: "monospace", letterSpacing: "0.05em" }}>WCAG {v.wcag}</span>
        </div>
        <span style={{ fontSize: 9, color: cfg.text, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>{v.impact}</span>
        <span style={{ color: C.textLight, fontSize: 10, marginLeft: 6 }}>{expanded ? "▲" : "▼"}</span>
      </div>
      {expanded && (
        <div style={{ padding: "0 14px 14px", borderTop: "1px solid " + cfg.border }}>
          <p style={{ margin: "10px 0 8px", fontSize: 13, color: C.text, lineHeight: 1.65, fontFamily: "Georgia, serif" }}>{v.issue}</p>
          {v.example && v.example !== "N/A" && (
            <pre style={{ background: "#1c2333", color: "#c8d8e8", padding: "10px 12px", borderRadius: 3, fontSize: 10, overflowX: "auto", margin: "8px 0", fontFamily: "monospace", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{v.example}</pre>
          )}
          <div style={{ background: "#f0f8f4", border: "1px solid #90d8b0", borderRadius: 3, padding: "8px 12px", fontSize: 12, color: "#1a6040", marginTop: 8, fontFamily: "Georgia, serif" }}>
            <strong>Remedy:</strong> {v.fix}
          </div>
        </div>
      )}
    </div>
  );
}

function PageResult({ page }) {
  const [open, setOpen] = useState(false);
  const [expandedV, setExpandedV] = useState(null);
  const opp = oppConfig[page.result?.opportunityScore] || oppConfig.low;
  return (
    <div style={{ border: "1px solid " + C.border, borderRadius: 3, marginBottom: 10, background: C.white, overflow: "hidden" }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 18px", cursor: "pointer" }}>
        <ScoreRing score={page.result?.score ?? 0} size={52} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 400, color: C.text, fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: "0.03em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{page.label}</div>
          <div style={{ fontSize: 10, color: C.textLight, marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{page.url}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
            <span style={{ padding: "2px 8px", borderRadius: 2, fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", background: opp.bg, color: opp.color }}>{opp.label}</span>
            <span style={{ padding: "2px 8px", borderRadius: 2, fontSize: 9, background: C.creamDark, color: C.textLight }}>{page.result?.violations?.length || 0} violations</span>
            {page.result?.pdfCount > 0 && <span style={{ padding: "2px 8px", borderRadius: 2, fontSize: 9, background: "#fff8f0", color: "#8b4a12" }}>{page.result.pdfCount} PDFs</span>}
          </div>
        </div>
        <span style={{ color: C.textLight, fontSize: 10, flexShrink: 0 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && page.result && (
        <div style={{ borderTop: "1px solid " + C.border, padding: "16px 18px", background: C.cream }}>
          <p style={{ margin: "0 0 14px", fontSize: 13, color: C.text, lineHeight: 1.7, fontFamily: "Georgia, serif" }}>{page.result.summary}</p>
          {page.result.violations?.length === 0
            ? <div style={{ padding: "10px 14px", background: "#f0f8f4", borderRadius: 3, fontSize: 12, color: "#1a6040", fontFamily: "Georgia, serif" }}>No violations found on this page.</div>
            : page.result.violations.map((v, i) => <ViolationCard key={i} v={v} expanded={expandedV === i} onToggle={() => setExpandedV(expandedV === i ? null : i)} />)
          }
          {page.result.pitchAngle && (
            <div style={{ marginTop: 14, padding: "14px 16px", background: C.white, borderLeft: "3px solid " + C.gold, fontSize: 13, color: C.text, fontStyle: "italic", lineHeight: 1.75, fontFamily: "Georgia, serif" }}>
              "{page.result.pitchAngle}"
            </div>
          )}
        </div>
      )}
      {open && page.error && (
        <div style={{ borderTop: "1px solid " + C.border, padding: "12px 18px", background: "#fef2f2" }}>
          <span style={{ fontSize: 12, color: "#8b1a1a", fontFamily: "Georgia, serif" }}>Could not audit this page: {page.error}</span>
        </div>
      )}
    </div>
  );
}

function AccordionItem({ question, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid " + C.border }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 0", cursor: "pointer" }}>
        <span style={{ fontSize: 15, color: C.blue, fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400, letterSpacing: "0.02em" }}>{question}</span>
        <span style={{ fontSize: 18, color: C.textLight, marginLeft: 16, flexShrink: 0 }}>{open ? "−" : "+"}</span>
      </div>
      {open && (
        <div style={{ paddingBottom: 20, fontSize: 13, color: C.text, lineHeight: 1.8, fontFamily: "Georgia, serif", animation: "fadeIn 0.2s ease" }}>
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
      setCombinedPitch(scored.map(r => r.result.pitchAngle).filter(Boolean)[0] || "This site has " + allV.length + " accessibility violations across " + scored.length + " pages, including issues with " + (topIssues || "multiple WCAG criteria") + ".");
    }
    setLoading(false); setStage("");
  }

  const progressPct = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;
  const canRun = mode === "url" ? url.trim().length > 0 : pastedHtml.trim().length > 0;

  const auditCategories = [
    { icon: "◎", title: "Images, Charts & Maps", desc: "Missing or empty alt text, decorative images not properly hidden, charts and maps without text alternatives" },
    { icon: "≡", title: "Page Structure", desc: "Heading hierarchy (H1–H3), language declaration, skip-to-content navigation" },
    { icon: "↗", title: "Navigation & Links", desc: "Vague link text such as 'click here' or 'read more,' buttons without accessible labels" },
    { icon: "□", title: "Forms", desc: "Input fields missing labels, no error identification or instructions for users" },
    { icon: "⬡", title: "Landmarks & Regions", desc: "Missing semantic HTML elements — nav, main, header, footer — and ARIA landmark roles" },
    { icon: "◑", title: "Color & Contrast", desc: "Inline styles with poor color contrast ratios that make text difficult to read" },
    { icon: "⬡", title: "Documents & PDFs", desc: "PDF files linked from the page that require their own separate remediation process" },
    { icon: "⊞", title: "Tables & Data", desc: "Tables missing captions, header scope attributes, or data not readable by screen readers" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontFamily: "Georgia, serif", paddingBottom: 80 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; }
        ::placeholder { color: #aab8bc; }
        a { color: inherit; }
      `}</style>

      {/* Header */}
      <div style={{ background: C.blue, padding: "28px 24px 24px", textAlign: "center", borderBottom: "2px solid " + C.blueDark }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 12 }}>
          <Star size={22} color={C.gold} />
          <Star size={22} color={C.gold} />
          <Star size={22} color={C.gold} />
        </div>
        <h1 style={{ margin: "0 0 8px", fontSize: 32, color: C.white, fontWeight: 300, fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: "0.1em" }}>
          ADA Accessibility Audit
        </h1>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.6)", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase" }}>
          Sitemap Crawl &nbsp;·&nbsp; Page-by-Page Analysis &nbsp;·&nbsp; Compliance Report
        </p>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 20px" }}>

        {/* Intro */}
        <div style={{ textAlign: "center", padding: "40px 20px 32px" }}>
          <p style={{ fontSize: 16, color: C.text, lineHeight: 1.85, fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 300, maxWidth: 540, margin: "0 auto" }}>
            Every website deserves to be experienced by everyone. Enter any URL below to receive a free accessibility score and a page-by-page breakdown of WCAG 2.1 violations.
          </p>
        </div>

        {/* Input card */}
        <div style={{ background: C.white, border: "1px solid " + C.border, padding: "24px 24px 20px", marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: "1px solid " + C.border }}>
            {[{ id: "url", label: "Enter URL" }, { id: "paste", label: "Paste HTML" }].map(({ id, label }) => (
              <button key={id} onClick={() => { setMode(id); resetResults(); }} style={{
                padding: "8px 18px", border: "none", borderBottom: mode === id ? "2px solid " + C.blue : "2px solid transparent",
                background: "none", color: mode === id ? C.blue : C.textLight,
                fontSize: 11, fontFamily: "Georgia, serif", cursor: "pointer",
                fontWeight: 400, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: -1, transition: "all 0.2s",
              }}>{label}</button>
            ))}
          </div>

          {mode === "url" ? (
            <>
              <label style={{ display: "block", fontSize: 10, color: C.textLight, marginBottom: 8, letterSpacing: "0.15em", textTransform: "uppercase" }}>Website URL</label>
              <div style={{ display: "flex", gap: 10 }}>
                <input value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && !loading && runFullAudit()} placeholder="e.g. yourbusiness.com"
                  style={{ flex: 1, padding: "11px 14px", border: "1px solid " + C.border, fontSize: 13, fontFamily: "Georgia, serif", outline: "none", background: C.cream, color: C.text, borderRadius: 2 }} />
                {!loading
                  ? <button onClick={runFullAudit} disabled={!canRun} style={{ padding: "11px 22px", border: "none", cursor: !canRun ? "not-allowed" : "pointer", background: !canRun ? C.textLight : C.blue, color: C.white, fontSize: 11, fontFamily: "Georgia, serif", whiteSpace: "nowrap", letterSpacing: "0.1em", textTransform: "uppercase", borderRadius: 2 }}>Audit Site</button>
                  : <button onClick={() => { abortRef.current = true; setLoading(false); }} style={{ padding: "11px 22px", border: "none", cursor: "pointer", background: "#cc2222", color: C.white, fontSize: 11, fontFamily: "Georgia, serif", letterSpacing: "0.1em", textTransform: "uppercase", borderRadius: 2 }}>Stop</button>
                }
              </div>
            </>
          ) : (
            <>
              <label style={{ display: "block", fontSize: 10, color: C.textLight, marginBottom: 8, letterSpacing: "0.15em", textTransform: "uppercase" }}>Page Name (optional)</label>
              <input value={pasteLabel} onChange={e => setPasteLabel(e.target.value)} placeholder="e.g. Home, About, Contact"
                style={{ width: "100%", padding: "9px 12px", border: "1px solid " + C.border, marginBottom: 14, fontSize: 13, fontFamily: "Georgia, serif", outline: "none", background: C.cream, color: C.text, borderRadius: 2 }} />
              <label style={{ display: "block", fontSize: 10, color: C.textLight, marginBottom: 8, letterSpacing: "0.15em", textTransform: "uppercase" }}>Paste Page Source HTML</label>
              <p style={{ fontSize: 11, color: C.textLight, marginBottom: 10, lineHeight: 1.6 }}>
                On iPhone (Chrome): type <code style={{ background: C.creamDark, padding: "1px 5px", borderRadius: 2, fontSize: 10 }}>view-source:</code> before the URL. On desktop: right-click → View Page Source → Select All → Copy.
              </p>
              <textarea value={pastedHtml} onChange={e => setPastedHtml(e.target.value)} placeholder="Paste HTML source here…" rows={6}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid " + C.border, fontSize: 11, fontFamily: "monospace", outline: "none", background: C.cream, color: C.text, resize: "vertical", borderRadius: 2 }} />
              <button onClick={runPasteAudit} disabled={loading || !canRun} style={{ marginTop: 12, padding: "11px 22px", border: "none", cursor: loading || !canRun ? "not-allowed" : "pointer", background: loading || !canRun ? C.textLight : C.blue, color: C.white, fontSize: 11, fontFamily: "Georgia, serif", letterSpacing: "0.1em", textTransform: "uppercase", borderRadius: 2 }}>
                {loading ? "Analyzing…" : "Audit This Page"}
              </button>
            </>
          )}

          {loading && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 13, height: 13, border: "1.5px solid " + C.blue, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.9s linear infinite", flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: C.textLight, letterSpacing: "0.05em" }}>{stage}</span>
              </div>
              {progress.total > 1 && (
                <>
                  <div style={{ height: 2, background: C.creamDark, borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", background: C.blue, width: progressPct + "%", transition: "width 0.5s ease" }} />
                  </div>
                  <div style={{ fontSize: 10, color: C.textLight, marginTop: 5 }}>{progress.current} of {progress.total} pages</div>
                </>
              )}
            </div>
          )}
          {error && <div style={{ marginTop: 12, padding: "10px 14px", background: "#fef2f2", border: "1px solid #f5b8b8", borderRadius: 2, fontSize: 12, color: "#8b1a1a" }}>{error}</div>}
        </div>

        {/* Overall score */}
        {siteScore !== null && (
          <div style={{ background: C.blue, border: "1px solid " + C.blueDark, padding: 20, marginBottom: 16, animation: "fadeIn 0.4s ease", display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
            <ScoreRing score={siteScore} size={80} />
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontSize: 9, color: C.gold, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 6 }}>{pages.length > 1 ? "Overall Site Score" : "Page Score"}</div>
              <div style={{ fontSize: 22, fontWeight: 300, color: C.white, marginBottom: 8, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{pages.length} page{pages.length > 1 ? "s" : ""} audited</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={{ padding: "3px 10px", fontSize: 10, background: "rgba(255,255,255,0.15)", color: C.white, letterSpacing: "0.06em" }}>{pages.reduce((s, p) => s + (p.result?.violations?.length || 0), 0)} violations found</span>
                {totalPdfs > 0 && <span style={{ padding: "3px 10px", fontSize: 10, background: "rgba(232,201,106,0.2)", color: C.gold, fontWeight: 600 }}>{totalPdfs} PDF{totalPdfs > 1 ? "s" : ""} detected</span>}
              </div>
            </div>
          </div>
        )}

        {/* Pitch */}
        {combinedPitch && (
          <div style={{ background: C.white, border: "1px solid " + C.border, padding: "20px 22px", marginBottom: 16, animation: "fadeIn 0.5s ease" }}>
            <div style={{ fontSize: 9, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 12 }}>Outreach Pitch</div>
            <blockquote style={{ margin: "0 0 14px", padding: "14px 18px", background: C.cream, borderLeft: "3px solid " + C.gold, fontSize: 14, color: C.text, lineHeight: 1.8, fontStyle: "italic", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 300 }}>"{combinedPitch}"</blockquote>
            <button onClick={() => { navigator.clipboard.writeText(combinedPitch); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              style={{ padding: "8px 18px", border: "1px solid " + C.blue, background: copied ? C.blue : C.white, color: copied ? C.white : C.blue, fontSize: 10, fontFamily: "Georgia, serif", cursor: "pointer", letterSpacing: "0.12em", textTransform: "uppercase", borderRadius: 2, transition: "all 0.2s" }}>
              {copied ? "✓ Copied" : "Copy Pitch"}
            </button>
          </div>
        )}

        {/* Page results */}
        {pages.length > 0 && (
          <div style={{ animation: "fadeIn 0.3s ease", marginBottom: 40 }}>
            <div style={{ fontSize: 9, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid " + C.border }}>
              {pages.length > 1 ? "Page-by-Page Results" : "Audit Results"}
            </div>
            {pages.map((page, i) => <PageResult key={i} page={page} />)}
          </div>
        )}

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "48px 0 40px" }}>
          <div style={{ flex: 1, height: 1, background: C.border }} />
          <Star size={16} color={C.goldDark} />
          <div style={{ flex: 1, height: 1, background: C.border }} />
        </div>

        {/* FAQ Accordion */}
        <div style={{ marginBottom: 56 }}>
          <h2 style={{ fontSize: 26, fontWeight: 300, color: C.blue, fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: "0.05em", marginBottom: 24, textAlign: "center" }}>
            Understanding ADA Compliance
          </h2>

          <AccordionItem question="What is ADA Compliance?">
            The Americans with Disabilities Act (ADA) was signed into law in 1990 to protect people with disabilities from discrimination. While it originally focused on physical spaces — ramps, parking, building access — courts and regulators have extended it to the digital world. Today, ADA compliance for websites means ensuring your site can be used by people with visual, auditory, motor, and cognitive disabilities. The technical standard used to measure this is called WCAG 2.1 (Web Content Accessibility Guidelines), which outlines specific criteria your site must meet.
          </AccordionItem>

          <AccordionItem question="What Does the Law Say?">
            ADA Title III requires that any business open to the public provide equal access — and courts have repeatedly ruled that websites count. In 2024, the Department of Justice finalized rules requiring government websites to meet WCAG 2.1 AA standards, and private business lawsuits have been mounting for years under the same framework.
            <br /><br />
            Over 4,000 ADA web accessibility lawsuits were filed in 2023 alone — targeting businesses of every size. Small businesses are not exempt. In fact, they are frequently targeted because they are less likely to have legal teams monitoring compliance. Settlements typically range from $25,000 to $100,000 or more, not including legal fees.
            <br /><br />
            There is no official government certification for ADA compliance — which makes having a thorough, documented audit all the more important.
          </AccordionItem>

          <AccordionItem question="Why Does It Matter for My Business?">
            Beyond legal risk, accessibility is simply good business. 1 in 4 Americans lives with a disability. An accessible website reaches a wider audience, performs better in search results — since many accessibility best practices overlap with SEO — and signals to your customers that your business is thoughtful and inclusive.
            <br /><br />
            Increasingly, consumers and clients choose brands that reflect their values. Accessibility is no longer a niche concern. It is an expectation.
          </AccordionItem>
        </div>

        {/* What This Audit Checks — Featured */}
        <div style={{ background: C.blue, padding: "40px 32px", marginBottom: 2 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 20 }}>
            <Star size={14} color={C.gold} />
            <span style={{ fontSize: 10, color: C.gold, letterSpacing: "0.2em", textTransform: "uppercase" }}>Audit Coverage</span>
            <Star size={14} color={C.gold} />
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 300, color: C.white, fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: "0.05em", textAlign: "center", marginBottom: 8 }}>
            What This Audit Checks
          </h2>
          <p style={{ textAlign: "center", color: "rgba(255,255,255,0.6)", fontSize: 12, marginBottom: 32, letterSpacing: "0.05em" }}>
            Every page is scanned against WCAG 2.1 criteria across eight categories
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {auditCategories.map((cat, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.08)", padding: "16px 18px", borderLeft: "2px solid " + C.gold }}>
                <div style={{ fontSize: 13, fontWeight: 400, color: C.white, fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: "0.04em", marginBottom: 6 }}>{cat.title}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.65 }}>{cat.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Services — Featured */}
        <div style={{ background: C.creamDark, padding: "40px 32px", marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 20 }}>
            <Star size={14} color={C.goldDark} />
            <span style={{ fontSize: 10, color: C.goldDark, letterSpacing: "0.2em", textTransform: "uppercase" }}>Ready to Fix What We Find?</span>
            <Star size={14} color={C.goldDark} />
          </div>
          <p style={{ textAlign: "center", fontSize: 15, color: C.text, fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 300, lineHeight: 1.85, maxWidth: 480, margin: "0 auto 36px" }}>
            Accessibility work is meaningful — it makes the web more welcoming to everyone. If your audit revealed violations, we offer two ways to help.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
            <div style={{ background: C.white, border: "1px solid " + C.border, padding: "28px 24px" }}>
              <div style={{ fontSize: 10, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 12 }}>Compliance Report</div>
              <h3 style={{ fontSize: 20, fontWeight: 300, color: C.blue, fontFamily: "'Cormorant Garamond', Georgia, serif", marginBottom: 12 }}>Detailed PDF Report</h3>
              <p style={{ fontSize: 12, color: C.text, lineHeight: 1.75, marginBottom: 20 }}>
                Receive a full page-by-page PDF report outlining every violation, mapped to its specific WCAG criterion, with clear remediation guidance. Professional, thorough, and documented — something you can act on or hand directly to your developer.
              </p>
              <a href="mailto:TarabanStudio@gmail.com?subject=ADA Compliance Report Request" style={{ display: "inline-block", padding: "10px 20px", background: C.blue, color: C.white, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none", borderRadius: 2 }}>
                Request a Report
              </a>
            </div>

            <div style={{ background: C.white, border: "1px solid " + C.border, padding: "28px 24px" }}>
              <div style={{ fontSize: 10, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 12 }}>Full Service</div>
              <h3 style={{ fontSize: 20, fontWeight: 300, color: C.blue, fontFamily: "'Cormorant Garamond', Georgia, serif", marginBottom: 12 }}>Remediation Services</h3>
              <p style={{ fontSize: 12, color: C.text, lineHeight: 1.75, marginBottom: 20 }}>
                Prefer to hand it off entirely? We offer full accessibility remediation for websites of all sizes. Accessibility work is detailed, methodical, and worth doing right — we handle it from audit through implementation.
              </p>
              <a href="mailto:TarabanStudio@gmail.com?subject=ADA Remediation Inquiry" style={{ display: "inline-block", padding: "10px 20px", background: C.blue, color: C.white, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none", borderRadius: 2 }}>
                Get in Touch
              </a>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{ textAlign: "center", padding: "0 20px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <Star size={12} color={C.goldDark} />
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>
          <p style={{ fontSize: 10, color: C.textLight, lineHeight: 1.8, letterSpacing: "0.03em" }}>
            This tool scans publicly accessible web pages only. No data is stored or shared. Results are provided for informational purposes and do not constitute legal advice. ADA compliance should be confirmed by a qualified accessibility professional.
          </p>
        </div>

      </div>
    </div>
  );
}
