"use client";

import { Check, Palette, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import styles from "./visual-editor.module.css";

/**
 * Simple visual editor (paid plans): click any text in the site to change
 * it, and tweak the site's colour palette.
 *
 * How it works — the generated page runs in a sandboxed iframe we can't
 * reach into, so:
 *  1. We parse the page into a *clean* Document here in the parent and tag
 *     every plain-text element (no child elements besides <br>) with
 *     data-aduma-edit="n".
 *  2. The iframe gets an edit-mode copy: scripts removed (no confetti or
 *     timers mid-edit), animations off, plus a tiny script that makes the
 *     tagged elements editable and posts each change back.
 *  3. Changes are applied to the clean Document (textContent only, never
 *     HTML), so runtime DOM changes made by the page's own scripts never
 *     leak into the saved HTML.
 *  4. Colours are the page's CSS custom properties with hex values; we
 *     rewrite them in the <style> text and preview them live.
 * No AI calls, so editing is free and doesn't touch the edit quota.
 */

const EDITABLE = new Set([
  "H1", "H2", "H3", "H4", "H5", "H6", "P", "LI", "A", "BUTTON", "SPAN", "FIGCAPTION", "BLOCKQUOTE",
  "CITE", "LABEL", "SUMMARY", "DT", "DD", "STRONG", "EM", "SMALL", "TD", "TH", "Q", "TIME",
]);
const MAX_COLOURS = 8;
const HEX = /^#[0-9a-f]{6}$/i;

/** Injected into the edit-mode copy of the page only (never saved). */
const EDITOR_STYLE = `<style data-aduma-editor>[data-aduma-edit]{outline:2px dashed transparent;outline-offset:3px;border-radius:3px;cursor:text}[data-aduma-edit]:hover{outline-color:rgba(255,43,214,.65)}[data-aduma-edit]:focus{outline:2px solid #ff2bd6;outline-offset:3px}*,*::before,*::after{animation:none!important;transition:none!important}.reveal{opacity:1!important;transform:none!important}</style>`;
const EDITOR_SCRIPT = `<script data-aduma-editor>(function(){var timers={};function send(el){var id=el.getAttribute('data-aduma-edit');clearTimeout(timers[id]);timers[id]=setTimeout(function(){parent.postMessage({type:'aduma-edit',id:id,text:el.innerText.replace(/\\n+$/,'')},'*')},120)}document.querySelectorAll('[data-aduma-edit]').forEach(function(el){el.setAttribute('contenteditable','plaintext-only');if(el.contentEditable!=='plaintext-only')el.setAttribute('contenteditable','true');el.spellcheck=true;el.addEventListener('input',function(){send(el)});el.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey&&!/^(P|BLOCKQUOTE|DD|LI)$/.test(el.tagName)){e.preventDefault();el.blur()}});el.addEventListener('paste',function(e){e.preventDefault();var s=(e.clipboardData||window.clipboardData).getData('text/plain');document.execCommand('insertText',false,s)})});document.addEventListener('click',function(e){var t=e.target;if(t&&t.closest&&t.closest('a,button'))e.preventDefault()},true);document.addEventListener('submit',function(e){e.preventDefault()},true);addEventListener('message',function(e){if(e.source!==parent)return;var d=e.data;if(d&&d.type==='aduma-colour'&&/^--[\\w-]+$/.test(d.name)&&/^#[0-9a-f]{6}$/i.test(d.value))document.documentElement.style.setProperty(d.name,d.value)})})();</script>`;

interface Colour {
  name: string;
  value: string;
}

export function VisualEditor({
  html,
  onSave,
  onCancel,
}: {
  html: string;
  onSave: (html: string) => void;
  onCancel: () => void;
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const docRef = useRef<Document | null>(null);
  const [colours, setColours] = useState<Colour[]>([]);
  const [showColours, setShowColours] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Parse once per source page; the edit view is derived from the clean doc.
  const parsed = useMemo(() => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    tagEditable(doc);
    return { doc, view: buildEditView(doc), colours: readColours(doc) };
  }, [html]);

  useEffect(() => {
    docRef.current = parsed.doc;
    setColours(parsed.colours);
    setDirty(false);
  }, [parsed]);

  // Receive text edits from the frame.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frameRef.current?.contentWindow) return;
      const data = e.data as { type?: string; id?: string; text?: string };
      if (data?.type !== "aduma-edit" || typeof data.text !== "string" || !/^\d+$/.test(String(data.id))) return;
      const el = docRef.current?.querySelector(`[data-aduma-edit="${data.id}"]`);
      if (!el) return;
      setText(el, data.text.slice(0, 2000));
      setDirty(true);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const changeColour = useCallback((name: string, value: string) => {
    if (!HEX.test(value) || !docRef.current) return;
    writeColour(docRef.current, name, value);
    setColours((cs) => cs.map((c) => (c.name === name ? { ...c, value } : c)));
    frameRef.current?.contentWindow?.postMessage({ type: "aduma-colour", name, value }, "*");
    setDirty(true);
  }, []);

  const save = () => {
    const doc = docRef.current;
    if (!doc) return;
    onSave(serialize(doc));
  };

  // Esc closes the colour panel.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showColours) setShowColours(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showColours]);

  return (
    <div className={styles.editor}>
      <iframe
        ref={frameRef}
        title="Visual editor"
        className={styles.frame}
        srcDoc={parsed.view}
        sandbox="allow-scripts"
      />

      <div className={styles.bar} role="toolbar" aria-label="Editor">
        <p className={styles.hint}>
          <span aria-hidden>✏️</span> Click any text to edit it
        </p>
        <div className={styles.actions}>
          {colours.length > 0 && (
            <button
              type="button"
              className={cn("btn btn-ghost btn-sm", styles.barBtn)}
              aria-expanded={showColours}
              aria-controls="editor-colours"
              onClick={() => setShowColours((s) => !s)}
            >
              <Palette aria-hidden /> Colours
            </button>
          )}
          <button
            type="button"
            className={cn("btn btn-ghost btn-sm", styles.barBtn)}
            onClick={() => {
              if (!dirty || window.confirm("Discard your changes?")) onCancel();
            }}
          >
            <X aria-hidden /> Discard
          </button>
          <button type="button" className="btn btn-electric btn-sm" onClick={save} disabled={!dirty}>
            <Check aria-hidden /> Save
          </button>
        </div>

        {showColours && (
          <div id="editor-colours" className={styles.colours} role="group" aria-label="Site colours">
            {colours.map((c) => (
              <label key={c.name} className={styles.swatch}>
                <input type="color" value={c.value} onChange={(e) => changeColour(c.name, e.target.value)} />
                <span>{prettyName(c.name)}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Document helpers (all operate on the clean parent-side Document) ───── */

function tagEditable(doc: Document) {
  let n = 0;
  doc.body.querySelectorAll("*").forEach((el) => {
    if (!EDITABLE.has(el.tagName)) return;
    if (el.closest("script,style,noscript,svg,template,[aria-hidden='true']")) return;
    const onlyBreaks = Array.from(el.children).every((c) => c.tagName === "BR");
    if (!onlyBreaks || !el.textContent?.trim()) return;
    el.setAttribute("data-aduma-edit", String(n++));
  });
}

/** Edit-mode copy: no page scripts, editor helpers injected. */
function buildEditView(doc: Document): string {
  const copy = doc.cloneNode(true) as Document;
  copy.querySelectorAll("script").forEach((s) => s.remove());
  copy.head.insertAdjacentHTML("beforeend", EDITOR_STYLE);
  copy.body.insertAdjacentHTML("beforeend", EDITOR_SCRIPT);
  return `<!doctype html>\n${copy.documentElement.outerHTML}`;
}

function setText(el: Element, text: string) {
  const doc = el.ownerDocument;
  el.textContent = "";
  text.split("\n").forEach((line, i) => {
    if (i) el.appendChild(doc.createElement("br"));
    el.appendChild(doc.createTextNode(line));
  });
}

function serialize(doc: Document): string {
  const copy = doc.cloneNode(true) as Document;
  copy.querySelectorAll("[data-aduma-edit]").forEach((el) => el.removeAttribute("data-aduma-edit"));
  return `<!doctype html>\n${copy.documentElement.outerHTML}`;
}

const VAR_HEX = /(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3})(?![0-9a-fA-F])/g;

function readColours(doc: Document): Colour[] {
  const seen = new Map<string, string>();
  doc.querySelectorAll("style").forEach((style) => {
    for (const m of (style.textContent ?? "").matchAll(VAR_HEX)) {
      const name = m[1]!;
      if (!seen.has(name)) seen.set(name, expandHex(m[2]!));
    }
  });
  return Array.from(seen, ([name, value]) => ({ name, value })).slice(0, MAX_COLOURS);
}

function writeColour(doc: Document, name: string, value: string) {
  const re = new RegExp(`(${name.replace(/[-]/g, "\\-")}\\s*:\\s*)#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9a-fA-F])`, "g");
  doc.querySelectorAll("style").forEach((style) => {
    if (style.textContent) style.textContent = style.textContent.replace(re, `$1${value}`);
  });
}

function expandHex(hex: string): string {
  const h = hex.toLowerCase();
  return h.length === 4 ? `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}` : h;
}

/** "--accent-2" → "Accent 2", "--bg" → "Background" */
function prettyName(name: string): string {
  const raw = name.replace(/^--/, "");
  const known: Record<string, string> = { bg: "Background", fg: "Text", text: "Text", a: "Accent", a2: "Accent 2", muted: "Muted text", surface: "Cards" };
  if (known[raw]) return known[raw];
  return raw.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
