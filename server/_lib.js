import Anthropic from "@anthropic-ai/sdk";
// Utilidades compartidas por las funciones de /api (Vercel no publica archivos que empiezan por "_").

export const CFG = {
  get anthropicKey() { return process.env.ANTHROPIC_API_KEY; },
  // Pasarela de IA de Vercel: clave propia (AI_GATEWAY_API_KEY) o el token OIDC que Vercel da a cada función
  get gatewayKey() { return process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN; },
  get onVercel() { return !!process.env.VERCEL; },
  modelFree: process.env.MODEL_FREE || "claude-haiku-5-5",
  modelPremium: process.env.MODEL_PREMIUM || "claude-haiku-5-5",
  modelRead: process.env.MODEL_READ || "claude-haiku-5-5",
  freeDaily: Number(process.env.FREE_DAILY || 150),        // tope anti-abuso por móvil y día (la app es gratis y sin límite visible)
  freeDailyPerIp: Number(process.env.FREE_DAILY_PER_IP || 600), // tope anti-abuso por red (institutos, wifis compartidas)
  premiumDaily: Number(process.env.PREMIUM_DAILY || 100),   // generaciones Premium por día (tope anti-abuso)
  readsDaily: Number(process.env.READS_DAILY || 150),        // tandas de capturas leídas por dispositivo y día (gratis)
  readsDailyPremium: Number(process.env.READS_DAILY_PREMIUM || 150),
  stripeKey: process.env.STRIPE_SECRET_KEY,
  stripePrice: process.env.STRIPE_PRICE_ID,
  get siteUrl() { return (process.env.SITE_URL || "").replace(/\/$/, ""); },
  redisUrl: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  redisToken: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
};

/* ---------- HTTP ---------- */
export function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify(body));
}
export async function readJson(req, maxBytes = 6_000_000) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");
  const chunks = []; let size = 0;
  for await (const c of req) { size += c.length; if (size > maxBytes) throw Object.assign(new Error("too_large"), { status: 413 }); chunks.push(c); }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}
export function clientIp(req) {
  const xf = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return xf || req.socket?.remoteAddress || "0.0.0.0";
}
export const today = () => new Date().toISOString().slice(0, 10);

/* ---------- Almacén de contadores y licencias ----------
   Usa Upstash Redis si está configurado; si no, el almacén que ponga la plataforma
   (Netlify Blobs, ver server/netlify.js); y si no hay ninguno, memoria (solo desarrollo). */
const memory = new Map();
let kv = null;
export function setKV(adapter) { kv = adapter; }
export async function redis(cmd) {
  if ((!CFG.redisUrl || !CFG.redisToken) && kv) return kv(cmd);
  if (!CFG.redisUrl || !CFG.redisToken) {
    const [op, key, ...rest] = cmd;
    if (op === "INCR") { const v = (memory.get(key) || 0) + 1; memory.set(key, v); return v; }
    if (op === "GET") return memory.has(key) ? memory.get(key) : null;
    if (op === "SET") { memory.set(key, rest[0]); return "OK"; }
    if (op === "EXPIRE" || op === "DEL") { if (op === "DEL") memory.delete(key); return 1; }
    return null;
  }
  const r = await fetch(CFG.redisUrl, {
    method: "POST",
    headers: { authorization: `Bearer ${CFG.redisToken}`, "content-type": "application/json" },
    body: JSON.stringify(cmd),
  });
  if (!r.ok) throw new Error("redis_" + r.status);
  const j = await r.json();
  return j.result;
}
export async function bump(key, ttlSec = 60 * 60 * 26) {
  const n = await redis(["INCR", key]);
  if (n === 1) await redis(["EXPIRE", key, ttlSec]);
  return n;
}
export async function peek(key) { return Number((await redis(["GET", key])) || 0); }

/* ---------- Licencias Premium (Stripe, sin webhooks) ---------- */
async function stripe(path, { method = "GET", form } = {}) {
  const r = await fetch("https://api.stripe.com/v1/" + path, {
    method,
    headers: { authorization: `Bearer ${CFG.stripeKey}`, ...(form ? { "content-type": "application/x-www-form-urlencoded" } : {}) },
    body: form ? new URLSearchParams(form).toString() : undefined,
  });
  const j = await r.json();
  if (!r.ok) throw Object.assign(new Error(j?.error?.message || "stripe_error"), { status: 502 });
  return j;
}
export { stripe };

// Devuelve {premium: bool, customer?} para una licencia. Cachea el estado 1 hora.
export async function licenseStatus(license) {
  if (!license || !/^CUP-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(license)) return { premium: false };
  // Códigos regalados (sin pago): lista en la variable COMP_LICENSES, separados por comas
  const comp = String(process.env.COMP_LICENSES || "").split(",").map(x => x.trim().toUpperCase()).filter(Boolean);
  if (comp.includes(license)) return { premium: true, comp: true };
  if (!CFG.stripeKey) return { premium: false };
  const raw = await redis(["GET", "lic:" + license]);
  if (!raw) return { premium: false };
  const lic = typeof raw === "string" ? JSON.parse(raw) : raw;
  const cached = await redis(["GET", "licst:" + license]);
  if (cached === "1" || cached === 1) return { premium: true, customer: lic.customer };
  if (cached === "0" || cached === 0) return { premium: false, customer: lic.customer };
  let active = false;
  try {
    const sub = await stripe("subscriptions/" + encodeURIComponent(lic.subscription));
    active = ["active", "trialing", "past_due"].includes(sub.status);
  } catch { active = false; }
  await redis(["SET", "licst:" + license, active ? "1" : "0"]);
  await redis(["EXPIRE", "licst:" + license, 3600]);
  return { premium: active, customer: lic.customer };
}
export function newLicense() {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = () => Array.from(crypto.getRandomValues(new Uint8Array(4)), b => abc[b % abc.length]).join("");
  return `CUP-${part()}-${part()}-${part()}`;
}

/* ---------- Claude ----------
   Usa el SDK oficial, con tres formas de conectarse (la primera que esté disponible):
   1. ANTHROPIC_API_KEY: en Netlify la pone sola su pasarela de IA; fuera, tu propia clave de Anthropic.
   2. Pasarela de IA de Vercel (https://ai-gateway.vercel.sh): con AI_GATEWAY_API_KEY o con el token OIDC
      que Vercel manda a cada función (cabecera x-vercel-oidc-token), sin configurar nada. */
let client = null;
const GATEWAY = "https://ai-gateway.vercel.sh";
export function aiReady(oidc) { return !!(CFG.anthropicKey || CFG.gatewayKey || oidc); }
function aiClient(oidc) {
  if (CFG.anthropicKey) return (client ||= new Anthropic());
  return new Anthropic({ apiKey: process.env.AI_GATEWAY_API_KEY || oidc || process.env.VERCEL_OIDC_TOKEN, baseURL: GATEWAY });
}
// En la pasarela de Vercel los modelos se llaman "anthropic/claude-haiku-5.5"
const gatewayModel = m => /\//.test(m) ? m : "anthropic/" + m.replace(/^(claude-[a-z]+)-(\d+)-(\d+)$/, "$1-$2.$3");
export async function claude({ model, system, content, maxTokens = 1500, oidc }) {
  const ai = aiClient(oidc);
  if (!CFG.anthropicKey) model = gatewayModel(model);
  let j;
  try {
    j = await ai.messages.create({ model, max_tokens: maxTokens, system, messages: [{ role: "user", content }] });
  } catch (e) {
    const st = e?.status;
    const code = st === 429 || st === 529 ? "busy" : st === 400 && /image/i.test(e?.message || "") ? "image_rejected" : "upstream_error";
    throw Object.assign(new Error(e?.message || "claude_error"), { status: 502, code });
  }
  const text = (j.content || []).filter(b => b.type === "text").map(b => b.text).join("").trim();
  if (j.stop_reason === "refusal" || !text) throw Object.assign(new Error("refused"), { status: 422, code: "refused" });
  return text;
}
// Lee JSON con tolerancia: todo, un bloque ```json, del primer { al último }, o reparando una respuesta cortada.
export function parseJson(text) {
  // Arregla rangos copiados de la plantilla ("quimica":0-100)
  text = String(text || "").replace(/("\s*:\s*)(\d+)\s*-\s*\d+(?=\s*[,}])/g, "$1null");
  try { return JSON.parse(text); } catch {}
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) { try { return JSON.parse(fence[1]); } catch {} }
  const a = text.indexOf("{"), b = text.lastIndexOf("}");
  if (a >= 0 && b > a) { try { return JSON.parse(text.slice(a, b + 1)); } catch {} }
  if (a >= 0) { const r = repairJson(text.slice(a).replace(/```\s*$/, "")); if (r) return r; }
  throw Object.assign(new Error("invalid_json"), { status: 502, code: "invalid_json" });
}
// Cierra un JSON que se ha quedado a medias: prueba a cortar en cada coma (desde el final) y cerrar lo abierto.
function closers(s) {
  const stack = []; let inStr = false, esc = false;
  for (const ch of s) {
    if (inStr) { if (esc) esc = false; else if (ch === "\\") esc = true; else if (ch === '"') inStr = false; continue; }
    if (ch === '"') inStr = true;
    else if (ch === "{" || ch === "[") stack.push(ch === "{" ? "}" : "]");
    else if (ch === "}" || ch === "]") stack.pop();
  }
  return (inStr ? '"' : "") + stack.reverse().join("");
}
export function repairJson(s) {
  const cuts = [];
  for (let i = s.length - 1; i > 0 && cuts.length < 300; i--) if (s[i] === ",") cuts.push(i);
  cuts.push(s.length);
  for (const cut of cuts) {
    const head = s.slice(0, cut).replace(/[\s:]+$/, "");
    try { const v = JSON.parse(head + closers(head)); if (v && typeof v === "object") return v; } catch {}
  }
  return null;
}
