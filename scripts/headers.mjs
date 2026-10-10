// Genera public/_headers (Netlify) y una etiqueta <meta> (cualquier alojamiento) con una política de seguridad de contenidos (CSP) estricta:
// solo se ejecutan los scripts de esta web (los inline, por su huella SHA-256). Se ejecuta en cada build.
import fs from "node:fs";
import crypto from "node:crypto";

const pages = ["index.html", "admin.html"];
const hashes = new Set();
for (const p of pages) {
  const html = fs.readFileSync(new URL(`../public/${p}`, import.meta.url), "utf8");
  for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
    hashes.add(`'sha256-${crypto.createHash("sha256").update(m[1]).digest("base64")}'`);
  }
}
const csp = [
  "default-src 'self'",
  `script-src 'self' ${[...hashes].join(" ")}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "media-src 'self' data: blob:",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const out = `/*
  Content-Security-Policy: ${csp}
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  X-Frame-Options: DENY
  Cross-Origin-Opener-Policy: same-origin
`;
fs.writeFileSync(new URL("../public/_headers", import.meta.url), out);

// Además, la misma CSP como <meta> dentro de cada página: así funciona en cualquier alojamiento
// (Vercel no lee _headers). frame-ancestors no vale en <meta>: lo cubre la cabecera X-Frame-Options.
const metaCsp = csp.split("; ").filter(d => !d.startsWith("frame-ancestors")).join("; ");
for (const p of pages) {
  const url = new URL(`../public/${p}`, import.meta.url);
  let html = fs.readFileSync(url, "utf8");
  const tag = `<meta http-equiv="Content-Security-Policy" content="${metaCsp}">`;
  html = /<meta http-equiv="Content-Security-Policy"[^>]*>/.test(html)
    ? html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/, tag)
    : html.replace(/<meta charset="utf-8">/i, m => `${m}\n${tag}`);
  fs.writeFileSync(url, html);
}
console.log(`_headers: CSP con ${hashes.size} script(s) inline`);
