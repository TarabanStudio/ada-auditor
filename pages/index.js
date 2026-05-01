import { useState } from "react";
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

function Star({ size = 20, color = C.gold }) {
  const arms = 8, points = [];
  for (let i = 0; i < arms * 2; i++) {
    const angle = (i * Math.PI) / arms - Math.PI / 2;
    const r = i % 2 === 0 ? size / 2 : size / 5;
    points.push((size/2 + r*Math.cos(angle)).toFixed(2)+","+(size/2+r*Math.sin(angle)).toFixed(2));
  }
  return <svg width={size} height={size} viewBox={"0 0 "+size+" "+size} style={{display:"inline-block",flexShrink:0}}><polygon points={points.join(" ")} fill={color}/></svg>;
}

function AccordionItem({ question, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid "+C.border }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 0", cursor: "pointer" }}>
        <span style={{ fontSize: 20, color: C.blue, fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 600 }}>{question}</span>
        <span style={{ fontSize: 22, color: C.textLight, marginLeft: 20, flexShrink: 0 }}>{open?"−":"+"}</span>
      </div>
      {open && <div style={{ paddingBottom: 24, fontSize: 17, color: C.text, lineHeight: 1.85, fontFamily: "Georgia,serif" }}>{children}</div>}
    </div>
  );
}

async function serverFetch(url) {
  const res = await fetch("/api/fetch-url", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({url}) });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.html;
}

async function serverAudit(html, label) {
  const res = await fetch("/api/audit", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({html, label}) });
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

function getPageLabel(url) {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/$/, "") || "/";
    if (path === "/") return "Home";
    return path.split("/").filter(Boolean).pop().replace(/-/g," ").replace(/\b\w/g,c=>c.toUpperCase());
  } catch { return url; }
}

export default function Landing() {
  const router = useRouter();
  const [mode, setMode] = useState("url");
  const [url, setUrl] = useState("");
  const [pastedHtml, setPastedHtml] = useState("");
  const [pasteLabel, setPasteLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState("");
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState("");

  const canRun = mode === "url" ? url.trim().length > 0 : pastedHtml.trim().length > 0;
  const progressPct = progress.total > 0 ? (progress.current/progress.total)*100 : 0;

  async function runPasteAudit() {
    if (!pastedHtml.trim()) return;
    setLoading(true); setError(""); setStage("Analyzing pasted HTML…");
    const label = pasteLabel.trim() || "Pasted Page";
    try {
      const result = await serverAudit(pastedHtml, label);
      const pages = [{ url: label, label, result, error: null }];
      sessionStorage.setItem("auditResults", JSON.stringify({ pages, siteScore: result.score, totalPageCount: 1, allPageUrls: [] }));
      router.push("/results");
    } catch (e) { setError(e.message || "Analysis failed."); setLoading(false); setStage(""); }
  }

  async function runFullAudit() {
    setError("");
    let cleanUrl = url.trim();
    if (!cleanUrl) return;
    if (!cleanUrl.startsWith("http")) cleanUrl = "https://" + cleanUrl;
    let baseHost;
    try { baseHost = new URL(cleanUrl).hostname; } catch { setError("Invalid URL."); return; }
    setLoading(true); setStage("Looking for sitemap…");
    let pageUrls = [];
    for (const sUrl of ["https://"+baseHost+"/sitemap.xml","https://"+baseHost+"/sitemap_index.xml","https://"+baseHost+"/page-sitemap.xml"]) {
      try { const xml = await serverFetch(sUrl); const found = await extractUrlsFromSitemap(xml, baseHost); if (found.length > 0) { pageUrls = found; break; } } catch { continue; }
    }
    if (pageUrls.length === 0) { setStage("No sitemap — auditing homepage…"); pageUrls = [cleanUrl]; }
    const fullPageCount = pageUrls.length;
    const allPageUrls = [...pageUrls];
    const skipPatterns = ["divider","sonora","light-life","living-book","resplendent","folder","config","cart","account","search"];
    pageUrls = pageUrls.filter(u => !skipPatterns.some(p => u.toLowerCase().includes(p))).slice(0, 2);
    setProgress({ current: 0, total: pageUrls.length });
    const results = [];
    for (let i = 0; i < pageUrls.length; i++) {
      const pageUrl = pageUrls[i];
      const label = getPageLabel(pageUrl);
      setStage("Auditing: " + label + " (" + (i+1) + "/" + pageUrls.length + ")");
      setProgress({ current: i+1, total: pageUrls.length });
      let pageResult = null, pageError = null;
      try { const html = await serverFetch(pageUrl); pageResult = await serverAudit(html, label); } catch (e) { pageError = e.message || "Failed"; }
      results.push({ url: pageUrl, label, result: pageResult, error: pageError });
    }
    const scored = results.filter(r => r.result?.score != null);
    const siteScore = scored.length > 0 ? Math.round(scored.reduce((s,r) => s+r.result.score, 0) / scored.length) : 0;
    sessionStorage.setItem("auditResults", JSON.stringify({ pages: results, siteScore, totalPageCount: fullPageCount, allPageUrls }));
    router.push("/results");
  }

  const auditCategories = [
    { title: "Images, Charts & Maps", desc: "Missing or empty alt text, decorative images not hidden, charts without text alternatives" },
    { title: "Page Structure", desc: "Heading hierarchy (H1–H3), language declaration, skip-to-content navigation" },
    { title: "Navigation & Links", desc: "Vague link text like 'click here,' buttons without accessible labels" },
    { title: "Forms", desc: "Input fields missing labels, no error identification or instructions" },
    { title: "Landmarks & Regions", desc: "Missing semantic elements — nav, main, header, footer — and ARIA roles" },
    { title: "Color & Contrast", desc: "Poor color contrast ratios that make text difficult to read" },
    { title: "Documents & PDFs", desc: "PDF files that require their own separate remediation process" },
    { title: "Tables & Data", desc: "Tables missing captions or header attributes, unreadable by screen readers" },
    { title: "Language & Metadata", desc: "Missing page language declarations and descriptive page titles" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontFamily: "Georgia,serif", paddingBottom: 80 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        ::placeholder { color: #8a9ea3; font-size: 16px; }
      `}</style>

      {/* Header */}
      <div style={{ background: C.blue, padding: "36px 24px 32px", textAlign: "center", borderBottom: "2px solid "+C.blueDark }}>
        <div style={{ marginBottom: 14 }}><Star size={32} color={C.gold}/></div>
        <h1 style={{ margin: "0 0 12px", fontSize: 52, color: C.white, fontWeight: 600, fontFamily: "'Cormorant Garamond',Georgia,serif", letterSpacing: "0.06em", lineHeight: 1.1 }}>
          ADA Accessibility Audit
        </h1>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.7)", fontSize: 18, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Sitemap Crawl &nbsp;·&nbsp; Page-by-Page Analysis &nbsp;·&nbsp; Compliance Report
        </p>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 40px" }}>

        {/* Intro */}
        <div style={{ textAlign: "center", padding: "52px 20px 44px" }}>
          <p style={{ fontSize: 24, color: C.text, lineHeight: 1.85, fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 600, maxWidth: 780, margin: "0 auto" }}>
            Every website deserves to be experienced by everyone. Enter any URL below to receive a free accessibility score and a page-by-page breakdown of WCAG 2.1 violations.
          </p>
        </div>

        {/* Input card */}
        <div style={{ background: C.white, border: "1px solid "+C.border, padding: "32px 32px 28px", marginBottom: 64 }}>
          <div style={{ display: "flex", gap: 0, marginBottom: 28, borderBottom: "1px solid "+C.border }}>
            {[{id:"url",label:"Enter URL"},{id:"paste",label:"Paste HTML"}].map(({id,label}) => (
              <button key={id} onClick={() => setMode(id)} style={{ padding: "10px 22px", border: "none", borderBottom: mode===id?"2px solid "+C.blue:"2px solid transparent", background: "none", color: mode===id?C.blue:C.textLight, fontSize: 16, fontFamily: "Georgia,serif", cursor: "pointer", fontWeight: mode===id?700:400, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: -1 }}>{label}</button>
            ))}
          </div>

          {mode === "url" ? (
            <>
              <label style={{ display: "block", fontSize: 14, color: C.textLight, marginBottom: 10, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700 }}>Website URL</label>
              <div style={{ display: "flex", gap: 12 }}>
                <input value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key==="Enter"&&!loading&&runFullAudit()} placeholder="e.g. yourbusiness.com"
                  style={{ flex: 1, padding: "14px 16px", border: "1px solid "+C.border, fontSize: 17, fontFamily: "Georgia,serif", outline: "none", background: C.cream, color: C.text, borderRadius: 2 }}/>
                <button onClick={runFullAudit} disabled={!canRun||loading} style={{ padding: "14px 32px", border: "none", cursor: !canRun||loading?"not-allowed":"pointer", background: !canRun||loading?C.textLight:C.blue, color: C.white, fontSize: 17, fontFamily: "Georgia,serif", whiteSpace: "nowrap", letterSpacing: "0.06em", textTransform: "uppercase", borderRadius: 2, fontWeight: 700 }}>
                  {loading ? "Auditing…" : "Audit Site"}
                </button>
              </div>
              <p style={{ marginTop: 10, fontSize: 14, color: C.textLight, lineHeight: 1.7 }}>
                Works on any public website. Password-protected sites or pages behind a login cannot be audited.
              </p>
            </>
          ) : (
            <>
              <label style={{ display: "block", fontSize: 14, color: C.textLight, marginBottom: 10, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700 }}>Page Name (optional)</label>
              <input value={pasteLabel} onChange={e => setPasteLabel(e.target.value)} placeholder="e.g. Home, About, Contact"
                style={{ width: "100%", padding: "12px 14px", border: "1px solid "+C.border, marginBottom: 18, fontSize: 17, fontFamily: "Georgia,serif", outline: "none", background: C.cream, color: C.text, borderRadius: 2 }}/>
              <label style={{ display: "block", fontSize: 14, color: C.textLight, marginBottom: 10, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700 }}>Paste Page Source HTML</label>
              <p style={{ fontSize: 15, color: C.textLight, marginBottom: 12, lineHeight: 1.7 }}>
                On desktop: right-click → View Page Source → Select All → Copy.
              </p>
              <textarea value={pastedHtml} onChange={e => setPastedHtml(e.target.value)} placeholder="Paste HTML source here…" rows={6}
                style={{ width: "100%", padding: "12px 14px", border: "1px solid "+C.border, fontSize: 14, fontFamily: "monospace", outline: "none", background: C.cream, color: C.text, resize: "vertical", borderRadius: 2 }}/>
              <button onClick={runPasteAudit} disabled={loading||!canRun} style={{ marginTop: 14, padding: "14px 28px", border: "none", cursor: loading||!canRun?"not-allowed":"pointer", background: loading||!canRun?C.textLight:C.blue, color: C.white, fontSize: 17, fontFamily: "Georgia,serif", letterSpacing: "0.06em", textTransform: "uppercase", borderRadius: 2, fontWeight: 700 }}>
                {loading?"Analyzing…":"Audit This Page"}
              </button>
            </>
          )}

          {loading && (
            <div style={{ marginTop: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ width: 16, height: 16, border: "2px solid "+C.blue, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.9s linear infinite", flexShrink: 0 }}/>
                <span style={{ fontSize: 17, color: C.textLight }}>{stage}</span>
              </div>
              {progress.total > 1 && (
                <>
                  <div style={{ height: 4, background: C.creamDark, borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", background: C.blue, width: progressPct+"%", transition: "width 0.5s ease" }}/>
                  </div>
                  <div style={{ fontSize: 14, color: C.textLight, marginTop: 6 }}>{progress.current} of {progress.total} pages audited</div>
                </>
              )}
            </div>
          )}
          {error && <div style={{ marginTop: 14, padding: "12px 16px", background: "#fef2f2", border: "1px solid #f5b8b8", borderRadius: 2, fontSize: 16, color: "#8b1a1a" }}>{error}</div>}
        </div>

        {/* What This Audit Checks */}
        <div style={{ background: C.blue, padding: "52px 48px", marginBottom: 48, borderRadius: 2 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 20 }}>
            <Star size={14} color={C.gold}/>
            <span style={{ fontSize: 13, color: C.gold, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700 }}>Audit Coverage</span>
            <Star size={14} color={C.gold}/>
          </div>
          <h2 style={{ fontSize: 38, fontWeight: 600, color: C.white, fontFamily: "'Cormorant Garamond',Georgia,serif", textAlign: "center", marginBottom: 12, marginTop: 0 }}>
            What This Audit Checks
          </h2>
          <p style={{ textAlign: "center", color: "rgba(255,255,255,0.65)", fontSize: 18, marginBottom: 40, lineHeight: 1.6 }}>
            Every page is scanned against WCAG 2.1 criteria across nine categories
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {auditCategories.map((cat, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.08)", padding: "20px 22px", borderLeft: "3px solid "+C.gold }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: C.white, fontFamily: "Georgia,serif", marginBottom: 8 }}>{cat.title}</div>
                <div style={{ fontSize: 15, color: "rgba(255,255,255,0.65)", lineHeight: 1.7 }}>{cat.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div style={{ marginBottom: 64 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 20 }}>
            <Star size={14} color={C.goldDark}/>
            <span style={{ fontSize: 13, color: C.goldDark, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700 }}>Report Pricing</span>
            <Star size={14} color={C.goldDark}/>
          </div>
          <h2 style={{ fontSize: 38, fontWeight: 600, color: C.blue, fontFamily: "'Cormorant Garamond',Georgia,serif", textAlign: "center", marginBottom: 8, marginTop: 0 }}>
            Full Compliance Reports
          </h2>
          <p style={{ textAlign: "center", fontSize: 17, color: C.textLight, marginBottom: 36, lineHeight: 1.7, maxWidth: 600, margin: "0 auto 36px" }}>
            Run your free audit above to find out how many pages your site has. Your results will recommend the right tier automatically.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginBottom: 16 }}>
            {[
              { name: "Core", price: "$47", pages: "Up to 10 pages", desc: "Perfect for portfolios, landing pages, and small business sites" },
              { name: "Standard", price: "$92", pages: "Up to 25 pages", desc: "For growing businesses, nonprofits, and service sites" },
              { name: "Comprehensive", price: "$182", pages: "Up to 50 pages", desc: "For established businesses, e-commerce, and organizations" },
              { name: "Enterprise", price: "Custom", pages: "50+ pages", desc: "Large sites, healthcare, government, and institutions" },
            ].map((tier, i) => (
              <div key={i} style={{ background: C.white, border: "1px solid "+C.border, padding: "24px 22px", display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 13, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 700, marginBottom: 8 }}>{tier.name}</div>
                <div style={{ fontSize: 36, fontWeight: 600, color: C.blue, fontFamily: "'Cormorant Garamond',Georgia,serif", marginBottom: 4 }}>{tier.price}</div>
                <div style={{ fontSize: 14, color: C.goldDark, fontWeight: 700, marginBottom: 12 }}>{tier.pages}</div>
                <div style={{ fontSize: 15, color: C.textLight, lineHeight: 1.7, flex: 1 }}>{tier.desc}</div>
              </div>
            ))}
          </div>
          <p style={{ textAlign: "center", fontSize: 14, color: C.textLight, fontStyle: "italic", marginTop: 16 }}>
            PDFs require separate remediation and are quoted on request. The average ADA lawsuit settlement costs $25,000–$75,000.
          </p>
        </div>

        {/* Services */}
        <div style={{ background: C.creamDark, border: "1px solid "+C.border, padding: "48px 48px", marginBottom: 64, borderRadius: 2 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 20 }}>
            <Star size={14} color={C.goldDark}/>
            <span style={{ fontSize: 13, color: C.goldDark, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700 }}>Ready to Fix What We Find?</span>
            <Star size={14} color={C.goldDark}/>
          </div>
          <p style={{ textAlign: "center", fontSize: 24, color: C.text, fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 600, lineHeight: 1.85, maxWidth: 640, margin: "0 auto 40px" }}>
            Accessibility work is meaningful — it makes the web more welcoming to everyone.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            {[
              { label: "Compliance Report", title: "Detailed PDF Report", body: "A full page-by-page PDF outlining every violation, mapped to its WCAG criterion, with clear remediation guidance. Something you can act on or hand directly to your developer.", cta: "Request a Report", subject: "ADA Compliance Report Request" },
              { label: "Full Service", title: "Remediation Services", body: "Prefer to hand it off entirely? We offer full accessibility remediation for websites of all sizes — from audit through implementation.", cta: "Get in Touch", subject: "ADA Remediation Inquiry" },
            ].map((card, i) => (
              <div key={i} style={{ background: C.white, border: "1px solid "+C.border, padding: "28px 26px", display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 13, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12, fontWeight: 700 }}>{card.label}</div>
                <h3 style={{ fontSize: 24, fontWeight: 700, color: C.blue, fontFamily: "'Cormorant Garamond',Georgia,serif", marginBottom: 12, marginTop: 0 }}>{card.title}</h3>
                <p style={{ fontSize: 16, color: C.text, lineHeight: 1.8, flex: 1, marginTop: 0 }}>{card.body}</p>
                <div style={{ marginTop: 24 }}>
                  <a href={"mailto:TarabanStudio@gmail.com?subject="+card.subject} style={{ display: "inline-block", padding: "12px 24px", background: C.blue, color: C.white, fontSize: 16, letterSpacing: "0.08em", textTransform: "uppercase", textDecoration: "none", borderRadius: 2, fontWeight: 700 }}>
                    {card.cta}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div style={{ marginBottom: 64 }}>
          <h2 style={{ fontSize: 38, fontWeight: 600, color: C.blue, fontFamily: "'Cormorant Garamond',Georgia,serif", textAlign: "center", marginBottom: 32, marginTop: 0 }}>
            Understanding ADA Compliance
          </h2>
          <AccordionItem question="What is ADA Compliance?">
            The Americans with Disabilities Act (ADA) was signed into law in 1990 to protect people with disabilities from discrimination. Courts and regulators have extended it to the digital world — today, ADA compliance for websites means ensuring your site can be used by people with visual, auditory, motor, and cognitive disabilities. The technical standard is WCAG 2.1 (Web Content Accessibility Guidelines).
          </AccordionItem>
          <AccordionItem question="What Does the Law Say?">
            <p style={{ margin: "0 0 14px" }}>ADA Title III requires businesses open to the public to provide equal access — and courts have repeatedly ruled that websites count. In 2024 the Department of Justice finalized rules requiring WCAG 2.1 AA compliance for government sites, and private business lawsuits have followed the same framework for years.</p>
            <p style={{ margin: "0 0 14px" }}>Over 4,000 ADA web accessibility lawsuits were filed in 2023 alone. Small businesses are frequently targeted. Settlements typically range from $25,000 to $100,000 or more, not including legal fees.</p>
            <p style={{ margin: 0 }}>There is no official government certification for ADA compliance — which makes having a thorough, documented audit all the more important.</p>
          </AccordionItem>
          <AccordionItem question="Will this tool work on my site?">
            <p style={{ margin: "0 0 14px" }}>This tool works on any publicly accessible website — Squarespace, WordPress, Wix, Webflow, Shopify, and custom-built sites. It finds your sitemap automatically and audits up to 10 pages per scan.</p>
            <p style={{ margin: 0 }}>It will not work on password-protected sites, pages behind a login, or sites that block automated requests. If your site requires a password, use the Paste HTML tab to audit individual pages manually.</p>
          </AccordionItem>
          <AccordionItem question="Why Does It Matter for My Business?">
            <p style={{ margin: "0 0 14px" }}>Beyond legal risk, accessibility is simply good business. 1 in 4 Americans lives with a disability. An accessible website reaches a wider audience, performs better in search results, and signals to customers that your business is thoughtful and inclusive.</p>
            <p style={{ margin: 0 }}>Accessibility is no longer a niche concern. It is an expectation.</p>
          </AccordionItem>
        </div>

        {/* Disclaimer */}
        <div style={{ textAlign: "center", padding: "0 20px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: C.border }}/>
            <Star size={14} color={C.goldDark}/>
            <div style={{ flex: 1, height: 1, background: C.border }}/>
          </div>
          <p style={{ fontSize: 14, color: C.textLight, lineHeight: 1.85, maxWidth: 680, margin: "0 auto" }}>
            This tool scans publicly accessible web pages only. No data is stored or shared. Results are provided for informational purposes and do not constitute legal advice. ADA compliance should be confirmed by a qualified accessibility professional.
          </p>
        </div>

      </div>
    </div>
  );
}
