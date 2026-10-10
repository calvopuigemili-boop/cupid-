// POST /api/generate — genera abridores, respuestas, análisis de perfil o lee capturas.
// Cabeceras: x-device (id aleatorio del móvil), x-license (código Premium, opcional).
import crypto from "node:crypto";
import { CFG, send, readJson, clientIp, today, bump, peek, claude, parseJson, aiReady } from "./_lib.js";
import { cleanInput, buildTask } from "./_prompts.js";
import { examples, examplesBlock, sign } from "./_learn.js";

export default async function handler(req, res) {
  if (req.method === "GET") return usage(req, res);
  if (req.method !== "POST") return send(res, 405, { error: "method_not_allowed" });
  const oidc = String(req.headers["x-vercel-oidc-token"] || "") || undefined;
  if (!aiReady(oidc)) return send(res, 500, { error: "not_configured", message: "La IA aún no está activa." });

  let body;
  try { body = await readJson(req); } catch (e) { return send(res, e.status || 400, { error: e.status === 413 ? "too_large" : "bad_request" }); }
  const x = cleanInput(body);
  if (!x.task) return send(res, 400, { error: "bad_request" });

  const device = String(req.headers["x-device"] || "").replace(/[^a-zA-Z0-9-]/g, "").slice(0, 64);
  if (device.length < 16) return send(res, 400, { error: "bad_request" });
  // La IP nunca se guarda en claro: solo una huella que cambia cada día y se borra a las 48 h
  const ip = crypto.createHash("sha256").update(`${today()}|${clientIp(req)}|cupida`).digest("base64url").slice(0, 22);
  const day = today();
  const lic = { premium: false };   // Cupid@ es gratis: un solo nivel para todos

  // Topes anti-abuso (altos: el uso normal nunca llega)
  try {
    if (x.task === "read") {
      const n = await bump(`r:${day}:${device}`);
      if (n > (lic.premium ? CFG.readsDailyPremium : CFG.readsDaily)) return send(res, 429, { error: "reads_limit", message: "Has leído muchas capturas hoy. Vuelve mañana." });
    } else {
      const limit = lic.premium ? CFG.premiumDaily : CFG.freeDaily;
      const used = await peek(`g:${day}:${device}`);
      if (used >= limit) return send(res, 429, { error: lic.premium ? "premium_limit" : "free_limit", usage: { used, limit, premium: lic.premium } });
      if (!lic.premium) {
        const ipUsed = await bump(`ip:${day}:${ip}`);
        if (ipUsed > CFG.freeDailyPerIp) return send(res, 429, { error: "free_limit", usage: { used, limit, premium: false } });
      }
    }
  } catch { /* si Redis cae, no bloqueamos al usuario */ }

  // Lo que ha funcionado a otros usuarios con este mismo nivel, como inspiración
  const learned = (x.task === "open" || x.task === "reply") ? examplesBlock(await examples(x.task, x.level)) : "";
  const { system, prompt: basePrompt, json } = buildTask(x);
  const prompt = learned ? basePrompt.replace(/\nResponde SOLO con JSON/, learned + "\n\nResponde SOLO con JSON") : basePrompt;
  const content = [
    ...x.images.map(i => ({ type: "image", source: { type: "base64", media_type: i.media_type, data: i.data } })),
    { type: "text", text: prompt + (json ? "\n\nTu respuesta se va a leer con un programa: devuelve solo el JSON, sin texto alrededor." : "") },
  ];
  const model = x.task === "read" ? CFG.modelRead : lic.premium ? CFG.modelPremium : CFG.modelFree;

  const maxTokens = x.task === "read" ? 1200 : x.task === "reply" ? 3000 : 2200;
  const once = async () => {
    const text = await claude({ model, system, content, maxTokens, oidc });
    return json ? tidy(x, parseJson(text)) : text;
  };
  try {
    if (!json) return send(res, 200, { text: await once() });   // lectura de capturas: texto de apoyo, no se muestra como mensaje
    // Si la respuesta sale rota o sin mensajes, se repite una vez antes de molestar al usuario
    let data;
    try { data = await once(); }
    catch (e) { if (!["invalid_json", "upstream_error", "refused"].includes(e.code)) throw e; data = await once(); }
    if (needsRetry(x, data)) { try { const again = await once(); if (!needsRetry(x, again)) data = again; } catch {} }
    // Firma cada opción para poder aceptar luego votos solo sobre mensajes generados aquí
    if (Array.isArray(data.opciones)) for (const o of data.opciones) o.sig = await sign(x.task, x.level, String(o.tipo || ""), o.mensaje).catch(() => undefined);
    // Si lo pegado no era una conversación, no se gasta un mensaje
    const counts = !(x.task === "reply" && data.es_conversacion === false);
    const limit = lic.premium ? CFG.premiumDaily : CFG.freeDaily;
    const used = counts ? await bump(`g:${day}:${device}`).catch(() => null) : await peek(`g:${day}:${device}`).catch(() => null);
    // Marca legible por máquina de que el contenido lo ha generado una IA (Reglamento de IA, art. 50)
    res.setHeader("x-ai-generated", "true");
    return send(res, 200, { data, ai_generated: true, generator: "Cupid@ con Claude (Anthropic)", usage: { used, limit, premium: lic.premium } });
  } catch (e) {
    console.error("generate", x.task, e.code || "", e.message);
    return send(res, e.status || 502, { error: e.code || "upstream_error" });
  }
}

// Deja la respuesta de la IA con una forma fija para que la app nunca se trabe con campos raros
function tidy(x, d) {
  if (!d || typeof d !== "object" || Array.isArray(d)) throw Object.assign(new Error("invalid_json"), { status: 502, code: "invalid_json" });
  if (x.task !== "open" && x.task !== "reply") return d;
  const txt = v => (typeof v === "string" ? v.trim() : "");
  d.opciones = (Array.isArray(d.opciones) ? d.opciones : [])
    .filter(o => o && txt(o.mensaje))
    .slice(0, 3)
    .map(o => ({ tipo: txt(o.tipo) || "natural", mensaje: txt(o.mensaje), porque: txt(o.porque) }));
  d.lectura = txt(d.lectura);
  if (d.pareja && typeof d.pareja === "object") d.pareja = { nivel: txt(d.pareja.nivel).toLowerCase() || "ninguna", pista: txt(d.pareja.pista) };
  else delete d.pareja;
  if (x.task === "reply") {
    const no = d.es_conversacion === false || d.es_conversacion === "false";
    d.es_conversacion = x.force || d.opciones.length > 0 || !no;
    d.motivo = txt(d.motivo);
    d.mensajes = (Array.isArray(d.mensajes) ? d.mensajes : [])
      .filter(m => m && txt(m.texto))
      .slice(-12)
      .map(m => ({ de: /^(yo|usuario|user|me)$/i.test(txt(m.de)) ? "yo" : "otra", texto: txt(m.texto).slice(0, 600) }));
    const q = d.quimica == null || d.quimica === "" ? NaN : Number(d.quimica);
    if (Number.isFinite(q)) d.quimica = Math.max(0, Math.min(100, Math.round(q))); else delete d.quimica;
    d.siguiente_paso = txt(d.siguiente_paso);
  }
  return d;
}
function needsRetry(x, d) {
  if (x.task !== "open" && x.task !== "reply") return false;
  if (x.task === "reply" && d.es_conversacion === false) return false;
  return d.opciones.length === 0;
}

async function usage(req, res) {
  send(res, 200, { free: true });
}
