/**
 * "View source" deterrent for published sites.
 *
 * Injects a tiny script into a site's HTML that blocks the right-click
 * menu, dragging, and the common view-source / save / devtools shortcuts
 * (Ctrl/Cmd+U, Ctrl/Cmd+S, F12, Ctrl/Cmd+Shift+I/J/C).
 *
 * Honest caveat: anything a browser can display, a determined person can
 * still extract (browser menus, devtools opened before load, network
 * tools). This stops casual copying; it is not DRM. Published pages are
 * also loaded client-side into a sandboxed frame, so the page's own
 * "view source" shows the app shell rather than the site.
 */
const PROTECT_SCRIPT = `<script>(function(){var d=document;function no(e){e.preventDefault();return false}d.addEventListener('contextmenu',no);d.addEventListener('dragstart',no);d.addEventListener('keydown',function(e){var k=(e.key||'').toLowerCase(),m=e.ctrlKey||e.metaKey;if(k==='f12'||(m&&(k==='u'||k==='s'))||(m&&e.shiftKey&&(k==='i'||k==='j'||k==='c'))){e.preventDefault();e.stopPropagation()}},true)})();</script>`;

export function protectHtml(html: string): string {
  if (html.includes("data-aduma-protect")) return html;
  const tagged = PROTECT_SCRIPT.replace("<script>", '<script data-aduma-protect="">');
  return html.includes("</body>") ? html.replace("</body>", `${tagged}</body>`) : html + tagged;
}

/** Same protection for a host page (the /p/[slug] viewer around the frame). */
export function protectDocument(doc: Document): () => void {
  const no = (e: Event) => e.preventDefault();
  const onKey = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    const m = e.ctrlKey || e.metaKey;
    if (k === "f12" || (m && (k === "u" || k === "s")) || (m && e.shiftKey && ["i", "j", "c"].includes(k))) e.preventDefault();
  };
  doc.addEventListener("contextmenu", no);
  doc.addEventListener("keydown", onKey, true);
  return () => {
    doc.removeEventListener("contextmenu", no);
    doc.removeEventListener("keydown", onKey, true);
  };
}
