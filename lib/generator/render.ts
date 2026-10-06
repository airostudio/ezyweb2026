import type { Palette, Section, SiteSpec, StyleFamily } from "./types";

/**
 * Renders a SiteSpec into a fully self-contained HTML document: inline CSS,
 * a tiny inline script for interactivity (countdowns, confetti, guestbook,
 * RSVP, scroll reveals) and Google Fonts. It is shown inside a sandboxed
 * iframe via `srcdoc`, so it can never touch the host page.
 */
export function renderSite(spec: SiteSpec): string {
  const t = spec.theme;
  const p: Palette = t.mode === "dark" ? t.dark : t.light;
  const fonts = [...new Set([t.headingFont, t.bodyFont])]
    .map((f) => `family=${encodeURIComponent(f).replace(/%20/g, "+")}:wght@400;600;700`)
    .join("&");
  // Some display fonts ship a single weight; the API tolerates the request.
  const fontHref = `https://fonts.googleapis.com/css2?${fonts}&display=swap`;

  const body = spec.sections.map((s, i) => renderSection(s, spec, i)).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(spec.title)}</title>
<meta name="description" content="${esc(spec.tagline)}" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="${fontHref}" />
<style>
${baseCss(p, t.accent, t.accent2, t.headingFont, t.bodyFont, t.heroScale, t.mode)}
${styleCss(t.style)}
</style>
</head>
<body class="style-${t.style}">
<main>
${body}
</main>
<footer class="foot"><p>${esc(spec.footer)}</p><p class="made">Made with <a href="https://webese.ai" target="_blank" rel="noopener">Webese</a> ✦</p></footer>
<script>
${runtimeJs(t.confetti, [t.accent, t.accent2, "#ffc23d", "#ffffff"])}
</script>
</body>
</html>`;
}

function renderSection(s: Section, spec: SiteSpec, index: number): string {
  const reveal = index === 0 ? "" : " reveal";
  switch (s.kind) {
    case "hero": {
      const target = spec.sections.find((x) => x.kind === "rsvp")?.id ?? spec.sections[1]?.id ?? "";
      return `<header class="hero" id="${s.id}">
  <div class="hero-bg" aria-hidden="true"><span></span><span></span><span></span></div>
  <div class="wrap hero-inner">
    <div class="hero-emoji" aria-hidden="true">${s.emoji}</div>
    <p class="eyebrow">${esc(s.eyebrow)}</p>
    <h1>${esc(s.title)}</h1>
    <p class="sub">${esc(s.subtitle)}</p>
    <a class="btn" href="#${target}" data-confetti>${esc(s.cta)} →</a>
  </div>
</header>`;
    }
    case "about":
      return `<section class="sec${reveal}" id="${s.id}"><div class="wrap narrow"><h2>${esc(s.heading)}</h2><p class="big">${esc(s.body)}</p></div></section>`;
    case "cards":
      return `<section class="sec${reveal}" id="${s.id}"><div class="wrap"><h2>${esc(s.heading)}</h2><div class="cards">${s.items
        .map((c) => `<article class="card"><div class="card-emoji" aria-hidden="true">${c.emoji}</div><h3>${esc(c.title)}</h3><p>${esc(c.body)}</p></article>`)
        .join("")}</div></div></section>`;
    case "gallery":
      return `<section class="sec${reveal}" id="${s.id}"><div class="wrap"><h2>${esc(s.heading)}</h2><div class="gallery">${s.items
        .map((g, i) => `<figure class="tile t${i % 4}"><div class="tile-art" aria-hidden="true">${g.emoji}</div><figcaption>${esc(g.caption)}</figcaption></figure>`)
        .join("")}</div></div></section>`;
    case "countdown":
      return `<section class="sec${reveal}" id="${s.id}"><div class="wrap center"><h2>${esc(s.heading)}</h2>
  <div class="countdown" data-date="${esc(s.date)}" role="timer" aria-live="off">
    ${["days", "hours", "mins", "secs"].map((u) => `<div class="cd"><span class="cd-n" data-u="${u}">00</span><span class="cd-l">${u}</span></div>`).join("")}
  </div><p class="note">${esc(s.note)}</p></div></section>`;
    case "rsvp":
      return `<section class="sec${reveal}" id="${s.id}"><div class="wrap narrow"><div class="panel">
  <h2>${esc(s.heading)}</h2><p class="note">${esc(s.note)}</p>
  <form class="rsvp" data-rsvp>
    <label>Your name<input name="name" required autocomplete="name" placeholder="Legend McLegendface" /></label>
    <div class="choices" role="radiogroup" aria-label="Attending?">
      <label class="choice"><input type="radio" name="going" value="yes" checked /> <span>I'm in! 🙌</span></label>
      <label class="choice"><input type="radio" name="going" value="no" /> <span>Can't make it 😢</span></label>
    </div>
    <button class="btn" type="submit">Send it</button>
    <p class="thanks" hidden role="status">Legend! You're on the list 🎉</p>
  </form></div></div></section>`;
    case "quote":
      return `<section class="sec${reveal}" id="${s.id}"><div class="wrap narrow center"><blockquote><p>“${esc(s.text)}”</p><cite>— ${esc(s.by)}</cite></blockquote></div></section>`;
    case "timeline":
      return `<section class="sec${reveal}" id="${s.id}"><div class="wrap narrow"><h2>${esc(s.heading)}</h2><ol class="timeline">${s.items
        .map((t) => `<li><span class="when">${esc(t.when)}</span><span class="what">${esc(t.what)}</span></li>`)
        .join("")}</ol></div></section>`;
    case "stats":
      return `<section class="sec tight${reveal}" id="${s.id}"><div class="wrap"><dl class="stats">${s.items
        .map((x) => `<div class="stat"><dt>${esc(x.label)}</dt><dd>${esc(x.value)}</dd></div>`)
        .join("")}</dl></div></section>`;
    case "guestbook":
      return `<section class="sec${reveal}" id="${s.id}"><div class="wrap narrow"><h2>${esc(s.heading)}</h2>
  <form class="gb-form" data-guestbook><label class="sr">Your name<input name="name" placeholder="Your name" required maxlength="40" /></label><label class="sr">Message<input name="message" placeholder="Leave a message…" required maxlength="140" /></label><button class="btn small" type="submit">Sign</button></form>
  <ul class="gb">${s.entries.map((e) => `<li><strong>${esc(e.name)}</strong><span>${esc(e.message)}</span></li>`).join("")}</ul></div></section>`;
    case "faq":
      return `<section class="sec${reveal}" id="${s.id}"><div class="wrap narrow"><h2>${esc(s.heading)}</h2>${s.items
        .map((f) => `<details class="faq"><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`)
        .join("")}</div></section>`;
  }
}

function baseCss(p: Palette, a: string, a2: string, hf: string, bf: string, scale: number, mode: string): string {
  return `*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:${p.bg};--surface:${p.surface};--text:${p.text};--muted:${p.muted};--a:${a};--a2:${a2};--hf:"${hf}",system-ui,sans-serif;--bf:"${bf}",system-ui,sans-serif;--r:22px;--line:color-mix(in srgb,var(--text) 12%,transparent);color-scheme:${mode}}
html{scroll-behavior:smooth}
body{font-family:var(--bf);background:var(--bg);color:var(--text);line-height:1.6;font-size:17px;-webkit-font-smoothing:antialiased;overflow-x:hidden}
h1,h2,h3{font-family:var(--hf);line-height:1.05;letter-spacing:-.01em;text-wrap:balance}
h1{font-size:calc(clamp(2.4rem,9vw,5.5rem) * ${scale})}
h2{font-size:clamp(1.8rem,5vw,2.8rem);margin-bottom:1.5rem}
h3{font-size:1.25rem;margin:.6rem 0 .35rem}
a{color:inherit}
.wrap{width:min(1080px,100% - 2.5rem);margin-inline:auto}
.narrow{width:min(720px,100% - 2.5rem)}
.center{text-align:center}
.sec{padding:clamp(3.5rem,9vw,6rem) 0}
.sec.tight{padding:2rem 0}
.hero{position:relative;min-height:88vh;display:grid;place-items:center;text-align:center;overflow:hidden;padding:5rem 0 4rem}
.hero-bg{position:absolute;inset:0;z-index:0;filter:blur(60px);opacity:.55}
.hero-bg span{position:absolute;width:45vmax;height:45vmax;border-radius:50%;animation:drift 16s ease-in-out infinite}
.hero-bg span:nth-child(1){background:var(--a);top:-20%;left:-10%}
.hero-bg span:nth-child(2){background:var(--a2);bottom:-25%;right:-15%;animation-delay:-5s}
.hero-bg span:nth-child(3){background:color-mix(in srgb,var(--a) 50%,var(--a2));top:30%;left:40%;width:25vmax;height:25vmax;animation-delay:-9s;opacity:.6}
.hero-inner{position:relative;z-index:1;display:grid;justify-items:center;gap:1.1rem}
.hero-emoji{font-size:clamp(4rem,12vw,7rem);animation:bob 4s ease-in-out infinite;filter:drop-shadow(0 12px 24px rgb(0 0 0 / .25))}
.eyebrow{font-weight:700;text-transform:uppercase;letter-spacing:.14em;font-size:.8rem;color:var(--muted)}
.sub{max-width:36rem;font-size:clamp(1.05rem,2.4vw,1.3rem);color:var(--muted)}
.btn{display:inline-flex;align-items:center;gap:.5rem;padding:.95rem 1.6rem;border-radius:999px;background:var(--a);color:${readableOn(a)};font-weight:700;text-decoration:none;border:0;font:inherit;font-weight:700;cursor:pointer;transition:transform .25s cubic-bezier(.34,1.56,.64,1),box-shadow .25s;box-shadow:0 10px 30px -10px var(--a)}
.btn:hover{transform:translateY(-3px) rotate(-1deg);box-shadow:0 16px 40px -10px var(--a)}
.btn:active{transform:scale(.97)}
.btn.small{padding:.7rem 1.1rem}
.cards{display:grid;gap:1.1rem;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr))}
.card{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:1.6rem;transition:transform .3s cubic-bezier(.34,1.56,.64,1)}
.card:hover{transform:translateY(-6px) rotate(-.6deg)}
.card p{color:var(--muted)}
.card-emoji{font-size:2.4rem}
.gallery{display:grid;gap:1rem;grid-template-columns:repeat(auto-fill,minmax(min(100%,210px),1fr))}
.tile{border-radius:var(--r);overflow:hidden;background:var(--surface);border:1px solid var(--line);transition:transform .3s cubic-bezier(.34,1.56,.64,1)}
.tile:hover{transform:scale(1.03) rotate(1deg)}
.tile-art{aspect-ratio:4/3;display:grid;place-items:center;font-size:3.6rem}
.t0 .tile-art{background:linear-gradient(135deg,var(--a),var(--a2))}
.t1 .tile-art{background:linear-gradient(135deg,var(--a2),color-mix(in srgb,var(--a2) 40%,var(--bg)))}
.t2 .tile-art{background:radial-gradient(circle at 30% 30%,color-mix(in srgb,var(--a) 60%,#fff),var(--a))}
.t3 .tile-art{background:conic-gradient(from 90deg,var(--a),var(--a2),var(--a))}
figcaption{padding:.8rem 1rem;font-weight:600;font-size:.95rem}
.countdown{display:flex;justify-content:center;gap:clamp(.5rem,2vw,1rem);flex-wrap:wrap}
.cd{min-width:clamp(4.5rem,18vw,6.5rem);padding:1rem .5rem;border-radius:var(--r);background:var(--surface);border:1px solid var(--line);display:grid}
.cd-n{font-family:var(--hf);font-size:clamp(2rem,6vw,3.2rem);line-height:1;font-variant-numeric:tabular-nums;color:var(--a)}
.cd-l{font-size:.75rem;text-transform:uppercase;letter-spacing:.12em;color:var(--muted)}
.note{color:var(--muted);margin-top:1rem}
.panel{background:var(--surface);border:1px solid var(--line);border-radius:calc(var(--r) + 6px);padding:clamp(1.5rem,5vw,2.75rem)}
.panel h2{margin-bottom:.25rem}
.rsvp{display:grid;gap:1rem;margin-top:1.5rem}
label{display:grid;gap:.35rem;font-weight:600;font-size:.95rem}
input[type=text],input:not([type]),input[name]{font:inherit}
.rsvp input[name=name],.gb-form input{width:100%;padding:.85rem 1rem;border-radius:14px;border:1.5px solid var(--line);background:var(--bg);color:var(--text)}
input:focus-visible,button:focus-visible,a:focus-visible,summary:focus-visible{outline:3px solid var(--a);outline-offset:3px}
.choices{display:flex;gap:.6rem;flex-wrap:wrap}
.choice{display:flex;align-items:center;gap:.5rem;padding:.65rem 1rem;border-radius:999px;border:1.5px solid var(--line);cursor:pointer;font-weight:500}
.choice:has(input:checked){border-color:var(--a);background:color-mix(in srgb,var(--a) 14%,transparent)}
.choice input{accent-color:var(--a)}
.thanks{font-weight:700;color:var(--a);font-size:1.1rem}
blockquote p{font-family:var(--hf);font-size:clamp(1.6rem,4.5vw,2.6rem);line-height:1.15}
cite{display:block;margin-top:1rem;color:var(--muted);font-style:normal}
.timeline{list-style:none;border-left:3px solid var(--a);padding-left:1.5rem;display:grid;gap:1.4rem}
.timeline li{position:relative;display:grid;gap:.15rem}
.timeline li::before{content:"";position:absolute;left:calc(-1.5rem - 9px);top:.45rem;width:15px;height:15px;border-radius:50%;background:var(--a2);box-shadow:0 0 0 4px var(--bg)}
.when{font-family:var(--hf);color:var(--a);font-size:1.05rem}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,160px),1fr));gap:1rem;text-align:center}
.stat{padding:1.25rem;border-radius:var(--r);background:var(--surface);border:1px solid var(--line);display:flex;flex-direction:column-reverse}
.stat dd{font-family:var(--hf);font-size:clamp(2rem,6vw,3rem);line-height:1.1;color:var(--a)}
.stat dt{color:var(--muted);font-size:.9rem}
.gb-form{display:grid;grid-template-columns:1fr 2fr auto;gap:.6rem;margin-bottom:1.25rem}
@media(max-width:560px){.gb-form{grid-template-columns:1fr}}
.sr{position:relative}
.sr>:not(input){position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
.gb-form label{font-size:0;gap:0}
.gb{list-style:none;display:grid;gap:.6rem}
.gb li{display:grid;gap:.1rem;padding:.9rem 1.1rem;border-radius:16px;background:var(--surface);border:1px solid var(--line);animation:pop .4s cubic-bezier(.34,1.56,.64,1)}
.gb strong{font-size:.85rem;color:var(--a)}
.faq{border-bottom:1px solid var(--line);padding:1rem 0}
.faq summary{cursor:pointer;font-weight:700;font-size:1.1rem;list-style:none;display:flex;justify-content:space-between;gap:1rem}
.faq summary::after{content:"+";color:var(--a);font-size:1.4rem;line-height:1;transition:transform .25s}
.faq[open] summary::after{transform:rotate(45deg)}
.faq p{color:var(--muted);margin-top:.5rem}
.big{font-size:clamp(1.15rem,2.6vw,1.45rem)}
.foot{text-align:center;padding:3rem 1rem 4rem;color:var(--muted);font-size:.9rem;display:grid;gap:.35rem}
.foot a{color:var(--a);font-weight:700;text-decoration:none}
.reveal{opacity:0;transform:translateY(24px);transition:opacity .8s cubic-bezier(.16,1,.3,1),transform .8s cubic-bezier(.16,1,.3,1)}
.reveal.in{opacity:1;transform:none}
.confetti{position:fixed;top:-12px;width:10px;height:14px;border-radius:2px;pointer-events:none;z-index:99;animation:fall linear forwards}
@keyframes fall{to{transform:translate3d(var(--dx),110vh,0) rotate(var(--rot))}}
@keyframes drift{50%{transform:translate(8%,10%) scale(1.15)}}
@keyframes bob{50%{transform:translateY(-12px) rotate(-4deg)}}
@keyframes pop{from{opacity:0;transform:scale(.9)}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}.reveal{opacity:1;transform:none}}`;
}

/** Per-style-family overrides layered on top of the base CSS. */
function styleCss(style: StyleFamily): string {
  switch (style) {
    case "neon":
      return `.style-neon h1{text-shadow:0 0 18px var(--a),0 0 42px color-mix(in srgb,var(--a2) 60%,transparent)}
.style-neon .card,.style-neon .tile,.style-neon .cd,.style-neon .stat,.style-neon .panel{border-color:color-mix(in srgb,var(--a) 40%,transparent);box-shadow:0 0 0 1px color-mix(in srgb,var(--a) 15%,transparent),0 0 30px -10px var(--a)}
.style-neon .eyebrow{color:var(--a);font-family:ui-monospace,monospace}
body.style-neon{background-image:linear-gradient(color-mix(in srgb,var(--a) 7%,transparent) 1px,transparent 1px),linear-gradient(90deg,color-mix(in srgb,var(--a) 7%,transparent) 1px,transparent 1px);background-size:44px 44px}`;
    case "brutal":
      return `.style-brutal{--r:4px}
.style-brutal .card,.style-brutal .tile,.style-brutal .cd,.style-brutal .stat,.style-brutal .panel,.style-brutal .gb li{border:3px solid var(--text);box-shadow:6px 6px 0 var(--text)}
.style-brutal .btn{border-radius:4px;border:3px solid var(--text);box-shadow:5px 5px 0 var(--text)}
.style-brutal .btn:hover{box-shadow:8px 8px 0 var(--text)}
.style-brutal h1{text-transform:uppercase;letter-spacing:-.03em}
.style-brutal .hero-bg{opacity:.25;filter:blur(0)}
.style-brutal .hero-bg span{border-radius:0}`;
    case "retro":
      return `.style-retro h1{font-size:calc(clamp(1.6rem,6vw,3.6rem));line-height:1.3;text-shadow:4px 4px 0 var(--a2)}
.style-retro h2{font-size:clamp(1.1rem,3.5vw,1.8rem);line-height:1.4}
.style-retro h3{font-size:.9rem;line-height:1.5}
.style-retro body,.style-retro{font-size:22px}
.style-retro .card,.style-retro .tile,.style-retro .cd,.style-retro .panel,.style-retro .stat{--r:0;border:3px solid var(--a);box-shadow:6px 6px 0 var(--a2)}
.style-retro .btn{border-radius:0;box-shadow:5px 5px 0 var(--a2)}
.style-retro .cd-n,.style-retro .stat dd{font-size:clamp(1.2rem,4vw,2rem)}`;
    case "elegant":
      return `.style-elegant h1{font-weight:400;font-style:italic;letter-spacing:-.02em}
.style-elegant h2{font-weight:400;font-style:italic}
.style-elegant .eyebrow{letter-spacing:.3em}
.style-elegant .card,.style-elegant .tile,.style-elegant .panel,.style-elegant .cd{--r:2px;box-shadow:none}
.style-elegant .btn{background:transparent;color:var(--text);border:1px solid var(--text);box-shadow:none;letter-spacing:.1em;text-transform:uppercase;font-size:.85rem}
.style-elegant .btn:hover{background:var(--text);color:var(--bg)}
.style-elegant .hero-bg{opacity:.25}`;
    case "playful":
      return `.style-playful{--r:28px}
.style-playful .card:nth-child(odd){transform:rotate(-1.2deg)}
.style-playful .card:nth-child(even){transform:rotate(1deg)}
.style-playful .card:hover{transform:translateY(-6px) rotate(0)}
.style-playful .card,.style-playful .panel,.style-playful .cd{border:2.5px solid var(--text);box-shadow:5px 6px 0 var(--a2)}
.style-playful h1{-webkit-text-stroke:0}
.style-playful .btn{border:2.5px solid var(--text);box-shadow:4px 5px 0 var(--text)}`;
    case "cosy":
      return `.style-cosy{--r:18px}
.style-cosy .card,.style-cosy .tile,.style-cosy .panel{box-shadow:0 18px 40px -24px color-mix(in srgb,var(--text) 40%,transparent)}
.style-cosy h1{font-weight:600}`;
  }
}

/** Inline runtime: countdowns, confetti, RSVP + guestbook, scroll reveal. */
function runtimeJs(confetti: boolean, colours: string[]): string {
  return `(function(){
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
var C=${JSON.stringify(colours)};
function boom(n){if(reduce)return;for(var i=0;i<n;i++){var d=document.createElement('i');d.className='confetti';d.style.left=Math.random()*100+'vw';d.style.background=C[i%C.length];d.style.setProperty('--dx',(Math.random()*200-100)+'px');d.style.setProperty('--rot',(Math.random()*720)+'deg');d.style.animationDuration=(2+Math.random()*2)+'s';d.style.animationDelay=(Math.random()*.4)+'s';document.body.appendChild(d);setTimeout(function(x){return function(){x.remove()}}(d),4800)}}
${confetti ? "setTimeout(function(){boom(90)},350);" : ""}
document.querySelectorAll('[data-confetti]').forEach(function(b){b.addEventListener('click',function(){boom(60)})});
document.querySelectorAll('.countdown').forEach(function(el){var t=new Date(el.dataset.date+'T14:00:00').getTime();function tick(){var s=Math.max(0,Math.floor((t-Date.now())/1000));var v={days:Math.floor(s/86400),hours:Math.floor(s%86400/3600),mins:Math.floor(s%3600/60),secs:s%60};el.querySelectorAll('[data-u]').forEach(function(n){n.textContent=String(v[n.dataset.u]).padStart(2,'0')})}tick();setInterval(tick,1000)});
document.querySelectorAll('[data-rsvp]').forEach(function(f){f.addEventListener('submit',function(e){e.preventDefault();var th=f.querySelector('.thanks');var nm=f.elements.name.value||'Legend';var going=f.querySelector('input[name=going]:checked');th.textContent=going&&going.value==='no'?('No worries '+nm+', we\\'ll miss you 💛'):('Legend, '+nm+'! You\\'re on the list 🎉');th.hidden=false;if(!going||going.value!=='no')boom(80)})});
document.querySelectorAll('[data-guestbook]').forEach(function(f){f.addEventListener('submit',function(e){e.preventDefault();var ul=f.nextElementSibling;var li=document.createElement('li');var s=document.createElement('strong');s.textContent=f.elements.name.value;var m=document.createElement('span');m.textContent=f.elements.message.value;li.append(s,m);ul.prepend(li);f.reset();boom(30)})});
if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.12});document.querySelectorAll('.reveal').forEach(function(el){io.observe(el)})}else{document.querySelectorAll('.reveal').forEach(function(el){el.classList.add('in')})}
})();`;
}

/** Picks black or white text for legibility on a given accent colour. */
export function readableOn(hex: string): string {
  const m = hex.replace("#", "");
  const n = parseInt(m.length === 3 ? m.replace(/./g, "$&$&") : m, 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return lum > 0.55 ? "#0b0b0b" : "#ffffff";
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
}
