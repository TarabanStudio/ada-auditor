import { useState, useRef } from "react";

const impactConfig = {
  critical: { bg: "#fef2f2", text: "#991b1b", border: "#fca5a5", dot: "#dc2626" },
  serious:  { bg: "#fff7ed", text: "#9a3412", border: "#fdba74", dot: "#ea580c" },
  moderate: { bg: "#fefce8", text: "#854d0e", border: "#fde047", dot: "#ca8a04" },
  minor:    { bg: "#f0fdf4", text: "#166534", border: "#86efac", dot: "#16a34a" },
};

const oppConfig = {
  high:   { label: "Strong Prospect", color: "#16a34a", bg: "#f0fdf4" },
  medium: { label: "Worth Outreach",  color: "#d97706", bg: "#fffbeb" },
  low:    { label: "Minor Issues",    color: "#6b7280", bg: "#f9fafb" },
};

function scoreColor(s) {
  if (s >= 80) return "#16a34a";
  if (s >= 60) return "#d97706";
  if (s >= 40) return "#ea580c";
  return "#dc2626";
}

function ScoreRing({ score, size = 100 }) {
  const r = size * 0.4, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = scoreColor(score);
  const cx = size / 2, cy = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth={size * 0.09} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={size * 0.09}
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`} style={{ transition: "stroke-dasharray 1.2s ease" }} />
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize={size * 0.2} fontWeight="700"
        fill={color} fontFamily="Georgia, serif">{score}</text>
      <text x={cx} y={cy + size * 0.14} textAnchor="middle" fontSize={size * 0.09} fill="#9ca3af"
        fontFamily="Georgia, serif">/100</text>
    </svg>
  );
}

function ViolationCard({ v, expanded, onToggle }) {
  const cfg = impactConfig[v.impact] || impactConfig.minor;
  return (
    <div onClick={onToggle} style={{
      border: `1px solid ${expanded ? cfg.border : "#e5e7eb"}`,
      borderRadius: 8, marginBottom: 8, cursor: "pointer",
      background: expanded ? cfg.bg : "#fff",
      transition: "all 0.2s ease", overflow: "hidden",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px" }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <span style={{ fontWeight: 600, fontSize: 13, color: "#111", fontFamily: "Georgia, serif" }}>{v.category}</span>
          <span style={{
            marginLeft: 6, fontSize: 10, padding: "1px 6px", borderRadius: 20,
            background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}`, fontFamily: "monospace"
          }}>WCAG {v.wcag}</span>
        </div>
        <span style={{ fontSize: 10, color: cfg.text, fontWeight: 600, textTransform: "uppercase" }}>{v.impact}</span>
        <span style={{ color: "#9ca3af" }}>{expanded ? "▲" : "▼"}</span>
      </div>
      {expanded && (
        <div style={{ padding: "0 12px 12px", borderTop: `1px solid ${cfg.border}` }}>
          <p style={{ margin: "8px 0 6px", fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{v.issue}</p>
          {v.example && v.example !== "N/A" && (
            <pre style={{
              background: "#1e1e2e", color: "#cdd6f4", padding: "8px 10px", borderRadius: 6,
              fontSize: 11, overflowX: "auto", margin: "6px 0", fontFamily: "monospace",
              lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-all"
            }}>{v.example}</pre>
          )}
          <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 6, padding: "6px 10px", fontSize: 12, color: "#166534", marginTop: 6 }}>
            <strong>Fix:</strong> {v.fix}
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
    <div style={{ border: "1px solid #e5e0d5", borderRadius: 12, marginBottom: 12, background: "#fff", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", cursor: "pointer" }}>
        <ScoreRing score={page.result?.score ?? 0} size={56} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e", fontFamily: "Georgia, serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{page.label}</div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{page.url}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
            <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 600, background: opp.bg, color: opp.color }}>{opp.label}</span>
            <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, background: "#f3f4f6", color: "#374151" }}>{page.result?.violations?.length || 0} violations</span>
            {page.result?.pdfCount > 0 && <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, background: "#fff7ed", color: "#9a3412" }}>{page.result.pdfCount} PDFs</span>}
          </div>
        </div>
        <span style={{ color: "#9ca3af", fontSize: 16, flexShrink: 0 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && page.result && (
        <div style={{ borderTop: "1px solid #f0ebe0", padding: "14px 16px", background: "#faf9f7" }}>
          <p style={{ margin: "0 0 12px", fontSize: 13, color: "#374151", lineHeight: 1.65 }}>{page.result.summary}</p>
          {page.result.violations?.length === 0
            ? <div style={{ padding: "10px 14px", background: "#f0fdf4", borderRadius: 8, fontSize: 12, color: "#166534" }}>No violations found!</div>
            : page.result.violations.map((v, i) => (
              <ViolationCard key={i} v={v} expanded={expandedV === i} onToggle={() => setExpandedV(expandedV === i ? null : i)} />
            ))
          }
          {page.result.pitchAngle && (
            <div style={{ marginTop: 12, padding: "12px 14px", background: "#faf7f2", borderLeft: "3px solid #c8a96e", borderRadius: "0 8px 8px 0", fontSize: 13, color: "#1a1a2e", fontStyle: "italic", lineHeight: 1.65 }}>
              "{page.result.pitchAngle}"
            </div>
          )}
        </div>
      )}
      {open && page.error && (
        <div style={{ borderTop: "1px solid #f0ebe0", padding: "12px 16px", background: "#fef2f2" }}>
          <span style={{ fontSize: 12, color: "#991b1b" }}>Could not audit: {page.error}</span>
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
  const res = await fetch("/api/fetch-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.html;
}

async function serverAudit(html, label) {
  const res = await fetch("/api/audit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ html, label }),
  });
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

  function resetResults() {
    setError(""); setPages([]); setSiteScore(null); setTotalPdfs(0); setCombinedPitch("");
  }

  async function runPasteAudit() {
    if (!pastedHtml.trim()) return;
    resetResults(); setLoading(true); setStage("Analyzing pasted HTML…");
    const label = pasteLabel.trim() || "Pasted Page";
    try {
      const result = await serverAudit(pastedHtml, label);
      setPages([{ url: label, label, result, error: null }]);
      setSiteScore(result.score);
      setTotalPdfs(result.pdfCount || 0);
      setCombinedPitch(result.pitchAngle || "");
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

    for (const sUrl of [`https://${baseHost}/sitemap.xml`, `https://${baseHost}/sitemap_index.xml`, `https://${baseHost}/page-sitemap.xml`]) {
      try {
        const xml = await serverFetch(sUrl);
        const found = await extractUrlsFromSitemap(xml, baseHost);
        if (found.length > 0) { pageUrls = found; break; }
      } catch { continue; }
    }

    if (pageUrls.length === 0) { setStage("No sitemap — auditing homepage…"); pageUrls = [cleanUrl]; }
    pageUrls = pageUrls.slice(0, 10);
    setProgress({ current: 0, total: pageUrls.length });

    const results = [];
    for (let i = 0; i < pageUrls.length; i++) {
      if (abortRef.current) break;
      const pageUrl = pageUrls[i];
      const label = getPageLabel(pageUrl);
      setStage(`Auditing: ${label} (${i + 1}/${pageUrls.length})`);
      setProgress({ current: i + 1, total: pageUrls.length });
      let pageResult = null, pageError = null;
      try {
        const html = await serverFetch(pageUrl);
        pageResult = await serverAudit(html, label);
      } catch (e) { pageError = e.message || "Failed"; }
      results.push({ url: pageUrl, label, result: pageResult, error: pageError });
      setPages([...results]);
    }

    const scored = results.filter(r => r.result?.score != null);
    if (scored.length > 0) {
      setSiteScore(Math.round(scored.reduce((s, r) => s + r.result.score, 0) / scored.length));
      setTotalPdfs(scored.reduce((s, r) => s + (r.result.pdfCount || 0), 0));
      const allV = scored.flatMap(r => r.result.violations || []);
      const topIssues = [...new Set(allV.map(v => v.category))].slice(0, 3).join(", ");
      setCombinedPitch(scored.map(r => r.result.pitchAngle).filter(Boolean)[0] || `This site has ${allV.length} violations across ${scored.length} pages, including ${topIssues}.`);
    }
    setLoading(false); setStage("");
  }

  const progressPct = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;
  const canRun = mode === "url" ? url.trim().length > 0 : pastedHtml.trim().length > 0;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #faf7f2 0%, #f0ebe0 100%)", fontFamily: "Georgia, serif", paddingBottom: 60 }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; }
      `}</style>

      <div style={{ background: "#1a1a2e", padding: "32px 24px 28px", textAlign: "center", borderBottom: "3px solid #c8a96e" }}>
        <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "#c8a96e", textTransform: "uppercase", marginBottom: 6 }}>Full-Site Accessibility Intelligence</div>
        <h1 style={{ margin: 0, fontSize: 28, color: "#faf7f2", fontWeight: 700, fontFamily: "Georgia, serif" }}>ADA Compliance Auditor</h1>
        <p style={{ margin: "6px 0 0", color: "#9ca3af", fontSize: 13 }}>Crawls your sitemap · Audits every page · Generates your pitch</p>
      </div>

      <div style={{ maxWidth: 720, margin: "32px auto 0", padding: "0 16px" }}>

        <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid #e5e0d5", marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            {[{ id: "url", label: "🔗 Enter URL" }, { id: "paste", label: "📋 Paste HTML" }].map(({ id, label }) => (
              <button key={id} onClick={() => { setMode(id); resetResults(); }} style={{
                padding: "7px 14px", borderRadius: 8, border: `1.5px solid ${mode === id ? "#1a1a2e" : "#d1c9b8"}`,
                background: mode === id ? "#1a1a2e" : "#faf9f7", color: mode === id ? "#fff" : "#6b7280",
                fontSize: 12, fontFamily: "Georgia, serif", cursor: "pointer", fontWeight: mode === id ? 600 : 400,
              }}>{label}</button>
            ))}
          </div>

          {mode === "url" ? (
            <>
              <label style={{ display: "block", fontSize: 11, color: "#9ca3af", marginBottom: 8, letterSpacing: "0.08em", textTransform: "uppercase" }}>Website URL</label>
              <div style={{ display: "flex", gap: 10 }}>
                <input value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && !loading && runFullAudit()}
                  placeholder="e.g. alachuaconservationtrust.org"
                  style={{ flex: 1, padding: "11px 14px", borderRadius: 8, border: "1.5px solid #d1c9b8", fontSize: 14, fontFamily: "Georgia, serif", outline: "none", background: "#faf9f7", color: "#111" }} />
                {!loading
                  ? <button onClick={runFullAudit} disabled={!canRun} style={{ padding: "11px 18px", borderRadius: 8, border: "none", cursor: !canRun ? "not-allowed" : "pointer", background: !canRun ? "#9ca3af" : "#1a1a2e", color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: "Georgia, serif", whiteSpace: "nowrap" }}>Audit Full Site</button>
                  : <button onClick={() => { abortRef.current = true; setLoading(false); }} style={{ padding: "11px 18px", borderRadius: 8, border: "none", cursor: "pointer", background: "#dc2626", color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: "Georgia, serif" }}>Stop</button>
                }
              </div>
            </>
          ) : (
            <>
              <label style={{ display: "block", fontSize: 11, color: "#9ca3af", marginBottom: 6, letterSpacing: "0.08em", textTransform: "uppercase" }}>Page Name (optional)</label>
              <input value={pasteLabel} onChange={e => setPasteLabel(e.target.value)} placeholder="e.g. Home, About, Contact"
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, marginBottom: 10, border: "1.5px solid #d1c9b8", fontSize: 13, fontFamily: "Georgia, serif", outline: "none", background: "#faf9f7", color: "#111" }} />
              <label style={{ display: "block", fontSize: 11, color: "#9ca3af", marginBottom: 6, letterSpacing: "0.08em", textTransform: "uppercase" }}>Paste Page Source HTML</label>
              <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 8, lineHeight: 1.5 }}>
                On iPhone (Chrome): type <code style={{ background: "#f3f4f6", padding: "1px 4px", borderRadius: 3 }}>view-source:</code> before the URL. On desktop: right-click → View Page Source → Select All → Copy.
              </p>
              <textarea value={pastedHtml} onChange={e => setPastedHtml(e.target.value)} placeholder="Paste your page HTML source here…" rows={6}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #d1c9b8", fontSize: 12, fontFamily: "monospace", outline: "none", background: "#faf9f7", color: "#111", resize: "vertical" }} />
              <button onClick={runPasteAudit} disabled={loading || !canRun} style={{ marginTop: 10, padding: "11px 20px", borderRadius: 8, border: "none", cursor: loading || !canRun ? "not-allowed" : "pointer", background: loading || !canRun ? "#9ca3af" : "#1a1a2e", color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: "Georgia, serif" }}>
                {loading ? "Analyzing…" : "Audit This Page"}
              </button>
            </>
          )}

          {loading && (
            <div style={{ marginTop: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{ width: 14, height: 14, border: "2px solid #c8a96e", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#6b7280" }}>{stage}</span>
              </div>
              {progress.total > 1 && (
                <>
                  <div style={{ height: 6, background: "#f0ebe0", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 99, background: "linear-gradient(90deg, #c8a96e, #1a1a2e)", width: `${progressPct}%`, transition: "width 0.5s ease" }} />
                  </div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>{progress.current} of {progress.total} pages</div>
                </>
              )}
            </div>
          )}

          {error && <div style={{ marginTop: 10, padding: "10px 14px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, fontSize: 13, color: "#991b1b" }}>{error}</div>}
        </div>

        {siteScore !== null && (
          <div style={{ background: "#1a1a2e", borderRadius: 14, padding: 20, boxShadow: "0 4px 24px rgba(0,0,0,0.12)", marginBottom: 18, animation: "fadeIn 0.4s ease", display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
            <ScoreRing score={siteScore} size={90} />
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontSize: 10, color: "#c8a96e", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>{pages.length > 1 ? "Overall Site Score" : "Page Score"}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#faf7f2", marginBottom: 6 }}>{pages.length} page{pages.length > 1 ? "s" : ""} audited</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, background: "#ffffff20", color: "#faf7f2" }}>{pages.reduce((s, p) => s + (p.result?.violations?.length || 0), 0)} violations</span>
                {totalPdfs > 0 && <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, background: "#c8a96e30", color: "#c8a96e", fontWeight: 600 }}>{totalPdfs} PDF{totalPdfs > 1 ? "s" : ""} — upsell</span>}
              </div>
            </div>
          </div>
        )}

        {combinedPitch && (
          <div style={{ background: "#fff", borderRadius: 14, padding: 18, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid #e5e0d5", marginBottom: 18, animation: "fadeIn 0.5s ease" }}>
            <div style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Outreach Pitch</div>
            <blockquote style={{ margin: "0 0 12px", padding: "12px 16px", background: "#faf7f2", borderLeft: "4px solid #c8a96e", borderRadius: "0 8px 8px 0", fontSize: 14, color: "#1a1a2e", lineHeight: 1.75, fontStyle: "italic" }}>"{combinedPitch}"</blockquote>
            <button onClick={() => { navigator.clipboard.writeText(combinedPitch); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              style={{ padding: "8px 16px", borderRadius: 8, border: "1.5px solid #c8a96e", background: copied ? "#f0fdf4" : "#fff", color: copied ? "#166534" : "#1a1a2e", fontSize: 12, fontFamily: "Georgia, serif", cursor: "pointer", fontWeight: 600 }}>
              {copied ? "✓ Copied!" : "Copy Pitch"}
            </button>
            {totalPdfs > 0 && <div style={{ marginTop: 12, padding: "10px 14px", background: "#fff7ed", border: "1px solid #fdba74", borderRadius: 8, fontSize: 12, color: "#9a3412" }}><strong>PDF upsell:</strong> {totalPdfs} PDF{totalPdfs > 1 ? "s" : ""} found — quote remediation as additional scope.</div>}
          </div>
        )}

        {pages.length > 0 && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>{pages.length > 1 ? "Page-by-Page Results" : "Audit Results"}</div>
            {pages.map((page, i) => <PageResult key={i} page={page} />)}
          </div>
        )}
      </div>
    </div>
  );
}i
