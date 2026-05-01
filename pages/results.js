import { useState, useEffect } from "react";
import { useRouter } from "next/router";

const C = {
  blue: "#4a7a8a",
  blueDark: "#3a6070",
  cream: "#f5f2eb",
  creamDark: "#ede9e0",
  gold: "#e8c96a",
  goldDark: "#c8a94a",
  white: "#ffffff",
  text: "#2c2c2c",
  textLight: "#5a6a6f",
  border: "#d8d0c0",
};

// Painting-inspired palette for charts
const CHART_COLORS = ["#6b8fb5","#c8a94a","#7ab0a8","#8fa8cc","#4a6a8a","#9ab8c4","#b8a070","#6a9870"];

const impactConfig = {
  critical: { bg: "#fef2f2", text: "#8b1a1a", border: "#f5b8b8", dot: "#dc2626" },
  serious:  { bg: "#fff8f0", text: "#8b4a12", border: "#f5c896", dot: "#d97020" },
  moderate: { bg: "#fefdf0", text: "#7a6010", border: "#e8d870", dot: "#b89820" },
  minor:    { bg: "#f0f8f4", text: "#1a6040", border: "#90d8b0", dot: "#208050" },
};

function scoreColor(s) {
  if (s >= 80) return C.blue;
  if (s >= 60) return C.goldDark;
  if (s >= 40) return "#b07020";
  return "#8a4a4a";
}

function Star({ size = 20, color = C.gold }) {
  const arms = 8, points = [];
  for (let i = 0; i < arms * 2; i++) {
    const angle = (i * Math.PI) / arms - Math.PI / 2;
    const r = i % 2 === 0 ? size / 2 : size / 5;
    points.push((size/2 + r*Math.cos(angle)).toFixed(2)+","+(size/2+r*Math.sin(angle)).toFixed(2));
  }
  return <svg width={size} height={size} viewBox={"0 0 "+size+" "+size} style={{display:"inline-block",flexShrink:0}}><polygon points={points.join(" ")} fill={color}/></svg>;
}

function ScoreRing({ score, size = 90 }) {
  const r = size*0.38, circ = 2*Math.PI*r, dash = (score/100)*circ, color = scoreColor(score), cx=size/2, cy=size/2;
  return (
    <svg width={size} height={size} viewBox={"0 0 "+size+" "+size} style={{maxWidth:"100%"}}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.creamDark} strokeWidth={size*0.08}/>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={size*0.08}
        strokeDasharray={dash+" "+(circ-dash)} strokeLinecap="round"
        transform={"rotate(-90 "+cx+" "+cy+")"} style={{transition:"stroke-dasharray 1.2s ease"}}/>
      <text x={cx} y={cy-2} textAnchor="middle" fontSize={size*0.22} fontWeight="400" fill={color} fontFamily="Georgia,serif">{score}</text>
      <text x={cx} y={cy+size*0.18} textAnchor="middle" fontSize={size*0.12} fill={C.textLight} fontFamily="Georgia,serif">/100</text>
    </svg>
  );
}

function DonutChart({ data }) {
  if (!data || data.length === 0) return null;
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;
  const size = 320, cx = size/2, cy = size/2, r = 125, innerR = 75;
  let currentAngle = -Math.PI/2;
  const slices = data.map((d, i) => {
    const pct = d.value / total;
    const angle = pct * 2 * Math.PI;
    currentAngle += angle;
    const prevAngle = currentAngle - angle;
    const x1 = cx + r * Math.cos(prevAngle), y1 = cy + r * Math.sin(prevAngle);
    const x2 = cx + r * Math.cos(currentAngle), y2 = cy + r * Math.sin(currentAngle);
    const ix1 = cx + innerR * Math.cos(prevAngle), iy1 = cy + innerR * Math.sin(prevAngle);
    const ix2 = cx + innerR * Math.cos(currentAngle), iy2 = cy + innerR * Math.sin(currentAngle);
    const largeArc = angle > Math.PI ? 1 : 0;
    const path = `M ${ix1} ${iy1} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1} ${iy1}`;
    return { path, color: CHART_COLORS[i % CHART_COLORS.length], pct: Math.round(pct * 100), label: d.label, count: d.value };
  });

  // Split legend into two columns
  const half = Math.ceil(slices.length / 2);
  const col1 = slices.slice(0, half);
  const col2 = slices.slice(half);

  return (
    <div>
      {/* Big centered donut */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
        <svg width={size} height={size} viewBox={"0 0 "+size+" "+size}>
          {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} stroke={C.cream} strokeWidth="2"/>)}
          <text x={cx} y={cy-12} textAnchor="middle" fontSize="36" fontWeight="700" fill={C.text} fontFamily="Georgia,serif">{total}</text>
          <text x={cx} y={cy+16} textAnchor="middle" fontSize="16" fill={C.textLight} fontFamily="Georgia,serif">violations</text>
          <text x={cx} y={cy+36} textAnchor="middle" fontSize="14" fill={C.textLight} fontFamily="Georgia,serif">across all pages</text>
        </svg>
      </div>
      {/* Two column legend */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 24px" }}>
        {[...col1, ...col2].map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid "+C.creamDark }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: s.color, flexShrink: 0 }}/>
            <span style={{ fontSize: 16, color: C.text, fontFamily: "Georgia,serif", flex: 1 }}>{s.label}</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.textLight }}>{s.count}</span>
            <span style={{ fontSize: 14, color: C.textLight }}>({s.pct}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PageScoreBar({ pages }) {
  if (!pages || pages.length === 0) return null;
  const scored = pages.filter(p => p.result?.score != null);
  if (scored.length === 0) return null;
  return (
    <div>
      {scored.map((p, i) => (
        <div key={i} style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 17, color: C.text, fontFamily: "Georgia,serif", fontWeight: 600 }}>{p.label}</span>
            <span style={{ fontSize: 17, fontWeight: 700, color: scoreColor(p.result.score) }}>{p.result.score}/100</span>
          </div>
          <div style={{ height: 14, background: C.creamDark, borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", width: (p.result.score)+"%", background: scoreColor(p.result.score), borderRadius: 99, transition: "width 1s ease" }}/>
          </div>
        </div>
      ))}
    </div>
  );
}

function classifyPageType(url) {
  const path = url.toLowerCase();
  if (path.includes("/blog/") || path.includes("/news/") || path.includes("/journal/") || path.includes("/post/")) return "blog";
  if (path.includes("/p/") || path.includes("/product/") || path.includes("/store/") || path.match(/\/shop\//)) return "product";
  if (path.includes("/privacy") || path.includes("/terms") || path.includes("/legal") || path.includes("/cookie") || path.includes("/policy")) return "policy";
  if (path.includes("/event/") || path.includes("/events/")) return "event";
  if (path.match(/\/shop$/)) return "web"; // shop landing page = web page
  return "web";
}

function buildSiteProfile(pages, totalPageCount, allPageUrls) {
  let pdfs = 0, videos = 0, forms = 0;
  let webPages = 0, blogPosts = 0, productPages = 0, policyPages = 0, eventPages = 0;

  if (allPageUrls && allPageUrls.length > 0) {
    allPageUrls.forEach(url => {
      const type = classifyPageType(url);
      if (type === "blog") blogPosts++;
      else if (type === "product") productPages++;
      else if (type === "policy") policyPages++;
      else if (type === "event") eventPages++;
      else webPages++;
    });
  } else {
    webPages = totalPageCount;
  }

  pages.forEach(p => {
    if (!p.result) return;
    pdfs += p.result.pdfCount || 0;
    (p.result.violations || []).forEach(v => {
      const cat = (v.category || "").toLowerCase();
      if (cat.includes("video") || cat.includes("media")) videos++;
      if (cat.includes("form")) forms++;
    });
  });

  let tier, tierPrice, tierPages;
  if (totalPageCount <= 10) { tier = "Core"; tierPrice = "$47"; tierPages = "Up to 10 pages"; }
  else if (totalPageCount <= 25) { tier = "Standard"; tierPrice = "$92"; tierPages = "Up to 25 pages"; }
  else if (totalPageCount <= 50) { tier = "Comprehensive"; tierPrice = "$182"; tierPages = "Up to 50 pages"; }
  else { tier = "Enterprise"; tierPrice = "Custom"; tierPages = "50+ pages"; }

  return { pdfs, videos, forms, webPages, blogPosts, productPages, policyPages, eventPages, tier, tierPrice, tierPages, totalPageCount };
}

function groupViolations(violations) {
  const grouped = {};
  violations.forEach(v => {
    const key = v.category+"_"+v.impact;
    if (!grouped[key]) grouped[key] = { ...v, count: 1 };
    else grouped[key].count++;
  });
  return Object.values(grouped);
}

function severityLabel(score) {
  if (score >= 80) return { label: "Good", color: C.blue, bg: "#eef4f6" };
  if (score >= 60) return { label: "Needs Work", color: C.goldDark, bg: "#fdf8ec" };
  if (score >= 40) return { label: "Poor", color: "#b07020", bg: "#fff8f0" };
  return { label: "Critical", color: "#8a4a4a", bg: "#fef2f2" };
}

function ViolationCard({ v, colorMap }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = impactConfig[v.impact] || impactConfig.minor;
  const isSkipNav = v.category && v.category.toLowerCase().includes("skip");
  const dotColor = colorMap[v.category] || cfg.dot;

  return (
    <div onClick={() => setExpanded(o => !o)} style={{ border: "1px solid "+(expanded?cfg.border:C.border), borderRadius: 3, marginBottom: 8, cursor: "pointer", background: expanded?cfg.bg:C.white, transition: "all 0.2s ease", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px" }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: dotColor, flexShrink: 0 }}/>
        <div style={{ flex: 1 }}>
          <span style={{ fontWeight: 700, fontSize: 17, color: C.text, fontFamily: "Georgia,serif" }}>
            {v.category}{v.count > 1 ? " ("+v.count+" instances)" : ""}
          </span>
          {isSkipNav && <span style={{ marginLeft: 8, fontSize: 12, padding: "2px 8px", borderRadius: 2, background: "#f0f0ff", color: "#4444aa", border: "1px solid #aaaadd" }}>Platform limitation</span>}
        </div>
        <span style={{ fontSize: 12, color: cfg.text, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", background: cfg.bg, padding: "3px 8px", borderRadius: 2, border: "1px solid "+cfg.border }}>{v.impact}</span>
        <span style={{ color: C.textLight, fontSize: 14, marginLeft: 4 }}>{expanded?"▲":"▼"}</span>
      </div>
      {expanded && (
        <div style={{ padding: "0 18px 16px", borderTop: "1px solid "+cfg.border }}>
          <p style={{ margin: "12px 0 10px", fontSize: 16, color: C.text, lineHeight: 1.75, fontFamily: "Georgia,serif" }}>{v.issue}</p>
          {isSkipNav && (
            <div style={{ background: "#f0f0ff", border: "1px solid #aaaadd", borderRadius: 3, padding: "10px 14px", fontSize: 15, color: "#333366", marginBottom: 10, fontFamily: "Georgia,serif" }}>
              <strong>Note:</strong> Squarespace includes a skip navigation link by default but it may not function correctly in all templates. Custom code injection may be required.
            </div>
          )}
          <div style={{ background: C.creamDark, border: "1px solid "+C.border, borderRadius: 3, padding: "12px 16px", fontSize: 15, color: C.text, fontFamily: "Georgia,serif" }}>
            🔒 <strong>Full remediation details, page locations, and fix instructions are included in the paid report.</strong>
          </div>
        </div>
      )}
    </div>
  );
}

function PageResult({ page, colorMap }) {
  const [open, setOpen] = useState(false);
  const grouped = page.result?.violations ? groupViolations(page.result.violations) : [];
  const sev = severityLabel(page.result?.score ?? 0);

  return (
    <div style={{ border: "1px solid "+C.border, borderRadius: 3, marginBottom: 12, background: C.white, overflow: "hidden" }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: 18, padding: "16px 20px", cursor: "pointer" }}>
        <ScoreRing score={page.result?.score ?? 0} size={64}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.text, fontFamily: "Georgia,serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{page.label}</div>
          <div style={{ fontSize: 14, color: C.textLight, marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{page.url}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <span style={{ padding: "3px 10px", borderRadius: 2, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", background: sev.bg, color: sev.color }}>{sev.label}</span>
            <span style={{ padding: "3px 10px", borderRadius: 2, fontSize: 12, background: C.creamDark, color: C.textLight }}>{grouped.length} issue type{grouped.length!==1?"s":""}</span>
          </div>
        </div>
        <span style={{ color: C.textLight, fontSize: 16, flexShrink: 0 }}>{open?"▲":"▼"}</span>
      </div>
      {open && page.result && (
        <div style={{ borderTop: "1px solid "+C.border, padding: "18px 20px", background: C.cream }}>
          <p style={{ margin: "0 0 16px", fontSize: 16, color: C.text, lineHeight: 1.75, fontFamily: "Georgia,serif" }}>{page.result.summary}</p>
          {grouped.length === 0
            ? <div style={{ padding: "12px 16px", background: "#f0f8f4", borderRadius: 3, fontSize: 16, color: "#1a6040" }}>No violations found on this page.</div>
            : grouped.map((v, i) => <ViolationCard key={i} v={v} colorMap={colorMap}/>)
          }
        </div>
      )}
      {open && page.error && (
        <div style={{ borderTop: "1px solid "+C.border, padding: "14px 20px", background: "#fef2f2" }}>
          <span style={{ fontSize: 15, color: "#8b1a1a", fontFamily: "Georgia,serif" }}>Could not audit: {page.error}</span>
        </div>
      )}
    </div>
  );
}

export default function Results() {
  const router = useRouter();
  const [data, setData] = useState(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("auditResults");
    if (stored) {
      try { setData(JSON.parse(stored)); } catch { router.push("/"); }
    } else {
      router.push("/");
    }
  }, []);

  if (!data) return (
    <div style={{ minHeight: "100vh", background: C.cream, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ fontSize: 18, color: C.textLight, fontFamily: "Georgia,serif" }}>Loading results…</p>
    </div>
  );

  const { pages, siteScore, totalPageCount, allPageUrls } = data;
  const siteProfile = buildSiteProfile(pages, totalPageCount, allPageUrls);
  const allViolations = pages.flatMap(p => p.result?.violations || []);

  // Build violation category counts for donut
  const catCounts = {};
  allViolations.forEach(v => { catCounts[v.category] = (catCounts[v.category]||0)+1; });
  const violationByCategory = Object.entries(catCounts).map(([label, value]) => ({ label, value })).sort((a,b) => b.value-a.value).slice(0,8);

  // Build color map so violation bullets match donut
  const colorMap = {};
  violationByCategory.forEach((d, i) => { colorMap[d.label] = CHART_COLORS[i % CHART_COLORS.length]; });

  // Client summary
  const totalViolations = allViolations.length;
  const topCategories = violationByCategory.slice(0,3).map(d => d.label).join(", ");
  const clientSummary = `Your site scored ${siteScore}/100 for ADA accessibility across ${pages.length} pages audited. We found ${totalViolations} violations, with the most common issues in: ${topCategories}. A full compliance report will include exact page locations, the specific HTML causing each issue, and step-by-step remediation guidance.`;

  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontFamily: "Georgia,serif", paddingBottom: 80 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap');
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; }
      `}</style>

      {/* Header */}
      <div style={{ background: C.blue, padding: "28px 24px", textAlign: "center", borderBottom: "2px solid "+C.blueDark }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <button onClick={() => router.push("/")} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: C.white, padding: "8px 18px", fontSize: 15, fontFamily: "Georgia,serif", cursor: "pointer", borderRadius: 2, letterSpacing: "0.06em" }}>
            ← Run New Audit
          </button>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 13, color: C.gold, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>Audit Results</div>
            <div style={{ fontSize: 28, color: C.white, fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 600 }}>ADA Accessibility Report</div>
          </div>
          <a href={"mailto:TarabanStudio@gmail.com?subject=ADA Report Request - "+siteProfile.tier+"&body=I just ran a free audit and received a score of "+siteScore+"/100. I would like a full "+siteProfile.tier+" report."} style={{ display: "inline-block", padding: "8px 18px", background: C.gold, color: C.blueDark, fontSize: 15, fontFamily: "Georgia,serif", textDecoration: "none", borderRadius: 2, fontWeight: 700, letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
            Get My Report →
          </a>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 40px" }}>

        {/* Overall Score */}
        <div style={{ background: C.blue, padding: "32px 36px", marginBottom: 24, animation: "fadeIn 0.4s ease", display: "flex", gap: 32, alignItems: "center", flexWrap: "wrap", borderRadius: 2 }}>
          <ScoreRing score={siteScore} size={120}/>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 13, color: C.gold, textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 8, fontWeight: 700 }}>Overall Site Score</div>
            <div style={{ fontSize: 30, fontWeight: 300, color: C.white, marginBottom: 8, fontFamily: "'Cormorant Garamond',Georgia,serif" }}>
              {pages.length} of {totalPageCount} pages audited
            </div>
            {totalPageCount > pages.length && (
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>
                Your full {totalPageCount}-page site audit is available in the paid report
              </div>
            )}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <span style={{ padding: "5px 14px", fontSize: 15, background: "rgba(255,255,255,0.15)", color: C.white, borderRadius: 2 }}>{totalViolations} violations found</span>
              {siteProfile.pdfs > 0 && <span style={{ padding: "5px 14px", fontSize: 15, background: "rgba(232,201,106,0.2)", color: C.gold, fontWeight: 700, borderRadius: 2 }}>{siteProfile.pdfs} PDFs — quoted separately</span>}
            </div>
          </div>
        </div>

        {/* Client Summary */}
        <div style={{ background: C.white, border: "1px solid "+C.border, padding: "24px 28px", marginBottom: 24, animation: "fadeIn 0.5s ease", borderRadius: 2 }}>
          <div style={{ fontSize: 13, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 14, fontWeight: 700 }}>Audit Summary</div>
          <p style={{ margin: "0 0 16px", fontSize: 20, color: C.text, lineHeight: 1.85, fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 400 }}>{clientSummary}</p>
          <p style={{ margin: 0, fontSize: 15, color: C.textLight, fontStyle: "italic" }}>
            The free audit shows what categories of issues exist. The full paid report shows exactly where they are and how to fix them.
          </p>
        </div>

        {/* Site Profile */}
        <div style={{ background: C.white, border: "1px solid "+C.border, padding: "24px 28px", marginBottom: 24, borderRadius: 2 }}>
          <div style={{ fontSize: 14, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 20, fontWeight: 700 }}>Site Profile</div>
          
          {/* Page type breakdown - editorial circles */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 700, marginBottom: 20 }}>
              {totalPageCount} total pages found in sitemap
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start" }}>
              {[
                { label: "Web Pages", value: siteProfile.webPages },
                { label: "Blog Posts", value: siteProfile.blogPosts },
                { label: "Product Pages", value: siteProfile.productPages },
                { label: "Policy Pages", value: siteProfile.policyPages },
                { label: "Event Pages", value: siteProfile.eventPages },
              ].filter(s => s.value > 0).map((stat, i) => (
                <div key={i} style={{ textAlign: "center", minWidth: 90 }}>
                  <div style={{
                    width: 90, height: 90, borderRadius: "50%",
                    border: "2px solid "+C.border,
                    background: C.cream,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 10px",
                  }}>
                    <span style={{ fontSize: 36, fontWeight: 600, color: C.blue, fontFamily: "'Cormorant Garamond',Georgia,serif", lineHeight: 1 }}>{stat.value}</span>
                  </div>
                  <div style={{ fontSize: 13, color: C.textLight, lineHeight: 1.3 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional assets */}
          {(siteProfile.pdfs > 0 || siteProfile.forms > 0) && (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
              {siteProfile.pdfs > 0 && <div style={{ padding: "8px 14px", background: "#fff8f0", border: "1px solid #f5c896", borderRadius: 3, fontSize: 14, color: "#8b4a12" }}><strong>{siteProfile.pdfs}</strong> PDFs detected — remediation quoted separately</div>}
              {siteProfile.forms > 0 && <div style={{ padding: "8px 14px", background: C.cream, border: "1px solid "+C.border, borderRadius: 3, fontSize: 14, color: C.text }}><strong>{siteProfile.forms}</strong> forms found</div>}
            </div>
          )}

          {/* Tier recommendation */}
          <div style={{ background: C.blue, padding: "18px 22px", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
            <div>
              <div style={{ fontSize: 12, color: C.gold, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 700, marginBottom: 4 }}>Recommended Report Tier</div>
              <div style={{ fontSize: 22, fontWeight: 600, color: C.white, fontFamily: "'Cormorant Garamond',Georgia,serif" }}>
                {siteProfile.tier} Report — {siteProfile.tierPrice}
              </div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", marginTop: 2 }}>{siteProfile.tierPages}</div>
            </div>
            <a href={"mailto:TarabanStudio@gmail.com?subject=ADA "+siteProfile.tier+" Report Request&body=I just ran a free audit and received a score of "+siteScore+"/100. I would like a full "+siteProfile.tier+" report ("+siteProfile.tierPrice+")."} style={{ display: "inline-block", padding: "12px 24px", background: C.gold, color: C.blueDark, fontSize: 15, letterSpacing: "0.08em", textTransform: "uppercase", textDecoration: "none", borderRadius: 2, fontWeight: 700, whiteSpace: "nowrap" }}>
              Get My Report →
            </a>
          </div>
        </div>

        {/* Charts */}
        {violationByCategory.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20, marginBottom: 24, animation: "fadeIn 0.6s ease" }}>
            <div style={{ background: C.white, border: "1px solid "+C.border, padding: "28px 28px", borderRadius: 2 }}>
              <div style={{ fontSize: 14, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 6, fontWeight: 700 }}>Violation Breakdown</div>
              <p style={{ fontSize: 16, color: C.textLight, margin: "0 0 20px", lineHeight: 1.6 }}>
                The types of accessibility issues found across all audited pages, ranked by frequency.
              </p>
              <DonutChart data={violationByCategory}/>
            </div>
            <div style={{ background: C.white, border: "1px solid "+C.border, padding: "28px 28px", borderRadius: 2 }}>
              <div style={{ fontSize: 14, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 6, fontWeight: 700 }}>Page Compliance Scores</div>
              <p style={{ fontSize: 16, color: C.textLight, margin: "0 0 20px", lineHeight: 1.6 }}>
                Each page scored 0–100. Higher is better. Pages scoring below 60 have significant accessibility barriers.
              </p>
              <PageScoreBar pages={pages}/>
            </div>
          </div>
        )}

        {/* Page Results */}
        <div style={{ marginBottom: 48, animation: "fadeIn 0.3s ease" }}>
          <div style={{ fontSize: 15, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid "+C.border, fontWeight: 700 }}>
            Page-by-Page Results
          </div>
          <p style={{ fontSize: 15, color: C.textLight, margin: "0 0 16px", lineHeight: 1.7 }}>
            Click any page to see the types of violations found. Exact locations and fix instructions are in the paid report.
          </p>
          {pages.map((page, i) => <PageResult key={i} page={page} colorMap={colorMap}/>)}
        </div>

        {/* Bottom CTA */}
        <div style={{ background: C.blue, padding: "36px 40px", borderRadius: 2, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: C.gold, textTransform: "uppercase", letterSpacing: "0.18em", fontWeight: 700, marginBottom: 12 }}>Ready to Fix This?</div>
          <p style={{ fontSize: 22, color: C.white, fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 400, lineHeight: 1.8, maxWidth: 560, margin: "0 auto 24px" }}>
            Your full {siteProfile.tier} report includes every violation, its exact location on the page, and step-by-step fix instructions.
          </p>
          <a href={"mailto:TarabanStudio@gmail.com?subject=ADA "+siteProfile.tier+" Report Request&body=I just ran a free audit and received a score of "+siteScore+"/100. I would like a full "+siteProfile.tier+" report ("+siteProfile.tierPrice+")."} style={{ display: "inline-block", padding: "14px 32px", background: C.gold, color: C.blueDark, fontSize: 17, letterSpacing: "0.08em", textTransform: "uppercase", textDecoration: "none", borderRadius: 2, fontWeight: 700 }}>
            Get My {siteProfile.tier} Report — {siteProfile.tierPrice}
          </a>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 16, fontStyle: "italic" }}>
            PDFs are quoted separately. The average ADA lawsuit settlement costs $25,000–$75,000.
          </p>
        </div>

      </div>
    </div>
  );
}
